use crate::error::ApiError;
use crate::state::AppState;
use serde::Serialize;
use serde_json::json;
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
pub struct SkillRecord {
    pub skill_key: String,
    pub description: String,
    pub source_type: String,
    pub source_path: String,
}

fn parse_skill_file(content: &str) -> Option<(String, String)> {
    let mut name: Option<String> = None;
    let mut description: Option<String> = None;

    for line in content.lines() {
        let trimmed = line.trim();
        if let Some(value) = trimmed.strip_prefix("name:") {
            let parsed = value
                .trim()
                .trim_matches('"')
                .trim_matches('\'')
                .to_string();
            if !parsed.is_empty() {
                name = Some(parsed);
            }
        }
        if let Some(value) = trimmed.strip_prefix("description:") {
            let parsed = value
                .trim()
                .trim_matches('"')
                .trim_matches('\'')
                .to_string();
            if !parsed.is_empty() {
                description = Some(parsed);
            }
        }

        if name.is_some() && description.is_some() {
            break;
        }
    }

    name.map(|name_value| (name_value, description.unwrap_or_default()))
}

fn collect_skills_from_dir(root: &Path, source_type: &str) -> Vec<SkillRecord> {
    let mut records = Vec::new();

    let entries = match fs::read_dir(root) {
        Ok(entries) => entries,
        Err(_) => return records,
    };

    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };
        if !file_type.is_dir() {
            continue;
        }

        let skill_dir = entry.path();
        let skill_file = skill_dir.join("SKILL.md");
        if !skill_file.exists() {
            continue;
        }

        let Ok(content) = fs::read_to_string(&skill_file) else {
            continue;
        };

        let Some((name, description)) = parse_skill_file(&content) else {
            continue;
        };

        records.push(SkillRecord {
            skill_key: name,
            description,
            source_type: source_type.to_string(),
            source_path: skill_dir.to_string_lossy().to_string(),
        });
    }

    records
}

pub fn discover_skills(state: &AppState) -> Vec<SkillRecord> {
    let mut merged = HashMap::<String, SkillRecord>::new();

    let low_to_high: Vec<(PathBuf, &str)> = vec![
        (state.config.skills_bundled_dir.clone(), "bundled"),
        (state.config.skills_managed_dir.clone(), "managed"),
        (state.config.skills_workspace_dir.clone(), "workspace"),
    ];

    for (root, source_type) in low_to_high {
        for record in collect_skills_from_dir(&root, source_type) {
            merged.insert(record.skill_key.clone(), record);
        }
    }

    let mut values = merged.into_values().collect::<Vec<_>>();
    values.sort_by(|left, right| left.skill_key.cmp(&right.skill_key));
    values
}

pub async fn sync_skills_to_db(state: &AppState) -> Result<Vec<SkillRecord>, ApiError> {
    let records = discover_skills(state);

    for record in &records {
        sqlx::query(
            r#"
            insert into skills (skill_key, source_type, source_path, metadata, enabled)
            values ($1, $2, $3, $4, true)
            on conflict (skill_key)
            do update set
              source_type = excluded.source_type,
              source_path = excluded.source_path,
              metadata = excluded.metadata,
              updated_at = now()
            "#,
        )
        .bind(&record.skill_key)
        .bind(&record.source_type)
        .bind(&record.source_path)
        .bind(json!({
            "description": record.description,
        }))
        .execute(&state.pool)
        .await?;
    }

    Ok(records)
}
