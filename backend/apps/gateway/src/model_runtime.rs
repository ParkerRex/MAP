use crate::error::ApiError;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct ModelAttempt {
    pub model: String,
    pub provider: String,
    pub profile_id: String,
    pub source: String,
    pub ok: bool,
    pub error: Option<String>,
}

#[derive(Debug)]
pub struct ModelGenerationResult {
    pub model_used: String,
    pub output: String,
    pub attempts: Vec<ModelAttempt>,
}

#[derive(Debug, FromRow)]
struct ProfileRow {
    id: Uuid,
    profile_id: String,
    profile_type: String,
    payload: Value,
    last_used_at: Option<DateTime<Utc>>,
    cooldown_until: Option<DateTime<Utc>>,
    disabled_until: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
struct ResolvedProfile {
    id: Option<Uuid>,
    profile_id: String,
    profile_type: String,
    api_key: String,
    source: String,
    last_used_at: Option<DateTime<Utc>>,
}

#[derive(Debug)]
struct ProviderError {
    status: Option<u16>,
    message: String,
}

fn parse_model(value: &str) -> (String, String) {
    if let Some((provider, model)) = value.split_once(':') {
        (provider.trim().to_lowercase(), model.trim().to_string())
    } else {
        let model = value.trim().to_string();
        let provider = if model.to_lowercase().starts_with("kimi") {
            "moonshot"
        } else {
            "openai"
        };
        (provider.to_string(), model)
    }
}

#[cfg(test)]
mod tests {
    use super::{
        extract_message_content, is_billing_error, parse_model, should_failover, ProviderError,
    };
    use serde_json::json;

    #[test]
    fn parse_model_provider_prefix() {
        let (provider, model) = parse_model("moonshot:kimi-k2");
        assert_eq!(provider, "moonshot");
        assert_eq!(model, "kimi-k2");
    }

    #[test]
    fn parse_model_defaults_provider() {
        let (provider, model) = parse_model("gpt-4o-mini");
        assert_eq!(provider, "openai");
        assert_eq!(model, "gpt-4o-mini");
    }

    #[test]
    fn parse_model_autodetects_kimi_models() {
        let (provider, model) = parse_model("kimi-k2-0711-preview");
        assert_eq!(provider, "moonshot");
        assert_eq!(model, "kimi-k2-0711-preview");
    }

    #[test]
    fn parse_model_trims_provider_and_model() {
        let (provider, model) = parse_model("  moonshot : kimi-k2-instruct  ");
        assert_eq!(provider, "moonshot");
        assert_eq!(model, "kimi-k2-instruct");
    }

    #[test]
    fn should_failover_on_retryable_status_codes() {
        let rate_limited = ProviderError {
            status: Some(429),
            message: "rate limited".to_string(),
        };
        assert!(should_failover(&rate_limited));

        let unavailable = ProviderError {
            status: Some(503),
            message: "service unavailable".to_string(),
        };
        assert!(should_failover(&unavailable));
    }

    #[test]
    fn should_not_failover_on_non_retryable_client_error() {
        let bad_request = ProviderError {
            status: Some(400),
            message: "invalid request body".to_string(),
        };
        assert!(!should_failover(&bad_request));
    }

    #[test]
    fn should_failover_when_message_indicates_retryable_condition() {
        let timeout = ProviderError {
            status: Some(400),
            message: "request timeout while contacting upstream".to_string(),
        };
        assert!(should_failover(&timeout));
    }

    #[test]
    fn billing_detection_catches_insufficient_credit_errors() {
        let billing = ProviderError {
            status: Some(402),
            message: "insufficient credit for this request".to_string(),
        };
        assert!(is_billing_error(&billing));
    }

    #[test]
    fn extract_message_content_reads_string_payload() {
        let payload = json!({
            "choices": [{"message": {"content": "ok"}}]
        });
        assert_eq!(extract_message_content(&payload), Some("ok".to_string()));
    }

