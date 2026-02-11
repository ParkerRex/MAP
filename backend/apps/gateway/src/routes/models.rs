use crate::error::ApiError;
use crate::model_runtime;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

fn canonical_provider(provider: &str) -> String {
    match provider.trim().to_lowercase().as_str() {
        "kimi" | "moonshot-ai" | "moonshotai" => "moonshot".to_string(),
        value => value.to_string(),
    }
}

#[derive(Debug, Serialize)]
pub struct ModelsResponse {
    pub primary_model: String,
    pub fallback_models: Vec<String>,
    pub providers: Vec<ProviderSummary>,
    pub failover_strategy: &'static str,
}

#[derive(Debug, Serialize)]
pub struct ProviderSummary {
    pub provider: String,
    pub base_url: String,
    pub env_key_configured: bool,
}

#[derive(Debug, Serialize, FromRow)]
pub struct AuthProfileRow {
    pub id: Uuid,
    pub provider: String,
    pub profile_id: String,
    pub profile_type: String,
    pub payload: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertAuthProfileRequest {
    pub provider: String,
    pub profile_id: String,
    pub profile_type: String,
    pub payload: Value,
}

#[derive(Debug, Deserialize)]
pub struct GenerateRequest {
    pub prompt: String,
    pub model: Option<String>,
    pub fallback_models: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct GenerateResponse {
    pub model_used: String,
    pub output: String,
    pub attempts: Vec<model_runtime::ModelAttempt>,
}

pub async fn list_models(State(state): State<AppState>) -> Json<ModelsResponse> {
    let mut providers = state
        .config
        .providers
        .values()
        .map(|provider| ProviderSummary {
            provider: provider.provider.clone(),
            base_url: provider.base_url.clone(),
            env_key_configured: provider.env_api_key.is_some(),
        })
        .collect::<Vec<_>>();
    providers.sort_by(|left, right| left.provider.cmp(&right.provider));

    Json(ModelsResponse {
        primary_model: state.config.primary_model.clone(),
        fallback_models: state.config.fallback_models.clone(),
        providers,
        failover_strategy: "auth-profile-rotation-then-model-fallback",
    })
}

pub async fn list_profiles(
    State(state): State<AppState>,
) -> Result<Json<Vec<AuthProfileRow>>, ApiError> {
    let profiles = sqlx::query_as::<_, AuthProfileRow>(
        r#"
        select id, provider, profile_id, profile_type, payload, created_at, updated_at
        from auth_profiles
        order by provider asc, profile_id asc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(profiles))
}

pub async fn upsert_profile(
    State(state): State<AppState>,
    Json(payload): Json<UpsertAuthProfileRequest>,
) -> Result<Json<AuthProfileRow>, ApiError> {
    if payload.provider.trim().is_empty()
        || payload.profile_id.trim().is_empty()
        || payload.profile_type.trim().is_empty()
    {
        return Err(ApiError::BadRequest(
            "provider, profile_id, and profile_type are required".to_string(),
        ));
    }

    let row = sqlx::query_as::<_, AuthProfileRow>(
        r#"
        insert into auth_profiles (provider, profile_id, profile_type, payload)
        values ($1, $2, $3, $4)
        on conflict (provider, profile_id)
        do update set
          profile_type = excluded.profile_type,
          payload = excluded.payload,
          updated_at = now()
        returning id, provider, profile_id, profile_type, payload, created_at, updated_at
        "#,
    )
    .bind(canonical_provider(&payload.provider))
    .bind(payload.profile_id.trim())
    .bind(payload.profile_type.trim().to_lowercase())
    .bind(payload.payload)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(row))
}

#[cfg(test)]
mod tests {
    use super::canonical_provider;

    #[test]
    fn canonical_provider_normalizes_kimi_aliases() {
        assert_eq!(canonical_provider("kimi"), "moonshot");
        assert_eq!(canonical_provider("moonshot-ai"), "moonshot");
        assert_eq!(canonical_provider("openai"), "openai");
    }
}

pub async fn delete_profile(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, ApiError> {
    let deleted = sqlx::query("delete from auth_profiles where id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;

    if deleted.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(Json(serde_json::json!({"deleted": true})))
}

pub async fn generate_preview(
    State(state): State<AppState>,
    Json(payload): Json<GenerateRequest>,
) -> Result<Json<GenerateResponse>, ApiError> {
    let prompt = payload.prompt.trim();
    if prompt.is_empty() {
        return Err(ApiError::BadRequest("prompt is required".to_string()));
    }

    let result = model_runtime::generate_with_failover(
        &state,
        prompt,
        payload.model,
        payload.fallback_models,
    )
    .await?;

    Ok(Json(GenerateResponse {
        model_used: result.model_used,
        output: result.output,
        attempts: result.attempts,
    }))
}
