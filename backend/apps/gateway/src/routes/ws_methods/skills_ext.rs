use super::WsMethodError;
use crate::error::ApiError;
use crate::skills_runtime;
use crate::state::AppState;
use serde::de::DeserializeOwned;
use serde::Deserialize;
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::time::Duration;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

const SKILLS_INSTALL_TIMEOUT_MS_DEFAULT: u64 = 300_000;
const SKILLS_INSTALL_TIMEOUT_MS_MAX: u64 = 900_000;
const SKILLS_INSTALL_LOG_TAIL_MAX_CHARS: usize = 20_000;

#[derive(Debug, Clone)]
#[allow(dead_code)]
struct SkillInstallSpec {
    id: Option<String>,
    kind: String,
    label: Option<String>,
    bins: Vec<String>,
    os: Vec<String>,
    formula: Option<String>,
    package: Option<String>,
    module: Option<String>,
    url: Option<String>,
    archive: Option<String>,
    extract: Option<bool>,
    strip_components: Option<i64>,
    target_dir: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SkillInstallResult {
    ok: bool,
    message: String,
    stdout: String,
    stderr: String,
    code: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    warnings: Option<Vec<String>>,
}

#[derive(Debug)]
struct InstallCommandOutput {
    stdout: String,
    stderr: String,
    code: Option<i32>,
}

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

    let timeout_ms = params
        .timeout_ms
        .unwrap_or(SKILLS_INSTALL_TIMEOUT_MS_DEFAULT)
        .clamp(1_000, SKILLS_INSTALL_TIMEOUT_MS_MAX);

    let record = skills_runtime::discover_skills(state)
        .into_iter()
        .find(|record| record.skill_key == name);

    let Some(record) = record else {
        let result = SkillInstallResult {
            ok: false,
            message: format!("Skill not found: {name}"),
            stdout: String::new(),
            stderr: String::new(),
            code: None,
            warnings: None,
        };
        let payload = serde_json::to_value(&result)
            .unwrap_or_else(|_| json!({ "ok": false, "message": result.message }));
        return Err(WsMethodError::UnavailableWithPayload {
            message: result.message,
            payload,
        });
    };

    let skill_file = PathBuf::from(&record.source_path).join("SKILL.md");
    let content = tokio::fs::read_to_string(&skill_file).await.ok();
    let specs = content
        .as_deref()
        .and_then(extract_frontmatter)
        .map(parse_openclaw_install_specs)
        .unwrap_or_default();

    let mut selected_spec: Option<SkillInstallSpec> = None;
    for (index, spec) in specs.into_iter().enumerate() {
        if resolve_install_id(&spec, index) == install_id {
            selected_spec = Some(spec);
            break;
        }
    }

    let Some(spec) = selected_spec else {
        let result = SkillInstallResult {
            ok: false,
            message: format!("Installer not found: {install_id}"),
            stdout: String::new(),
            stderr: String::new(),
            code: None,
            warnings: None,
        };
        let payload = serde_json::to_value(&result)
            .unwrap_or_else(|_| json!({ "ok": false, "message": result.message }));
        return Err(WsMethodError::UnavailableWithPayload {
            message: result.message,
            payload,
        });
    };

    let result = execute_install_spec(&name, &spec, timeout_ms).await;
    let payload = serde_json::to_value(&result)
        .unwrap_or_else(|_| json!({ "ok": result.ok, "message": result.message }));