    #[test]
    fn extract_message_content_reads_array_payload_parts() {
        let payload = json!({
            "choices": [{
                "message": {
                    "content": [
                        {"type": "text", "text": "hello "},
                        {"type": "text", "text": "world"}
                    ]
                }
            }]
        });
        assert_eq!(extract_message_content(&payload), Some("hello world".to_string()));
    }
}

fn should_failover(error: &ProviderError) -> bool {
    if let Some(status) = error.status {
        if [401, 403, 408, 429].contains(&status) || status >= 500 {
            return true;
        }
    }

    let message = error.message.to_lowercase();
    message.contains("rate")
        || message.contains("timeout")
        || message.contains("auth")
        || message.contains("quota")
        || message.contains("unavailable")
}

fn is_billing_error(error: &ProviderError) -> bool {
    let message = error.message.to_lowercase();
    message.contains("insufficient") || message.contains("credit") || message.contains("billing")
}

fn extract_api_key(payload: &Value) -> Option<String> {
    payload
        .get("api_key")
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .or_else(|| {
            payload
                .get("key")
                .and_then(Value::as_str)
                .map(ToString::to_string)
        })
        .or_else(|| {
            payload
                .get("oauth")
                .and_then(|value| value.get("access"))
                .and_then(Value::as_str)
                .map(ToString::to_string)
        })
}

async fn load_profiles(state: &AppState, provider: &str) -> Result<Vec<ResolvedProfile>, ApiError> {
    let rows = sqlx::query_as::<_, ProfileRow>(
        r#"
        select
          ap.id,
          ap.profile_id,
          ap.profile_type,
          ap.payload,
          aus.last_used_at,
          aus.cooldown_until,
          aus.disabled_until
        from auth_profiles ap
        left join auth_usage_stats aus on aus.auth_profile_id = ap.id
        where ap.provider = $1
        "#,
    )
    .bind(provider)
    .fetch_all(&state.pool)
    .await?;

    let now = Utc::now();
    let mut profiles = Vec::new();

    for row in rows {
        if row.disabled_until.map(|until| until > now).unwrap_or(false) {
            continue;
        }
        if row.cooldown_until.map(|until| until > now).unwrap_or(false) {
            continue;
        }

        let Some(api_key) = extract_api_key(&row.payload) else {
            continue;
        };

        profiles.push(ResolvedProfile {
            id: Some(row.id),
            profile_id: row.profile_id,
            profile_type: row.profile_type,
            api_key,
            source: "db".to_string(),
            last_used_at: row.last_used_at,
        });
    }

    profiles.sort_by(|left, right| {
        let left_rank = if left.profile_type == "oauth" { 0 } else { 1 };
        let right_rank = if right.profile_type == "oauth" { 0 } else { 1 };

        left_rank
            .cmp(&right_rank)
            .then_with(|| left.last_used_at.cmp(&right.last_used_at))
    });

    if let Some(config) = state.config.providers.get(provider) {
        if let Some(api_key) = config.env_api_key.clone() {
            profiles.push(ResolvedProfile {
                id: None,
                profile_id: format!("env:{}", config.provider),
                profile_type: "api_key".to_string(),
                api_key,
                source: "env".to_string(),
                last_used_at: None,
            });
        }
    }

    Ok(profiles)
}

async fn mark_success(state: &AppState, profile_id: Option<Uuid>) -> Result<(), ApiError> {
    let Some(profile_id) = profile_id else {
        return Ok(());
    };

    sqlx::query(
        r#"
        insert into auth_usage_stats (auth_profile_id, last_used_at, error_count, cooldown_until, disabled_until, disabled_reason, updated_at)
        values ($1, now(), 0, null, null, null, now())
        on conflict (auth_profile_id)
        do update set
          last_used_at = now(),
          error_count = 0,
          cooldown_until = null,
          disabled_until = null,
          disabled_reason = null,
          updated_at = now()
        "#,
    )
    .bind(profile_id)
    .execute(&state.pool)
    .await?;

    Ok(())
}

async fn mark_failure(
    state: &AppState,
    profile_id: Option<Uuid>,
    error: &ProviderError,
) -> Result<(), ApiError> {
    let Some(profile_id) = profile_id else {
        return Ok(());
    };

    if is_billing_error(error) {
        sqlx::query(
            r#"
            insert into auth_usage_stats (auth_profile_id, error_count, disabled_until, disabled_reason, updated_at)
            values ($1, 1, now() + interval '5 hours', 'billing', now())
            on conflict (auth_profile_id)
            do update set
              error_count = auth_usage_stats.error_count + 1,
              disabled_until = now() + interval '5 hours',
              disabled_reason = 'billing',
              updated_at = now()
            "#,
        )
        .bind(profile_id)
        .execute(&state.pool)
        .await?;
    } else {
        sqlx::query(
            r#"
            insert into auth_usage_stats (auth_profile_id, error_count, cooldown_until, updated_at)
            values ($1, 1, now() + interval '5 minutes', now())
            on conflict (auth_profile_id)
            do update set
              error_count = auth_usage_stats.error_count + 1,
              cooldown_until = now() + interval '5 minutes',
              updated_at = now()
            "#,
        )
        .bind(profile_id)
        .execute(&state.pool)
        .await?;
    }

    Ok(())
}

fn extract_message_content(value: &Value) -> Option<String> {
    if let Some(content) = value
        .pointer("/choices/0/message/content")
        .and_then(Value::as_str)
    {
        return Some(content.to_string());
    }

    if let Some(parts) = value
        .pointer("/choices/0/message/content")
        .and_then(Value::as_array)
    {
        let mut combined = String::new();
        for part in parts {
            if let Some(text) = part.get("text").and_then(Value::as_str) {
                combined.push_str(text);
            }
        }
        if !combined.trim().is_empty() {
            return Some(combined);
        }
    }

    None
}

async fn call_openai_compatible(
    state: &AppState,
    base_url: &str,
    api_key: &str,
    model_name: &str,
    prompt: &str,
) -> Result<String, ProviderError> {
    let url = format!("{base_url}/chat/completions");
    let response = state
        .http
        .post(url)
        .bearer_auth(api_key)
        .json(&serde_json::json!({
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }))
        .send()
        .await
        .map_err(|error| ProviderError {
            status: None,
            message: error.to_string(),
        })?;

    let status = response.status();
    let value: Value = response.json().await.map_err(|error| ProviderError {
        status: Some(status.as_u16()),
        message: error.to_string(),
    })?;

    if !status.is_success() {
        let message = value
            .get("error")
            .and_then(|error| error.get("message"))
            .and_then(Value::as_str)
            .map(ToString::to_string)
            .unwrap_or_else(|| value.to_string());
        return Err(ProviderError {
            status: Some(status.as_u16()),
            message,
        });
    }

    extract_message_content(&value).ok_or_else(|| ProviderError {
        status: Some(status.as_u16()),
        message: "provider returned empty content".to_string(),
    })
}

pub async fn generate_with_failover(
    state: &AppState,
    prompt: &str,
    primary_override: Option<String>,
    fallback_override: Option<Vec<String>>,
) -> Result<ModelGenerationResult, ApiError> {
    let mut model_candidates =
        vec![primary_override.unwrap_or_else(|| state.config.primary_model.clone())];
    let fallbacks = fallback_override.unwrap_or_else(|| state.config.fallback_models.clone());
    for fallback in &fallbacks {
        if !model_candidates
            .iter()
            .any(|candidate| candidate == fallback)
        {
            model_candidates.push(fallback.clone());
        }
    }

    let mut attempts = Vec::<ModelAttempt>::new();
    let mut last_error: Option<String> = None;

    for candidate in &model_candidates {
        let (provider, model_name) = parse_model(candidate);
        let Some(provider_config) = state.config.providers.get(&provider) else {
            attempts.push(ModelAttempt {
                model: candidate.clone(),
                provider: provider.clone(),
                profile_id: "none".to_string(),
                source: "config".to_string(),
                ok: false,
                error: Some("provider config missing".to_string()),
            });
            last_error = Some("provider config missing".to_string());
            continue;
        };

        let profiles = load_profiles(state, &provider).await?;
        if profiles.is_empty() {
            attempts.push(ModelAttempt {
                model: candidate.clone(),
                provider: provider.clone(),
                profile_id: "none".to_string(),
                source: "runtime".to_string(),
                ok: false,
                error: Some("no active auth profiles".to_string()),
            });
            last_error = Some("no active auth profiles".to_string());
            continue;
        }

        for profile in profiles {
            match call_openai_compatible(
                state,
                &provider_config.base_url,
                &profile.api_key,
                &model_name,
                prompt,
            )
            .await
            {
                Ok(output) => {
                    mark_success(state, profile.id).await?;
                    attempts.push(ModelAttempt {
                        model: candidate.clone(),
                        provider: provider.clone(),
                        profile_id: profile.profile_id,
                        source: profile.source,
                        ok: true,
                        error: None,
                    });

                    return Ok(ModelGenerationResult {
                        model_used: candidate.clone(),
                        output,
                        attempts,
                    });
                }
                Err(error) => {
                    mark_failure(state, profile.id, &error).await?;
                    last_error = Some(error.message.clone());

                    let failover = should_failover(&error);
                    attempts.push(ModelAttempt {
                        model: candidate.clone(),
                        provider: provider.clone(),
                        profile_id: profile.profile_id,
                        source: profile.source,
                        ok: false,
                        error: Some(error.message.clone()),
                    });

                    if !failover {
                        return Err(ApiError::BadRequest(error.message));
                    }
                }
            }
        }
    }

    Err(ApiError::BadRequest(
        last_error.unwrap_or_else(|| "all model attempts failed".to_string()),
    ))
}
