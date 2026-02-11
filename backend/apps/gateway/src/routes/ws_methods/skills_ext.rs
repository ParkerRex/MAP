use super::WsMethodError;
use crate::error::ApiError;
use crate::skills_runtime;
use crate::state::AppState;
use serde::de::DeserializeOwned;
use serde::Deserialize;
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::path::PathBuf;

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SkillsBinsParams {}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SkillsInstallParams {
    name: String,
    #[serde(alias = "install_id")]
    install_id: String,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<u64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SkillsUpdateParams {
    #[serde(alias = "skill_key")]
    skill_key: String,
    enabled: Option<bool>,
    #[serde(alias = "api_key")]
    api_key: Option<String>,
    env: Option<BTreeMap<String, String>>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
struct SkillRuntimeConfig {
    api_key: Option<String>,
    env: BTreeMap<String, String>,
}

pub(crate) async fn dispatch(
    method: &str,
    state: &AppState,
    params: Value,
) -> Result<Value, WsMethodError> {
    match method {
        "skills.bins" => skills_bins(state, params).await,
        "skills.install" => skills_install(state, params).await,
        "skills.update" => skills_update(state, params).await,
        _ => Err(WsMethodError::InvalidRequest(format!(
            "unsupported skills method `{method}`"
        ))),
    }
}

async fn skills_bins(state: &AppState, params: Value) -> Result<Value, WsMethodError> {
    let _ = parse_params::<SkillsBinsParams>(params, "skills.bins")?;

    let mut bins = BTreeSet::new();
    for record in skills_runtime::discover_skills(state) {
        let skill_file = PathBuf::from(&record.source_path).join("SKILL.md");
        let Ok(content) = tokio::fs::read_to_string(skill_file).await else {
            continue;
        };

        let Some(frontmatter) = extract_frontmatter(&content) else {
            continue;
        };

        for bin in collect_array_string_values(frontmatter, &["\"bins\"", "\"anyBins\""]) {
            bins.insert(bin);
        }
    }

    Ok(json!({
        "bins": bins.into_iter().collect::<Vec<_>>(),
    }))
}

async fn skills_install(state: &AppState, params: Value) -> Result<Value, WsMethodError> {
    let params = parse_params::<SkillsInstallParams>(params, "skills.install")?;

    let name = params.name.trim().to_string();
    if name.is_empty() {
        return Err(WsMethodError::InvalidRequest(
            "invalid skills.install params: name is required".to_string(),
        ));
    }

    let install_id = params.install_id.trim().to_string();
    if install_id.is_empty() {
        return Err(WsMethodError::InvalidRequest(
            "invalid skills.install params: installId is required".to_string(),
        ));
    }

    if let Some(timeout_ms) = params.timeout_ms {
        if timeout_ms < 1_000 {
            return Err(WsMethodError::InvalidRequest(
                "invalid skills.install params: timeoutMs must be >= 1000".to_string(),
            ));
        }
    }

    let Some(record) = skills_runtime::discover_skills(state)
        .into_iter()
        .find(|record| record.skill_key == name)
    else {
        return Err(WsMethodError::InvalidRequest(format!(
            "invalid skills.install params: unknown skill `{name}`"
        )));
    };

    let skill_file = PathBuf::from(&record.source_path).join("SKILL.md");
    let install_ids = match tokio::fs::read_to_string(skill_file).await {
        Ok(content) => extract_frontmatter(&content)
            .map(collect_install_ids)
            .unwrap_or_default(),
        Err(_) => BTreeSet::new(),
    };

    if install_ids.is_empty() {
        return Err(WsMethodError::Unavailable(format!(
            "`skills.install` is recognized but `{name}` does not expose install metadata"
        )));
    }

    if !install_ids.contains(&install_id) {
        return Err(WsMethodError::InvalidRequest(format!(
            "invalid skills.install params: installId `{install_id}` is not available for `{name}`"
        )));
    }

    Err(WsMethodError::Unavailable(format!(
        "`skills.install` is recognized but installer execution is not implemented yet (skill `{name}`, installId `{install_id}`)"
    )))
}

async fn skills_update(state: &AppState, params: Value) -> Result<Value, WsMethodError> {
    let params = parse_params::<SkillsUpdateParams>(params, "skills.update")?;

    let skill_key = params.skill_key.trim().to_string();
    if skill_key.is_empty() {
        return Err(WsMethodError::InvalidRequest(
            "invalid skills.update params: skillKey is required".to_string(),
        ));
    }

    let _ = skills_runtime::sync_skills_to_db(state).await?;

    let existing = sqlx::query_as::<_, (String, String, bool, Value)>(
        "select source_type, source_path, enabled, metadata from skills where skill_key = $1",
    )
    .bind(&skill_key)
    .fetch_optional(&state.pool)
    .await
    .map_err(ApiError::from)?;

    let (source_type, source_path, mut enabled, metadata) = if let Some(row) = existing {
        row
    } else {
        (
            "managed".to_string(),
            state
                .config
                .skills_managed_dir
                .join(&skill_key)
                .to_string_lossy()
                .to_string(),
            true,
            Value::Object(Map::new()),
        )
    };

    if let Some(next_enabled) = params.enabled {
        enabled = next_enabled;
    }

    let current_config = extract_runtime_config(&metadata);
    let next_config = apply_update_patch(current_config, &params);
    let next_metadata = upsert_runtime_config(metadata, &next_config);

    let (stored_enabled, stored_metadata) = sqlx::query_as::<_, (bool, Value)>(
        r#"
        insert into skills (skill_key, source_type, source_path, metadata, enabled)
        values ($1, $2, $3, $4, $5)
        on conflict (skill_key)
        do update set
          source_type = excluded.source_type,
          source_path = excluded.source_path,
          metadata = excluded.metadata,
          enabled = excluded.enabled,
          updated_at = now()
        returning enabled, metadata
        "#,
    )
    .bind(&skill_key)
    .bind(&source_type)
    .bind(&source_path)
    .bind(next_metadata)
    .bind(enabled)
    .fetch_one(&state.pool)
    .await
    .map_err(ApiError::from)?;

    let persisted_config = extract_runtime_config(&stored_metadata);
    Ok(build_update_payload(
        &skill_key,
        stored_enabled,
        &persisted_config,
    ))
}

fn parse_params<T: DeserializeOwned>(params: Value, method: &str) -> Result<T, WsMethodError> {
    serde_json::from_value::<T>(params)
        .map_err(|_| WsMethodError::InvalidRequest(format!("invalid {method} params")))
}

fn normalize_secret_input(value: &str) -> String {
    value
        .chars()
        .filter(|ch| !matches!(ch, '\r' | '\n' | '\u{2028}' | '\u{2029}'))
        .collect::<String>()
        .trim()
        .to_string()
}

fn apply_update_patch(
    mut current: SkillRuntimeConfig,
    params: &SkillsUpdateParams,
) -> SkillRuntimeConfig {
    if let Some(api_key) = params.api_key.as_deref() {
        let normalized = normalize_secret_input(api_key);
        if normalized.is_empty() {
            current.api_key = None;
        } else {
            current.api_key = Some(normalized);
        }
    }

    if let Some(env_patch) = &params.env {
        for (raw_key, raw_value) in env_patch {
            let key = raw_key.trim();
            if key.is_empty() {
                continue;
            }

            let value = raw_value.trim();
            if value.is_empty() {
                current.env.remove(key);
            } else {
                current.env.insert(key.to_string(), value.to_string());
            }
        }
    }

    current
}

fn extract_runtime_config(metadata: &Value) -> SkillRuntimeConfig {
    let mut config = SkillRuntimeConfig::default();

    let Some(config_obj) = metadata
        .get("openclaw")
        .and_then(Value::as_object)
        .and_then(|openclaw| openclaw.get("config"))
        .and_then(Value::as_object)
    else {
        return config;
    };

    if let Some(api_key) = config_obj.get("apiKey").and_then(Value::as_str) {
        let normalized = normalize_secret_input(api_key);
        if !normalized.is_empty() {
            config.api_key = Some(normalized);
        }
    }

    if let Some(env) = config_obj.get("env").and_then(Value::as_object) {
        for (key, value) in env {
            let key = key.trim();
            if key.is_empty() {
                continue;
            }
            let Some(value) = value.as_str() else {
                continue;
            };
            config.env.insert(key.to_string(), value.to_string());
        }
    }

    config
}

fn upsert_runtime_config(metadata: Value, config: &SkillRuntimeConfig) -> Value {
    let mut metadata_obj = metadata.as_object().cloned().unwrap_or_default();
    let mut openclaw_obj = metadata_obj
        .get("openclaw")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();

    if config.api_key.is_none() && config.env.is_empty() {
        openclaw_obj.remove("config");
    } else {
        let mut config_obj = Map::new();
        if let Some(api_key) = &config.api_key {
            config_obj.insert("apiKey".to_string(), Value::String(api_key.clone()));
        }
        if !config.env.is_empty() {
            let mut env_obj = Map::new();
            for (key, value) in &config.env {
                env_obj.insert(key.clone(), Value::String(value.clone()));
            }
            config_obj.insert("env".to_string(), Value::Object(env_obj));
        }
        openclaw_obj.insert("config".to_string(), Value::Object(config_obj));
    }

    if openclaw_obj.is_empty() {
        metadata_obj.remove("openclaw");
    } else {
        metadata_obj.insert("openclaw".to_string(), Value::Object(openclaw_obj));
    }

    Value::Object(metadata_obj)
}

fn build_update_payload(skill_key: &str, enabled: bool, config: &SkillRuntimeConfig) -> Value {
    let mut config_payload = Map::new();
    config_payload.insert("enabled".to_string(), Value::Bool(enabled));

    if let Some(api_key) = &config.api_key {
        config_payload.insert("apiKey".to_string(), Value::String(api_key.clone()));
    }

    if !config.env.is_empty() {
        let mut env_payload = Map::new();
        for (key, value) in &config.env {
            env_payload.insert(key.clone(), Value::String(value.clone()));
        }
        config_payload.insert("env".to_string(), Value::Object(env_payload));
    }

    json!({
        "ok": true,
        "skillKey": skill_key,
        "config": Value::Object(config_payload),
    })
}

fn extract_frontmatter(content: &str) -> Option<&str> {
    let mut lines = content.split_inclusive('\n');
    let first = lines.next()?;
    if first.trim() != "---" {
        return None;
    }

    let start = first.len();
    let mut offset = start;
    for line in lines {
        if line.trim() == "---" {
            return Some(&content[start..offset]);
        }
        offset += line.len();
    }

    None
}

fn find_matching_bracket(input: &str, start: usize) -> Option<usize> {
    let bytes = input.as_bytes();
    if bytes.get(start) != Some(&b'[') {
        return None;
    }

    let mut depth = 0i32;
    let mut in_string = false;
    let mut quote = b'\0';
    let mut escaped = false;

    for (index, byte) in bytes.iter().enumerate().skip(start) {
        if in_string {
            if escaped {
                escaped = false;
                continue;
            }
            if *byte == b'\\' {
                escaped = true;
                continue;
            }
            if *byte == quote {
                in_string = false;
            }
            continue;
        }

        if *byte == b'\'' || *byte == b'"' {
            in_string = true;
            quote = *byte;
            continue;
        }

        if *byte == b'[' {
            depth += 1;
            continue;
        }

        if *byte == b']' {
            depth -= 1;
            if depth == 0 {
                return Some(index);
            }
        }
    }

    None
}

fn parse_quoted_values(input: &str) -> Vec<String> {
    let chars = input.chars().collect::<Vec<_>>();
    let mut index = 0usize;
    let mut values = Vec::new();

    while index < chars.len() {
        let quote = chars[index];
        if quote != '\'' && quote != '"' {
            index += 1;
            continue;
        }

        index += 1;
        let mut escaped = false;
        let mut value = String::new();
        while index < chars.len() {
            let ch = chars[index];
            if escaped {
                value.push(ch);
                escaped = false;
                index += 1;
                continue;
            }

            if ch == '\\' {
                escaped = true;
                index += 1;
                continue;
            }

            if ch == quote {
                break;
            }

            value.push(ch);
            index += 1;
        }

        let trimmed = value.trim();
        if !trimmed.is_empty() {
            values.push(trimmed.to_string());
        }

        index += 1;
    }

    values
}

fn collect_array_string_values(frontmatter: &str, keys: &[&str]) -> Vec<String> {
    let mut values = Vec::new();

    for key in keys {
        let mut search_start = 0usize;
        while let Some(found) = frontmatter[search_start..].find(key) {
            let key_index = search_start + found + key.len();
            let Some(array_rel_start) = frontmatter[key_index..].find('[') else {
                break;
            };
            let array_start = key_index + array_rel_start;
            let Some(array_end) = find_matching_bracket(frontmatter, array_start) else {
                break;
            };
            let array_body = &frontmatter[array_start + 1..array_end];
            values.extend(parse_quoted_values(array_body));
            search_start = array_end + 1;
        }
    }

    values
}

fn collect_install_ids(frontmatter: &str) -> BTreeSet<String> {
    let mut install_ids = BTreeSet::new();

    let Some(install_key_index) = frontmatter.find("\"install\"") else {
        return install_ids;
    };
    let Some(array_rel_start) = frontmatter[install_key_index..].find('[') else {
        return install_ids;
    };
    let array_start = install_key_index + array_rel_start;
    let Some(array_end) = find_matching_bracket(frontmatter, array_start) else {
        return install_ids;
    };
    let install_block = &frontmatter[array_start + 1..array_end];

    for key in ["\"id\"", "'id'"] {
        let mut search_start = 0usize;
        while let Some(found) = install_block[search_start..].find(key) {
            let key_index = search_start + found + key.len();
            let Some(colon_rel) = install_block[key_index..].find(':') else {
                break;
            };
            let value_start = key_index + colon_rel + 1;
            let quoted = parse_quoted_values(&install_block[value_start..]);
            if let Some(value) = quoted.first() {
                install_ids.insert(value.clone());
            }
            search_start = value_start;
        }
    }

    install_ids
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_bins_params_rejects_unknown_fields() {
        let parsed = parse_params::<SkillsBinsParams>(json!({ "extra": true }), "skills.bins");
        assert!(parsed.is_err());

        match parsed.expect_err("expected invalid params error") {
            WsMethodError::InvalidRequest(message) => {
                assert_eq!(message, "invalid skills.bins params");
            }
            other => panic!("unexpected error variant: {other:?}"),
        }
    }

    #[test]
    fn collect_bins_includes_requires_anybins_and_install_bins() {
        let skill = r#"---
name: demo
metadata:
  {
    "openclaw": {
      "requires": {"bins": ["ffmpeg"], "anyBins": ["uv", "python3"]},
      "install": [
        {
          "id": "uv",
          "bins": ["tool-a", "tool-b"]
        }
      ]
    }
  }
---
"#;

        let frontmatter = extract_frontmatter(skill).expect("frontmatter expected");
        let mut bins = collect_array_string_values(frontmatter, &["\"bins\"", "\"anyBins\""]);
        bins.sort();
        bins.dedup();

        assert_eq!(bins, vec!["ffmpeg", "python3", "tool-a", "tool-b", "uv"]);
    }

    #[test]
    fn collect_install_ids_reads_install_block_ids_only() {
        let skill = r#"---
name: demo
metadata:
  {
    "openclaw": {
      "id": "outside-install-ignored",
      "install": [
        {"id": "brew"},
        {"id": "uv"}
      ]
    }
  }
---
"#;

        let frontmatter = extract_frontmatter(skill).expect("frontmatter expected");
        let ids = collect_install_ids(frontmatter);

        assert_eq!(ids, BTreeSet::from(["brew".to_string(), "uv".to_string()]));
    }

    #[test]
    fn apply_update_patch_normalizes_secret_and_env_values() {
        let params = SkillsUpdateParams {
            skill_key: "demo".to_string(),
            enabled: Some(true),
            api_key: Some("abc\r\ndef".to_string()),
            env: Some(BTreeMap::from([
                (" API_KEY ".to_string(), "  value  ".to_string()),
                ("EMPTY".to_string(), "   ".to_string()),
            ])),
        };

        let config = SkillRuntimeConfig {
            api_key: None,
            env: BTreeMap::from([
                ("EMPTY".to_string(), "old".to_string()),
                ("KEEP".to_string(), "y".to_string()),
            ]),
        };

        let updated = apply_update_patch(config, &params);
        assert_eq!(updated.api_key.as_deref(), Some("abcdef"));
        assert_eq!(
            updated.env.get("API_KEY").map(String::as_str),
            Some("value")
        );
        assert_eq!(updated.env.get("KEEP").map(String::as_str), Some("y"));
        assert!(!updated.env.contains_key("EMPTY"));
    }

    #[test]
    fn apply_update_patch_is_idempotent() {
        let params = SkillsUpdateParams {
            skill_key: "demo".to_string(),
            enabled: None,
            api_key: Some("abc\n123".to_string()),
            env: Some(BTreeMap::from([("A".to_string(), "B".to_string())])),
        };

        let once = apply_update_patch(SkillRuntimeConfig::default(), &params);
        let twice = apply_update_patch(once.clone(), &params);

        assert_eq!(once, twice);
    }
}