    if result.ok {
        Ok(payload)
    } else {
        Err(WsMethodError::UnavailableWithPayload {
            message: result.message,
            payload,
        })
    }
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

fn find_matching_brace(input: &str, start: usize) -> Option<usize> {
    let bytes = input.as_bytes();
    if bytes.get(start) != Some(&b'{') {
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

        if *byte == b'{' {
            depth += 1;
            continue;
        }

        if *byte == b'}' {
            depth -= 1;
            if depth == 0 {
                return Some(index);
            }
        }
    }

    None
}

fn extract_metadata_json5(frontmatter: &str) -> Option<String> {
    let mut offset = 0usize;
    for line in frontmatter.split_inclusive('\n') {
        let trimmed = line.trim_start();
        if !trimmed.starts_with("metadata:") {
            offset += line.len();
            continue;
        }

        let remainder = trimmed.trim_start_matches("metadata:").trim();
        let search_start = offset + line.len();
        let candidate = if remainder.contains('{') {
            // Inline metadata value.
            let inline_start = offset + (line.len() - trimmed.len()) + trimmed.find('{')?;
            inline_start
        } else {
            // Multiline metadata value.
            let rel = frontmatter[search_start..].find('{')?;
            search_start + rel
        };

        let end = find_matching_brace(frontmatter, candidate)?;
        return Some(frontmatter[candidate..=end].to_string());
    }

    None
}

fn parse_openclaw_install_specs(frontmatter: &str) -> Vec<SkillInstallSpec> {
    let Some(metadata_raw) = extract_metadata_json5(frontmatter) else {
        return Vec::new();
    };

    let parsed: Value = match json5::from_str(&metadata_raw) {
        Ok(value) => value,
        Err(_) => return Vec::new(),
    };

    let Some(openclaw) = parsed.get("openclaw").and_then(Value::as_object) else {
        return Vec::new();
    };
    let install_raw = openclaw.get("install").and_then(Value::as_array);
    let Some(install_raw) = install_raw else {
        return Vec::new();
    };

    install_raw
        .iter()
        .filter_map(parse_install_spec)
        .collect::<Vec<_>>()
}

fn normalize_string_list(value: Option<&Value>) -> Vec<String> {
    let Some(value) = value else {
        return Vec::new();
    };
    if let Some(array) = value.as_array() {
        return array
            .iter()
            .filter_map(Value::as_str)
            .map(|entry| entry.trim().to_string())
            .filter(|entry| !entry.is_empty())
            .collect();
    }
    if let Some(text) = value.as_str() {
        return text
            .split(',')
            .map(|entry| entry.trim().to_string())
            .filter(|entry| !entry.is_empty())
            .collect();
    }
    Vec::new()
}

fn parse_install_spec(value: &Value) -> Option<SkillInstallSpec> {
    let object = value.as_object()?;

    let kind_raw = object
        .get("kind")
        .or_else(|| object.get("type"))
        .and_then(Value::as_str)?;
    let kind = kind_raw.trim().to_lowercase();
    if kind != "brew" && kind != "node" && kind != "go" && kind != "uv" && kind != "download" {
        return None;
    }

    let id = object
        .get("id")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let label = object
        .get("label")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let formula = object
        .get("formula")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let package = object
        .get("package")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let module = object
        .get("module")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let url = object
        .get("url")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let archive = object
        .get("archive")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    let extract = object.get("extract").and_then(Value::as_bool);

    let strip_components = object
        .get("stripComponents")
        .and_then(Value::as_i64)
        .or_else(|| {
            object
                .get("stripComponents")
                .and_then(Value::as_f64)
                .map(|value| value.floor() as i64)
        });

    let target_dir = object
        .get("targetDir")
        .and_then(Value::as_str)
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    Some(SkillInstallSpec {
        id,
        kind,
        label,
        bins: normalize_string_list(object.get("bins")),
        os: normalize_string_list(object.get("os")),
        formula,
        package,
        module,
        url,
        archive,
        extract,
        strip_components,
        target_dir,
    })
}

fn resolve_install_id(spec: &SkillInstallSpec, index: usize) -> String {
    spec.id
        .as_deref()
        .unwrap_or(&format!("{}-{index}", spec.kind))
        .trim()
        .to_string()
}

async fn execute_install_spec(
    skill_key: &str,
    spec: &SkillInstallSpec,
    timeout_ms: u64,
) -> SkillInstallResult {
    match spec.kind.as_str() {
        "download" => install_download_spec(skill_key, spec, timeout_ms).await,
        _ => install_command_spec(spec, timeout_ms).await,
    }
}

async fn install_command_spec(spec: &SkillInstallSpec, timeout_ms: u64) -> SkillInstallResult {
    let brew_exe = resolve_brew_executable();

    if spec.kind == "brew" && brew_exe.is_none() {
        return SkillInstallResult {
            ok: false,
            message: "brew not installed".to_string(),
            stdout: String::new(),
            stderr: String::new(),
            code: None,
            warnings: None,
        };
    }

    if spec.kind == "uv" && !has_binary("uv") {
        if let Some(brew) = &brew_exe {
            let argv = vec![
                brew.to_string_lossy().to_string(),
                "install".to_string(),
                "uv".to_string(),
            ];
            let _ = run_command_with_timeout(&argv, None, timeout_ms, None).await;
        } else {
            return SkillInstallResult {
                ok: false,
                message: "uv not installed (install via brew)".to_string(),
                stdout: String::new(),
                stderr: String::new(),
                code: None,
                warnings: None,
            };
        }
    }

    if spec.kind == "go" && !has_binary("go") {
        if let Some(brew) = &brew_exe {
            let argv = vec![
                brew.to_string_lossy().to_string(),
                "install".to_string(),
                "go".to_string(),
            ];
            let _ = run_command_with_timeout(&argv, None, timeout_ms, None).await;
        } else {
            return SkillInstallResult {
                ok: false,
                message: "go not installed (install via brew)".to_string(),
                stdout: String::new(),
                stderr: String::new(),
                code: None,
                warnings: None,
            };
        }
    }

    let argv = match build_install_command(spec, brew_exe.as_deref()) {
        Ok(argv) => argv,
        Err(message) => {
            return SkillInstallResult {
                ok: false,
                message,
                stdout: String::new(),
                stderr: String::new(),
                code: None,
                warnings: None,
            }
        }
    };

    let env = if spec.kind == "go" {
        if let Some(brew) = brew_exe.as_deref() {
            resolve_brew_bin_dir(timeout_ms, brew)
                .await
                .map(|bin| BTreeMap::from([("GOBIN".to_string(), bin)]))
        } else {
            None
        }
    } else {
        None
    };

    let output = run_command_with_timeout(&argv, None, timeout_ms, env.as_ref()).await;
    let success = output.code == Some(0);
    SkillInstallResult {
        ok: success,
        message: if success {
            "Installed".to_string()
        } else {
            format_install_failure_message(&output)
        },
        stdout: output.stdout,
        stderr: output.stderr,
        code: output.code,
        warnings: None,
    }
}

fn build_install_command(
    spec: &SkillInstallSpec,
    brew_exe: Option<&Path>,
) -> Result<Vec<String>, String> {
    match spec.kind.as_str() {
        "brew" => {
            let Some(formula) = spec.formula.as_deref() else {
                return Err("missing brew formula".to_string());
            };
            let brew = brew_exe
                .map(|path| path.to_string_lossy().to_string())
                .unwrap_or_else(|| "brew".to_string());
            Ok(vec![brew, "install".to_string(), formula.to_string()])
        }
        "node" => {
            let Some(package) = spec.package.as_deref() else {
                return Err("missing node package".to_string());
            };
            Ok(build_node_install_command(package))
        }
        "go" => {
            let Some(module) = spec.module.as_deref() else {
                return Err("missing go module".to_string());
            };
            Ok(vec![
                "go".to_string(),
                "install".to_string(),
                module.to_string(),
            ])
        }
        "uv" => {
            let Some(package) = spec.package.as_deref() else {
                return Err("missing uv package".to_string());
            };
            Ok(vec![
                "uv".to_string(),
                "tool".to_string(),
                "install".to_string(),
                package.to_string(),
            ])
        }
        "download" => Err("download install handled separately".to_string()),
        _ => Err("unsupported installer".to_string()),
    }
}

fn has_binary(bin: &str) -> bool {
    if bin.trim().is_empty() {
        return false;
    }

    let Some(path_var) = std::env::var_os("PATH") else {
        return false;
    };

    for entry in std::env::split_paths(&path_var) {
        if entry.as_os_str().is_empty() {
            continue;
        }
        let candidate = entry.join(bin);
        if candidate.is_file() {
            return true;
        }
    }

    false
}

fn resolve_brew_executable() -> Option<PathBuf> {
    if has_binary("brew") {
        return Some(PathBuf::from("brew"));
    }

    for candidate in ["/opt/homebrew/bin/brew", "/usr/local/bin/brew"] {
        let path = PathBuf::from(candidate);
        if path.is_file() {
            return Some(path);
        }
    }

    None
}

async fn resolve_brew_bin_dir(timeout_ms: u64, brew_exe: &Path) -> Option<String> {
    let argv = vec![
        brew_exe.to_string_lossy().to_string(),
        "--prefix".to_string(),
    ];
    let output = run_command_with_timeout(&argv, None, timeout_ms.min(30_000), None).await;
    if output.code == Some(0) {
        let prefix = output.stdout.trim();
        if !prefix.is_empty() {
            return Some(
                PathBuf::from(prefix)
                    .join("bin")
                    .to_string_lossy()
                    .to_string(),
            );
        }
    }

    if let Ok(prefix) = std::env::var("HOMEBREW_PREFIX") {
        let prefix = prefix.trim();
        if !prefix.is_empty() {
            return Some(
                PathBuf::from(prefix)
                    .join("bin")
                    .to_string_lossy()
                    .to_string(),
            );
        }
    }

    for candidate in ["/opt/homebrew/bin", "/usr/local/bin"] {
        if PathBuf::from(candidate).is_dir() {
            return Some(candidate.to_string());
        }
    }

    None
}

fn build_node_install_command(package_name: &str) -> Vec<String> {
    if has_binary("pnpm") {
        return vec![
            "pnpm".to_string(),
            "add".to_string(),
            "-g".to_string(),
            package_name.to_string(),
        ];
    }
    if has_binary("yarn") {
        return vec![
            "yarn".to_string(),
            "global".to_string(),
            "add".to_string(),
            package_name.to_string(),
        ];
    }
    if has_binary("bun") {
        return vec![
            "bun".to_string(),
            "add".to_string(),
            "-g".to_string(),
            package_name.to_string(),
        ];
    }

    vec![
        "npm".to_string(),
        "install".to_string(),
        "-g".to_string(),
        package_name.to_string(),
    ]
}

async fn install_download_spec(
    skill_key: &str,
    spec: &SkillInstallSpec,
    timeout_ms: u64,
) -> SkillInstallResult {
    let Some(url) = spec
        .url
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    else {
        return SkillInstallResult {
            ok: false,
            message: "missing download url".to_string(),
            stdout: String::new(),
            stderr: String::new(),
            code: None,
            warnings: None,
        };
    };

    let filename = resolve_download_filename(url).unwrap_or_else(|| "download".to_string());

    let target_dir = if let Some(target_dir) = spec.target_dir.as_deref() {
        expand_tilde(target_dir)
    } else {
        resolve_openclaw_state_dir().join("tools").join(skill_key)
    };

    if let Err(error) = tokio::fs::create_dir_all(&target_dir).await {
        let message = format!("failed to create download directory: {error}");
        return SkillInstallResult {
            ok: false,
            message: message.clone(),
            stdout: String::new(),
            stderr: message,
            code: None,
            warnings: None,
        };
    }

    let archive_path = target_dir.join(&filename);
    let downloaded_bytes = match download_file(url, &archive_path, timeout_ms).await {
        Ok(bytes) => bytes,
        Err(message) => {
            return SkillInstallResult {
                ok: false,
                message: message.clone(),
                stdout: String::new(),
                stderr: message,
                code: None,
                warnings: None,
            };
        }
    };

    let archive_type = resolve_archive_type(spec, &filename);
    let should_extract = spec.extract.unwrap_or(archive_type.is_some());
    if !should_extract {
        return SkillInstallResult {
            ok: true,
            message: format!("Downloaded to {}", archive_path.to_string_lossy()),
            stdout: format!("downloaded={downloaded_bytes}"),
            stderr: String::new(),
            code: Some(0),
            warnings: None,
        };
    }

    let Some(archive_type) = archive_type else {
        return SkillInstallResult {
            ok: false,
            message: "extract requested but archive type could not be detected".to_string(),
            stdout: String::new(),
            stderr: String::new(),
            code: None,
            warnings: None,
        };
    };

    let extract_result = extract_archive(
        &archive_path,
        &archive_type,
        &target_dir,
        spec.strip_components,
        timeout_ms,
    )
    .await;
    let success = extract_result.code == Some(0);

    SkillInstallResult {
        ok: success,
        message: if success {
            format!(
                "Downloaded and extracted to {}",
                target_dir.to_string_lossy()
            )
        } else {
            format_install_failure_message(&extract_result)
        },
        stdout: extract_result.stdout,
        stderr: extract_result.stderr,
        code: extract_result.code,
        warnings: None,
    }
}

fn resolve_download_filename(url: &str) -> Option<String> {
    if let Ok(parsed) = reqwest::Url::parse(url) {
        let path = parsed.path();
        if let Some(name) = Path::new(path).file_name().and_then(|value| value.to_str()) {
            let trimmed = name.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }

    let trimmed = url.trim();
    let without_query = trimmed.split('?').next().unwrap_or(trimmed);
    let name = without_query
        .rsplit('/')
        .next()
        .unwrap_or(without_query)
        .trim();
    if name.is_empty() {
        None
    } else {
        Some(name.to_string())
    }
}

fn resolve_archive_type(spec: &SkillInstallSpec, filename: &str) -> Option<String> {
    if let Some(explicit) = spec.archive.as_deref() {
        let explicit = explicit.trim().to_lowercase();
        if !explicit.is_empty() {
            if explicit == "zip" {
                return Some("zip".to_string());
            }
            return Some("tar".to_string());
        }
    }

    let lower = filename.to_lowercase();
    if lower.ends_with(".zip") {
        return Some("zip".to_string());
    }
    if lower.ends_with(".tar.gz")
        || lower.ends_with(".tgz")
        || lower.ends_with(".tar.bz2")
        || lower.ends_with(".tbz2")
        || lower.ends_with(".tar.xz")
        || lower.ends_with(".txz")
        || lower.ends_with(".tar")
    {
        return Some("tar".to_string());
    }
    None
}

fn resolve_openclaw_state_dir() -> PathBuf {
    std::env::var("OPENCLAW_STATE_DIR")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".openclaw")
        })
}

