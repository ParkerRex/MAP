use crate::error::ApiError;
use crate::model_runtime;
use crate::provider::normalize_provider_alias;
use crate::safety::confirmation_required;
use crate::state::AppState;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct ChannelAccountRow {
    pub id: Uuid,
    pub provider: String,
    pub account_key: String,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ChannelRouteRow {
    pub id: Uuid,
    pub provider: String,
    pub account_id: Option<Uuid>,
    pub peer_key: String,
    pub session_scope: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct PairingRequestRow {
    pub id: Uuid,
    pub provider: String,
    pub peer_key: String,
    pub code: String,
    pub status: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertChannelAccountRequest {
    pub provider: String,
    pub account_key: String,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct UpsertChannelRouteRequest {
    pub provider: String,
    pub account_id: Option<Uuid>,
    pub peer_key: String,
    pub session_scope: String,
}

#[derive(Debug, Serialize)]
pub struct ChannelsSummaryResponse {
    pub connectors: Vec<&'static str>,
    pub account_count: usize,
    pub route_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct ResolveSessionRequest {
    pub provider: String,
    pub peer_kind: String,
    pub peer_id: String,
    pub account_key: Option<String>,
    pub thread_id: Option<String>,
    pub dm_scope: Option<String>,
    pub identity_key: Option<String>,
    pub agent_id: Option<String>,
    pub main_key: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ResolveSessionResponse {
    pub session_id: Uuid,
    pub session_key: String,
    pub created: bool,
    pub title: String,
    pub chat_type: String,
}

#[derive(Debug, Deserialize)]
pub struct InboundMessageRequest {
    pub provider: String,
    pub peer_kind: String,
    pub peer_id: String,
    pub text: String,
    pub account_key: Option<String>,
    pub thread_id: Option<String>,
    pub dm_scope: Option<String>,
    pub dm_policy: Option<String>,
    pub identity_key: Option<String>,
    pub agent_id: Option<String>,
    pub main_key: Option<String>,
    pub model: Option<String>,
    pub fallback_models: Option<Vec<String>>,
    pub confirmed: Option<bool>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct InboundMessageResponse {
    pub accepted: bool,
    pub requires_pairing: bool,
    pub requires_confirmation: bool,
    pub reason: Option<String>,
    pub pairing_request_id: Option<Uuid>,
    pub pairing_code: Option<String>,
    pub pairing_expires_at: Option<DateTime<Utc>>,
    pub session_id: Option<Uuid>,
    pub session_key: Option<String>,
    pub run_id: Option<Uuid>,
    pub model_used: Option<String>,
    pub output: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PairingQuery {
    pub provider: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PairingDecisionRequest {
    pub provider: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PairingDecisionResponse {
    pub id: Uuid,
    pub provider: String,
    pub peer_key: String,
    pub status: String,
    pub allowlisted: bool,
}

struct SessionResolution {
    session_key: String,
    title: String,
    chat_type: String,
}

#[derive(Debug)]
struct NormalizedRouteMutation {
    provider: String,
    peer_key: String,
    session_scope: String,
}

fn normalize_component(input: &str, fallback: &str) -> String {
    let mut out = String::new();
    for ch in input.trim().chars() {
        if ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.' | '@' | '+') {
            out.push(ch);
        }
    }

    if out.is_empty() {
        fallback.to_string()
    } else {
        out
    }
}

fn normalize_provider(input: &str) -> String {
    normalize_provider_alias(input)
}

fn normalize_channel_provider(input: &str, fallback: &str) -> String {
    normalize_component(&normalize_provider(input), fallback)
}

fn normalize_account_fields(
    provider: &str,
    account_key: &str,
) -> Result<(String, String), ApiError> {
    let provider = normalize_provider(provider);
    let account_key = account_key.trim().to_string();

    if provider.is_empty() || account_key.is_empty() {
        return Err(ApiError::BadRequest(
            "provider and account_key are required".to_string(),
        ));
    }

    Ok((provider, account_key))
}

fn normalize_route_fields(
    provider: &str,
    peer_key: &str,
    session_scope: &str,
) -> Result<NormalizedRouteMutation, ApiError> {
    let provider = normalize_provider(provider);
    let peer_key = peer_key.trim().to_string();
    let session_scope = session_scope.trim().to_string();

    if provider.is_empty() || peer_key.is_empty() || session_scope.is_empty() {
        return Err(ApiError::BadRequest(
            "provider, peer_key, and session_scope are required".to_string(),
        ));
    }

    Ok(NormalizedRouteMutation {
        provider,
        peer_key,
        session_scope,
    })
}

fn resolve_session_key(
    config: &AppState,
    request: &ResolveSessionRequest,
) -> Result<SessionResolution, ApiError> {
    let provider = normalize_channel_provider(&request.provider, "unknown");
    let peer_kind = request.peer_kind.trim().to_lowercase();
    let peer_id = normalize_component(&request.peer_id, "unknown");
    let account_key = request
        .account_key
        .as_deref()
        .map(|value| normalize_component(value, "default"))
        .unwrap_or_else(|| "default".to_string());
    let agent_id = normalize_component(
        request
            .agent_id
            .as_deref()
            .unwrap_or(&config.config.agent_id),
        "main",
    );
    let main_key = normalize_component(
        request
            .main_key
            .as_deref()
            .unwrap_or(&config.config.main_key),
        "main",
    );

    if peer_kind.is_empty() {
        return Err(ApiError::BadRequest("peer_kind is required".to_string()));
    }

    let resolution = match peer_kind.as_str() {
        "dm" | "direct" => {
            let dm_scope = request
                .dm_scope
                .as_deref()
                .unwrap_or(&config.config.dm_scope)
                .trim()
                .to_lowercase();
            let identity = normalize_component(
                request.identity_key.as_deref().unwrap_or(&peer_id),
                "unknown",
            );

            let session_key = match dm_scope.as_str() {
                "main" => format!("agent:{agent_id}:{main_key}"),
                "per-peer" => format!("agent:{agent_id}:dm:{identity}"),
                "per-channel-peer" => format!("agent:{agent_id}:{provider}:dm:{identity}"),
                "per-account-channel-peer" => {
                    format!("agent:{agent_id}:{provider}:{account_key}:dm:{identity}")
                }
                _ => {
                    return Err(ApiError::BadRequest(
                        "dm_scope must be one of: main, per-peer, per-channel-peer, per-account-channel-peer"
                            .to_string(),
                    ))
                }
            };

            SessionResolution {
                session_key,
                title: format!("{provider}:dm:{peer_id}"),
                chat_type: "direct".to_string(),
            }
        }
        "group" => {
            if let Some(thread_id) = request.thread_id.as_deref() {
                let thread = normalize_component(thread_id, "thread");
                let suffix = if provider == "telegram" {
                    "topic"
                } else {
                    "thread"
                };
                SessionResolution {
                    session_key: format!(
                        "agent:{agent_id}:{provider}:group:{peer_id}:{suffix}:{thread}"
                    ),
                    title: format!("{provider}:group:{peer_id}:{suffix}:{thread}"),
                    chat_type: "thread".to_string(),
                }
            } else {
                SessionResolution {
                    session_key: format!("agent:{agent_id}:{provider}:group:{peer_id}"),
                    title: format!("{provider}:group:{peer_id}"),
                    chat_type: "group".to_string(),
                }
            }
        }
        "channel" | "room" => {
            if let Some(thread_id) = request.thread_id.as_deref() {
                let thread = normalize_component(thread_id, "thread");
                SessionResolution {
                    session_key: format!(
                        "agent:{agent_id}:{provider}:channel:{peer_id}:thread:{thread}"
                    ),
                    title: format!("{provider}:channel:{peer_id}:thread:{thread}"),
                    chat_type: "thread".to_string(),
                }
            } else {
                SessionResolution {
                    session_key: format!("agent:{agent_id}:{provider}:channel:{peer_id}"),
                    title: format!("{provider}:channel:{peer_id}"),
                    chat_type: "group".to_string(),
                }
            }
        }
        "thread" => {
            let thread_id = normalize_component(
                request.thread_id.as_deref().unwrap_or(&request.peer_id),
                "thread",
            );

            SessionResolution {
                session_key: format!(
                    "agent:{agent_id}:{provider}:channel:{peer_id}:thread:{thread_id}"
                ),
                title: format!("{provider}:channel:{peer_id}:thread:{thread_id}"),
                chat_type: "thread".to_string(),
            }
        }
        _ => {
            return Err(ApiError::BadRequest(
                "peer_kind must be one of: dm, group, channel, room, thread".to_string(),
            ))
        }
    };

    Ok(resolution)
}

async fn ensure_session_for_key(
    state: &AppState,
    resolution: &SessionResolution,
) -> Result<(Uuid, bool), ApiError> {
    let existing = sqlx::query_as::<_, (Uuid,)>("select id from sessions where session_key = $1")
        .bind(&resolution.session_key)
        .fetch_optional(&state.pool)
        .await?;

    if let Some((session_id,)) = existing {
        sqlx::query("update sessions set updated_at = now() where id = $1")
            .bind(session_id)
            .execute(&state.pool)
            .await?;

        return Ok((session_id, false));
    }

    let created = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into sessions (title, session_key)
        values ($1, $2)
        returning id
        "#,
    )
    .bind(&resolution.title)
    .bind(&resolution.session_key)
    .fetch_one(&state.pool)
    .await?;

    Ok((created.0, true))
}

async fn ensure_dm_allowed(
    state: &AppState,
    provider: &str,
    peer_key: &str,
    dm_policy: &str,
) -> Result<Option<InboundMessageResponse>, ApiError> {
    if dm_policy == "open" {
        return Ok(None);
    }

    if dm_policy == "disabled" {
        return Ok(Some(InboundMessageResponse {
            accepted: false,
            requires_pairing: false,
            requires_confirmation: false,
            reason: Some("direct messages are disabled by policy".to_string()),
            pairing_request_id: None,
            pairing_code: None,
            pairing_expires_at: None,
            session_id: None,
            session_key: None,
            run_id: None,
            model_used: None,
            output: None,
        }));
    }

    let allowlisted = sqlx::query_scalar::<_, i64>(
        "select count(*) from pairing_allowlists where provider = $1 and peer_key = $2",
    )
    .bind(provider)
    .bind(peer_key)
    .fetch_one(&state.pool)
    .await?
        > 0;

    if allowlisted {
        return Ok(None);
    }

    if dm_policy == "allowlist" {
        return Ok(Some(InboundMessageResponse {
            accepted: false,
            requires_pairing: false,
            requires_confirmation: false,
            reason: Some("sender is not allowlisted".to_string()),
            pairing_request_id: None,
            pairing_code: None,
            pairing_expires_at: None,
            session_id: None,
            session_key: None,
            run_id: None,
            model_used: None,
            output: None,
        }));
    }

    if dm_policy != "pairing" {
        return Err(ApiError::BadRequest(
            "dm_policy must be one of: pairing, allowlist, open, disabled".to_string(),
        ));
    }

    let existing = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        select id, provider, peer_key, code, status, expires_at, created_at, updated_at
        from pairing_requests
        where provider = $1 and peer_key = $2 and status = 'pending' and expires_at > now()
        order by created_at desc
        limit 1
        "#,
    )
    .bind(provider)
    .bind(peer_key)
    .fetch_optional(&state.pool)
    .await?;

    let request = if let Some(request) = existing {
        request
    } else {
        let code = format!("{:06}", rand::random::<u32>() % 1_000_000);
        sqlx::query_as::<_, PairingRequestRow>(
            r#"
            insert into pairing_requests (provider, peer_key, code, status, expires_at)
            values ($1, $2, $3, 'pending', now() + interval '1 hour')
            returning id, provider, peer_key, code, status, expires_at, created_at, updated_at
            "#,
        )
        .bind(provider)
        .bind(peer_key)
        .bind(code)
        .fetch_one(&state.pool)
        .await?
    };

    Ok(Some(InboundMessageResponse {
        accepted: false,
        requires_pairing: true,
        requires_confirmation: false,
        reason: Some("pairing approval required".to_string()),
        pairing_request_id: Some(request.id),
        pairing_code: Some(request.code),
        pairing_expires_at: Some(request.expires_at),
        session_id: None,
        session_key: None,
        run_id: None,
        model_used: None,
        output: None,
    }))
}

pub async fn list_channels(
    State(state): State<AppState>,
) -> Result<Json<ChannelsSummaryResponse>, ApiError> {
    let account_count = sqlx::query_scalar::<_, i64>("select count(*) from channel_accounts")
        .fetch_one(&state.pool)
        .await?
        .max(0) as usize;
    let route_count = sqlx::query_scalar::<_, i64>("select count(*) from channel_routes")
        .fetch_one(&state.pool)
        .await?
        .max(0) as usize;

    Ok(Json(ChannelsSummaryResponse {
        connectors: vec![
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "google-chat",
            "signal",
            "imessage",
            "bluebubbles",
            "microsoft-teams",
            "matrix",
            "zalo",
            "webchat",
        ],
        account_count,
        route_count,
    }))
}

pub async fn list_accounts(
    State(state): State<AppState>,
) -> Result<Json<Vec<ChannelAccountRow>>, ApiError> {
    let rows = sqlx::query_as::<_, ChannelAccountRow>(
        r#"
        select id, provider, account_key, metadata, created_at, updated_at
        from channel_accounts
        order by provider asc, account_key asc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(rows))
}

pub async fn upsert_account(
    State(state): State<AppState>,
    Json(payload): Json<UpsertChannelAccountRequest>,
) -> Result<Json<ChannelAccountRow>, ApiError> {
    let (provider, account_key) =
        normalize_account_fields(&payload.provider, &payload.account_key)?;

    let metadata = payload
        .metadata
        .unwrap_or_else(|| Value::Object(Default::default()));

    let row = sqlx::query_as::<_, ChannelAccountRow>(
        r#"
        insert into channel_accounts (provider, account_key, metadata)
        values ($1, $2, $3)
        on conflict (provider, account_key)
        do update set metadata = excluded.metadata, updated_at = now()
        returning id, provider, account_key, metadata, created_at, updated_at
        "#,
    )
    .bind(provider)
    .bind(account_key)
    .bind(metadata)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(row))
}

pub async fn delete_account(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, ApiError> {
    let result = sqlx::query("delete from channel_accounts where id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn list_routes(
    State(state): State<AppState>,
) -> Result<Json<Vec<ChannelRouteRow>>, ApiError> {
    let rows = sqlx::query_as::<_, ChannelRouteRow>(
        r#"
        select id, provider, account_id, peer_key, session_scope, created_at, updated_at
        from channel_routes
        order by provider asc, peer_key asc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(rows))
}

pub async fn upsert_route(
    State(state): State<AppState>,
    Json(payload): Json<UpsertChannelRouteRequest>,
) -> Result<Json<ChannelRouteRow>, ApiError> {
    let normalized =
        normalize_route_fields(&payload.provider, &payload.peer_key, &payload.session_scope)?;
    let provider = normalized.provider;
    let peer_key = normalized.peer_key;
    let session_scope = normalized.session_scope;

    let row = if let Some(account_id) = payload.account_id {
        sqlx::query_as::<_, ChannelRouteRow>(
            r#"
            insert into channel_routes (provider, account_id, peer_key, session_scope)
            values ($1, $2, $3, $4)
            on conflict (provider, account_id, peer_key, session_scope)
            do update set updated_at = now()
            returning id, provider, account_id, peer_key, session_scope, created_at, updated_at
            "#,
        )
        .bind(&provider)
        .bind(account_id)
        .bind(&peer_key)
        .bind(&session_scope)
        .fetch_one(&state.pool)
        .await?
    } else {
        sqlx::query_as::<_, ChannelRouteRow>(
            r#"
            insert into channel_routes (provider, account_id, peer_key, session_scope)
            values ($1, null, $2, $3)
            on conflict (provider, peer_key, session_scope)
            where account_id is null
            do update set updated_at = now()
            returning id, provider, account_id, peer_key, session_scope, created_at, updated_at
            "#,
        )
        .bind(&provider)
        .bind(&peer_key)
        .bind(&session_scope)
        .fetch_one(&state.pool)
        .await?
    };

    Ok(Json(row))
}

pub async fn delete_route(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, ApiError> {
    let result = sqlx::query("delete from channel_routes where id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}

pub async fn resolve_session(
    State(state): State<AppState>,
    Json(payload): Json<ResolveSessionRequest>,
) -> Result<Json<ResolveSessionResponse>, ApiError> {
    if payload.provider.trim().is_empty() || payload.peer_id.trim().is_empty() {
        return Err(ApiError::BadRequest(
            "provider and peer_id are required".to_string(),
        ));
    }

    let resolution = resolve_session_key(&state, &payload)?;
    let (session_id, created) = ensure_session_for_key(&state, &resolution).await?;

    Ok(Json(ResolveSessionResponse {
        session_id,
        session_key: resolution.session_key,
        created,
        title: resolution.title,
        chat_type: resolution.chat_type,
    }))
}

pub async fn inbound_message(
    State(state): State<AppState>,
    Json(payload): Json<InboundMessageRequest>,
) -> Result<(StatusCode, Json<InboundMessageResponse>), ApiError> {
    let provider = normalize_provider(&payload.provider);
    let peer_kind = payload.peer_kind.trim().to_lowercase();
    let peer_id = payload.peer_id.trim().to_string();
    let text = payload.text.trim().to_string();
    if provider.is_empty() || peer_kind.is_empty() || peer_id.is_empty() {
        return Err(ApiError::BadRequest(
            "provider, peer_kind, and peer_id are required".to_string(),
        ));
    }
    if text.trim().is_empty() {
        return Err(ApiError::BadRequest("text is required".to_string()));
    }

    let dm_policy = payload
        .dm_policy
        .as_deref()
        .unwrap_or("pairing")
        .trim()
        .to_lowercase();

    if peer_kind == "dm" || peer_kind == "direct" {
        if let Some(blocked) = ensure_dm_allowed(&state, &provider, &peer_id, &dm_policy).await? {
            return Ok((StatusCode::FORBIDDEN, Json(blocked)));
        }
    }

    let resolution_request = ResolveSessionRequest {
        provider: provider.clone(),
        peer_kind: peer_kind.clone(),
        peer_id: peer_id.clone(),
        account_key: payload.account_key.clone(),
        thread_id: payload.thread_id.clone(),
        dm_scope: payload.dm_scope.clone(),
        identity_key: payload.identity_key.clone(),
        agent_id: payload.agent_id.clone(),
        main_key: payload.main_key.clone(),
    };

    let resolution = resolve_session_key(&state, &resolution_request)?;
    let (session_id, _) = ensure_session_for_key(&state, &resolution).await?;

    let run_id = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into chat_runs (session_id, prompt, status, output, metadata)
        values ($1, $2, 'running', '', '{}'::jsonb)
        returning id
        "#,
    )
    .bind(session_id)
    .bind(&text)
    .fetch_one(&state.pool)
    .await?
    .0;

    let needs_confirmation = confirmation_required(&text, payload.confirmed);
    if needs_confirmation {
        let output = "Confirmation required: this request appears to include destructive or high-impact operations. Re-send with `confirmed: true` to continue.";
        let status = "needs_confirmation";

        sqlx::query(
            r#"
            update chat_runs
            set status = $2, output = $3, metadata = $4, updated_at = now()
            where id = $1
            "#,
        )
        .bind(run_id)
        .bind(status)
        .bind(output)
        .bind(serde_json::json!({
            "source": "channel_inbound",
            "provider": &provider,
            "peer_kind": &peer_kind,
            "peer_id": &peer_id,
            "thread_id": payload.thread_id.as_ref(),
            "account_key": payload.account_key.as_ref(),
            "requires_confirmation": true,
            "model_used": "none",
            "attempts": [],
            "inbound_metadata": payload.metadata.as_ref(),
        }))
        .execute(&state.pool)
        .await?;

        sqlx::query(
            r#"
            insert into session_messages (session_id, role, text)
            values ($1, 'user', $2), ($1, 'assistant', $3)
            "#,
        )
        .bind(session_id)
        .bind(&text)
        .bind(output)
        .execute(&state.pool)
        .await?;

        sqlx::query("update sessions set updated_at = now() where id = $1")
            .bind(session_id)
            .execute(&state.pool)
            .await?;

        return Ok((
            StatusCode::OK,
            Json(InboundMessageResponse {
                accepted: false,
                requires_pairing: false,
                requires_confirmation: true,
                reason: Some("confirmation required".to_string()),
                pairing_request_id: None,
                pairing_code: None,
                pairing_expires_at: None,
                session_id: Some(session_id),
                session_key: Some(resolution.session_key),
                run_id: Some(run_id),
                model_used: Some("none".to_string()),
                output: Some(output.to_string()),
            }),
        ));
    }

    sqlx::query(
        r#"
        insert into session_messages (session_id, role, text)
        values ($1, 'user', $2)
        "#,
    )
    .bind(session_id)
    .bind(&text)
    .execute(&state.pool)
    .await?;

    let generation = model_runtime::generate_with_failover(
        &state,
        &text,
        payload.model.clone(),
        payload.fallback_models.clone(),
    )
    .await;

    let (model_used, output, attempts, status, error_text) = match generation {
        Ok(result) => (
            result.model_used,
            result.output,
            serde_json::to_value(result.attempts).unwrap_or_else(|_| Value::Array(Vec::new())),
            "done".to_string(),
            None,
        ),
        Err(error) => (
            "none".to_string(),
            String::new(),
            Value::Array(Vec::new()),
            "error".to_string(),
            Some(error.to_string()),
        ),
    };

    sqlx::query(
        r#"
        update chat_runs
        set status = $2, output = $3, metadata = $4, updated_at = now()
        where id = $1
        "#,
    )
    .bind(run_id)
    .bind(&status)
    .bind(&output)
    .bind(serde_json::json!({
        "source": "channel_inbound",
        "provider": provider,
        "peer_kind": peer_kind,
        "peer_id": peer_id,
        "thread_id": payload.thread_id.as_ref(),
        "account_key": payload.account_key.as_ref(),
        "model_used": model_used,
        "attempts": attempts,
        "inbound_metadata": payload.metadata.as_ref(),
        "error": error_text,
    }))
    .execute(&state.pool)
    .await?;

    if status == "done" {
        sqlx::query(
            r#"
            insert into session_messages (session_id, role, text)
            values ($1, 'assistant', $2)
            "#,
        )
        .bind(session_id)
        .bind(&output)
        .execute(&state.pool)
        .await?;
    }

    sqlx::query("update sessions set updated_at = now() where id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await?;

    if status == "error" {
        return Ok((
            StatusCode::BAD_GATEWAY,
            Json(InboundMessageResponse {
                accepted: false,
                requires_pairing: false,
                requires_confirmation: false,
                reason: Some("model generation failed".to_string()),
                pairing_request_id: None,
                pairing_code: None,
                pairing_expires_at: None,
                session_id: Some(session_id),
                session_key: Some(resolution.session_key),
                run_id: Some(run_id),
                model_used: None,
                output: None,
            }),
        ));
    }

    Ok((
        StatusCode::OK,
        Json(InboundMessageResponse {
            accepted: true,
            requires_pairing: false,
            requires_confirmation: false,
            reason: None,
            pairing_request_id: None,
            pairing_code: None,
            pairing_expires_at: None,
            session_id: Some(session_id),
            session_key: Some(resolution.session_key),
            run_id: Some(run_id),
            model_used: Some(model_used),
            output: Some(output),
        }),
    ))
}

pub async fn list_pairing_requests(
    State(state): State<AppState>,
    Query(query): Query<PairingQuery>,
) -> Result<Json<Vec<PairingRequestRow>>, ApiError> {
    let provider = query
        .provider
        .as_deref()
        .map(normalize_provider)
        .filter(|value| !value.is_empty());

    let rows = if let Some(provider) = provider {
        sqlx::query_as::<_, PairingRequestRow>(
            r#"
            select id, provider, peer_key, code, status, expires_at, created_at, updated_at
            from pairing_requests
            where provider = $1
            order by created_at desc
            limit 200
            "#,
        )
        .bind(provider)
        .fetch_all(&state.pool)
        .await?
    } else {
        sqlx::query_as::<_, PairingRequestRow>(
            r#"
            select id, provider, peer_key, code, status, expires_at, created_at, updated_at
            from pairing_requests
            order by created_at desc
            limit 200
            "#,
        )
        .fetch_all(&state.pool)
        .await?
    };

    Ok(Json(rows))
}

pub async fn approve_pairing_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(payload): Query<PairingDecisionRequest>,
) -> Result<Json<PairingDecisionResponse>, ApiError> {
    let request = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        select id, provider, peer_key, code, status, expires_at, created_at, updated_at
        from pairing_requests
        where id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    if let Some(provider) = payload
        .provider
        .as_deref()
        .map(normalize_provider)
        .filter(|value| !value.is_empty())
    {
        if request.provider != provider {
            return Err(ApiError::BadRequest("provider mismatch".to_string()));
        }
    }

    sqlx::query(
        r#"
        insert into pairing_allowlists (provider, peer_key)
        values ($1, $2)
        on conflict (provider, peer_key) do nothing
        "#,
    )
    .bind(&request.provider)
    .bind(&request.peer_key)
    .execute(&state.pool)
    .await?;

    sqlx::query(
        "update pairing_requests set status = 'approved', updated_at = now() where id = $1",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    Ok(Json(PairingDecisionResponse {
        id,
        provider: request.provider,
        peer_key: request.peer_key,
        status: "approved".to_string(),
        allowlisted: true,
    }))
}

pub async fn reject_pairing_request(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Query(payload): Query<PairingDecisionRequest>,
) -> Result<Json<PairingDecisionResponse>, ApiError> {
    let request = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        select id, provider, peer_key, code, status, expires_at, created_at, updated_at
        from pairing_requests
        where id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    if let Some(provider) = payload
        .provider
        .as_deref()
        .map(normalize_provider)
        .filter(|value| !value.is_empty())
    {
        if request.provider != provider {
            return Err(ApiError::BadRequest("provider mismatch".to_string()));
        }
    }

    sqlx::query(
        "update pairing_requests set status = 'rejected', updated_at = now() where id = $1",
    )
    .bind(id)
    .execute(&state.pool)
    .await?;

    Ok(Json(PairingDecisionResponse {
        id,
        provider: request.provider,
        peer_key: request.peer_key,
        status: "rejected".to_string(),
        allowlisted: false,
    }))
}

#[cfg(test)]
mod tests {
    use super::{normalize_account_fields, normalize_route_fields};
    use crate::error::ApiError;
    use crate::safety::confirmation_required;

    #[test]
    fn account_mutation_normalizes_provider_alias_and_trims_account_key() {
        let (provider, account_key) =
            normalize_account_fields("  kimi  ", "  primary-bot  ").expect("valid payload");
        assert_eq!(provider, "moonshot");
        assert_eq!(account_key, "primary-bot");
    }

    #[test]
    fn account_mutation_requires_provider_and_account_key() {
        let error = normalize_account_fields(" ", "acct").expect_err("missing provider");
        assert!(matches!(
            error,
            ApiError::BadRequest(message) if message == "provider and account_key are required"
        ));
    }

    #[test]
    fn route_mutation_normalizes_provider_alias_and_trims_fields() {
        let normalized = normalize_route_fields("moonshot-ai", "  peer:123  ", "  default  ")
            .expect("valid payload");
        assert_eq!(normalized.provider, "moonshot");
        assert_eq!(normalized.peer_key, "peer:123");
        assert_eq!(normalized.session_scope, "default");
    }

    #[test]
    fn route_mutation_requires_provider_peer_and_scope() {
        let error = normalize_route_fields(" ", "peer", "scope").expect_err("missing provider");
        assert!(matches!(
            error,
            ApiError::BadRequest(message)
                if message == "provider, peer_key, and session_scope are required"
        ));
    }

    #[test]
    fn inbound_confirmation_gate_requires_explicit_confirmation() {
        assert!(confirmation_required("delete production records", None));
        assert!(!confirmation_required(
            "delete production records",
            Some(true)
        ));
        assert!(!confirmation_required("summarize latest updates", None));
    }
}
