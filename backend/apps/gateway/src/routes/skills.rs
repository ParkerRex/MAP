use crate::error::ApiError;
use crate::skills_runtime;
use crate::state::AppState;
use axum::extract::State;
use axum::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SkillsResponse {
    pub skills: Vec<skills_runtime::SkillRecord>,
    pub precedence: Vec<&'static str>,
}

pub async fn list_skills(State(state): State<AppState>) -> Result<Json<SkillsResponse>, ApiError> {
    let mut skills = skills_runtime::sync_skills_to_db(&state).await?;
    skills.sort_by(|left, right| left.skill_key.cmp(&right.skill_key));

    Ok(Json(SkillsResponse {
        skills,
        precedence: vec!["workspace", "managed", "bundled"],
    }))
}

pub async fn rescan_skills(
    State(state): State<AppState>,
) -> Result<Json<SkillsResponse>, ApiError> {
    list_skills(State(state)).await
}