fn expand_tilde(value: &str) -> PathBuf {
    let trimmed = value.trim();
    if trimmed == "~" {
        return dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    }
    if let Some(rest) = trimmed.strip_prefix("~/") {
        return dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(rest);
    }
    PathBuf::from(trimmed)
}

async fn download_file(url: &str, dest: &Path, timeout_ms: u64) -> Result<u64, String> {
    let url = url.to_string();
    let dest = dest.to_path_buf();
    let timeout = Duration::from_millis(timeout_ms.max(1));

    tokio::time::timeout(timeout, async move {
        let client = reqwest::Client::builder()
            .redirect(reqwest::redirect::Policy::limited(10))
            .build()
            .map_err(|error| error.to_string())?;

        let mut response = client
            .get(url)
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(format!("download failed (HTTP {})", response.status()));
        }

        let mut file = tokio::fs::File::create(&dest)
            .await
            .map_err(|error| error.to_string())?;

        let mut bytes: u64 = 0;
        while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
            bytes += chunk.len() as u64;
            file.write_all(&chunk)
                .await
                .map_err(|error| error.to_string())?;
        }
        file.flush().await.map_err(|error| error.to_string())?;

        Ok(bytes)
    })
    .await
    .map_err(|_| format!("download timed out after {timeout_ms}ms"))?
}

async fn extract_archive(
    archive_path: &Path,
    archive_type: &str,
    target_dir: &Path,
    strip_components: Option<i64>,
    timeout_ms: u64,
) -> InstallCommandOutput {
    if archive_type == "zip" {
        if !has_binary("unzip") {
            return InstallCommandOutput {
                stdout: String::new(),
                stderr: "unzip not found on PATH".to_string(),
                code: None,
            };
        }

        let argv = vec![
            "unzip".to_string(),
            "-q".to_string(),
            archive_path.to_string_lossy().to_string(),
            "-d".to_string(),
            target_dir.to_string_lossy().to_string(),
        ];
        return run_command_with_timeout(&argv, None, timeout_ms, None).await;
    }

    if !has_binary("tar") {
        return InstallCommandOutput {
            stdout: String::new(),
            stderr: "tar not found on PATH".to_string(),
            code: None,
        };
    }

    let mut argv = vec![
        "tar".to_string(),
        "xf".to_string(),
        archive_path.to_string_lossy().to_string(),
        "-C".to_string(),
        target_dir.to_string_lossy().to_string(),
    ];
    if let Some(strip) = strip_components {
        let normalized = strip.max(0);
        argv.push("--strip-components".to_string());
        argv.push(normalized.to_string());
    }

    run_command_with_timeout(&argv, None, timeout_ms, None).await
}

async fn run_command_with_timeout(
    argv: &[String],
    cwd: Option<&Path>,
    timeout_ms: u64,
    env: Option<&BTreeMap<String, String>>,
) -> InstallCommandOutput {
    let Some((program, args)) = argv.split_first() else {
        return InstallCommandOutput {
            stdout: String::new(),
            stderr: "invalid install command".to_string(),
            code: None,
        };
    };

    let mut command = Command::new(program);
    command
        .args(args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    if let Some(cwd) = cwd {
        command.current_dir(cwd);
    }

    if let Some(env) = env {
        for (key, value) in env {
            command.env(key, value);
        }
    }

    let timed =
        tokio::time::timeout(Duration::from_millis(timeout_ms.max(1)), command.output()).await;
    match timed {
        Ok(Ok(output)) => InstallCommandOutput {
            stdout: trim_log_tail(
                String::from_utf8_lossy(&output.stdout).as_ref(),
                SKILLS_INSTALL_LOG_TAIL_MAX_CHARS,
            )
            .unwrap_or_default(),
            stderr: trim_log_tail(
                String::from_utf8_lossy(&output.stderr).as_ref(),
                SKILLS_INSTALL_LOG_TAIL_MAX_CHARS,
            )
            .unwrap_or_default(),
            code: output.status.code(),
        },
        Ok(Err(error)) => InstallCommandOutput {
            stdout: String::new(),
            stderr: error.to_string(),
            code: None,
        },
        Err(_) => InstallCommandOutput {
            stdout: String::new(),
            stderr: format!("command timed out after {timeout_ms}ms"),
            code: None,
        },
    }
}

fn trim_log_tail(input: &str, max_chars: usize) -> Option<String> {
    let text = input.trim_end();
    if text.is_empty() {
        return None;
    }

    let total_chars = text.chars().count();
    if total_chars <= max_chars {
        return Some(text.to_string());
    }

    let mut reversed = text.chars().rev().take(max_chars).collect::<Vec<_>>();
    reversed.reverse();
    let tail = reversed.into_iter().collect::<String>();
    Some(format!("...{tail}"))
}

fn summarize_install_output(text: &str) -> Option<String> {
    let raw = text.trim();
    if raw.is_empty() {
        return None;
    }

    let lines = raw
        .split('\n')
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect::<Vec<_>>();
    if lines.is_empty() {
        return None;
    }

    let preferred = lines
        .iter()
        .copied()
        .find(|line| line.to_lowercase().starts_with("error"))
        .or_else(|| {
            lines.iter().copied().find(|line| {
                line.to_lowercase().contains("error:") || line.to_lowercase().contains("failed")
            })
        })
        .or_else(|| lines.last().copied());

    let preferred = preferred?;
    let normalized = preferred.split_whitespace().collect::<Vec<_>>().join(" ");
    let max_len = 200usize;
    if normalized.chars().count() > max_len {
        Some(normalized.chars().take(max_len - 1).collect::<String>())
    } else {
        Some(normalized)
    }
}

fn format_install_failure_message(result: &InstallCommandOutput) -> String {
    let code = result
        .code
        .map(|value| format!("exit {value}"))
        .unwrap_or_else(|| "unknown exit".to_string());
    let summary = summarize_install_output(&result.stderr)
        .or_else(|| summarize_install_output(&result.stdout));
    match summary {
        Some(summary) if !summary.is_empty() => format!("Install failed ({code}): {summary}"),
        _ => format!("Install failed ({code})"),
    }
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
    fn parse_openclaw_install_specs_filters_unknown_kinds_and_supports_fallback_ids() {
        let skill = r#"---
name: demo
metadata:
  {
    "openclaw": {
      "install": [
        {"id": "brew", "kind": "brew", "formula": "jq"},
        {"id": "apt", "kind": "apt", "package": "jq"},
        {"kind": "uv", "package": "nano-pdf"}
      ]
    }
  }
---
"#;

        let frontmatter = extract_frontmatter(skill).expect("frontmatter expected");
        let specs = parse_openclaw_install_specs(frontmatter);

        assert_eq!(specs.len(), 2);
        assert_eq!(specs[0].kind, "brew");
        assert_eq!(specs[0].id.as_deref(), Some("brew"));
        assert_eq!(specs[1].kind, "uv");
        assert_eq!(specs[1].id.as_deref(), None);
        assert_eq!(resolve_install_id(&specs[1], 1), "uv-1");
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
