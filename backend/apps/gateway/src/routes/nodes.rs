use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct NodeRow {
    pub id: Uuid,
    pub node_key: String,
    pub display_name: Option<String>,
    pub pairing_status: String,
    pub capabilities: Value,
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
pub struct PairingRequestPayload {
    pub node_key: String,
    pub display_name: Option<String>,
    pub capabilities: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct PairingRequestResponse {
    pub request_id: Uuid,
    pub node_key: String,
    pub code: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct VerifyNodePayload {
    pub node_key: String,
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct VerifyNodeResponse {
    pub ok: bool,
    pub node_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct PairingDecisionResponse {
    pub id: Uuid,
    pub provider: String,
    pub peer_key: String,
    pub node_key: String,
    pub status: String,
    pub approved: bool,
    pub rejected: bool,
    pub token: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct NodesResponse {
    pub nodes: Vec<NodeRow>,
    pub pending_requests: Vec<PairingRequestRow>,
    pub pairing_mode: &'static str,
}

fn hash_token(token: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    let bytes = hasher.finalize();
    hex::encode(bytes)
}

pub async fn list_nodes(State(state): State<AppState>) -> Result<Json<NodesResponse>, ApiError> {
    let nodes = sqlx::query_as::<_, NodeRow>(
        r#"
        select id, node_key, display_name, pairing_status, capabilities, created_at, updated_at
        from nodes
        order by updated_at desc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    let pending_requests = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        select id, provider, peer_key, code, status, expires_at, created_at, updated_at
        from pairing_requests
        where provider = 'node' and status = 'pending' and expires_at > now()
        order by created_at desc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(NodesResponse {
        nodes,
        pending_requests,
        pairing_mode: "gateway-owned",
    }))
}

pub async fn request_pairing(
    State(state): State<AppState>,
    Json(payload): Json<PairingRequestPayload>,
) -> Result<Json<PairingRequestResponse>, ApiError> {
    if payload.node_key.trim().is_empty() {
        return Err(ApiError::BadRequest("node_key is required".to_string()));
    }

    let capabilities = payload
        .capabilities
        .unwrap_or_else(|| Value::Object(Default::default()));

    let node_id = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into nodes (node_key, display_name, pairing_status, capabilities)
        values ($1, $2, 'pending', $3)
        on conflict (node_key)
        do update set
          display_name = excluded.display_name,
          capabilities = excluded.capabilities,
          pairing_status = 'pending',
          updated_at = now()
        returning id
        "#,
    )
    .bind(payload.node_key.trim())
    .bind(payload.display_name)
    .bind(capabilities)
    .fetch_one(&state.pool)
    .await?
    .0;

    let code = format!("{:06}", (rand::random::<u32>() % 1_000_000));
    let request = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        insert into pairing_requests (provider, peer_key, code, status, expires_at)
        values ('node', $1, $2, 'pending', now() + interval '5 minutes')
        returning id, provider, peer_key, code, status, expires_at, created_at, updated_at
        "#,
    )
    .bind(payload.node_key.trim())
    .bind(code)
    .fetch_one(&state.pool)
    .await?;

    sqlx::query(
        r#"
        insert into audit_logs (category, action, actor, details)
        values ('nodes', 'pairing_requested', 'node', jsonb_build_object('node_id', $1, 'request_id', $2))
        "#,
    )
    .bind(node_id)
    .bind(request.id)
    .execute(&state.pool)
    .await?;

    Ok(Json(PairingRequestResponse {
        request_id: request.id,
        node_key: request.peer_key,
        code: request.code,
        expires_at: request.expires_at,
    }))
}

pub async fn approve_pairing(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
) -> Result<Json<PairingDecisionResponse>, ApiError> {
    let request = sqlx::query_as::<_, PairingRequestRow>(
        r#"
        select id, provider, peer_key, code, status, expires_at, created_at, updated_at
        from pairing_requests
        where id = $1 and provider = 'node'
        "#,
    )
    .bind(request_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    if request.status != "pending" || request.expires_at <= Utc::now() {
        return Err(ApiError::BadRequest(
            "pairing request is not pending or has expired".to_string(),
        ));
    }

    let node_id = sqlx::query_as::<_, (Uuid,)>("select id from nodes where node_key = $1")
        .bind(&request.peer_key)
        .fetch_one(&state.pool)
        .await?
        .0;

    let token = Uuid::now_v7().to_string();
    let token_hash = hash_token(&token);

    sqlx::query(
        r#"
        insert into node_pairings (node_id, token_hash, active)
        values ($1, $2, true)
        on conflict (node_id)
        do update set token_hash = excluded.token_hash, active = true, updated_at = now()
        "#,
    )
    .bind(node_id)
    .bind(token_hash)
    .execute(&state.pool)
    .await?;

    sqlx::query("update nodes set pairing_status = 'approved', updated_at = now() where id = $1")
        .bind(node_id)
        .execute(&state.pool)
        .await?;

    sqlx::query(
        "update pairing_requests set status = 'approved', updated_at = now() where id = $1",
    )
    .bind(request_id)
    .execute(&state.pool)
    .await?;

    Ok(Json(PairingDecisionResponse {
        id: request_id,
        provider: request.provider,
        peer_key: request.peer_key.clone(),
        node_key: request.peer_key,
        status: "approved".to_string(),
        approved: true,
        rejected: false,
        token: Some(token),
    }))
}

pub async fn reject_pairing(
    State(state): State<AppState>,
    Path(request_id): Path<Uuid>,
) -> Result<Json<PairingDecisionResponse>, ApiError> {
    let request = sqlx::query_as::<_, PairingRequestRow>(
        "select id, provider, peer_key, code, status, expires_at, created_at, updated_at from pairing_requests where id = $1 and provider = 'node'",
    )
    .bind(request_id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    sqlx::query(
        "update pairing_requests set status = 'rejected', updated_at = now() where id = $1",
    )
    .bind(request.id)
    .execute(&state.pool)
    .await?;

    sqlx::query(
        "update nodes set pairing_status = 'rejected', updated_at = now() where node_key = $1",
    )
    .bind(&request.peer_key)
    .execute(&state.pool)
    .await?;

    Ok(Json(PairingDecisionResponse {
        id: request_id,
        provider: request.provider,
        peer_key: request.peer_key.clone(),
        node_key: request.peer_key,
        status: "rejected".to_string(),
        approved: false,
        rejected: true,
        token: None,
    }))
}

pub async fn verify_node(
    State(state): State<AppState>,
    Json(payload): Json<VerifyNodePayload>,
) -> Result<Json<VerifyNodeResponse>, ApiError> {
    if payload.node_key.trim().is_empty() || payload.token.trim().is_empty() {
        return Err(ApiError::BadRequest(
            "node_key and token are required".to_string(),
        ));
    }

    let node = sqlx::query_as::<_, (Uuid,)>("select id from nodes where node_key = $1")
        .bind(payload.node_key.trim())
        .fetch_optional(&state.pool)
        .await?;

    let Some((node_id,)) = node else {
        return Ok(Json(VerifyNodeResponse {
            ok: false,
            node_id: None,
        }));
    };

    let token_hash = hash_token(payload.token.trim());

    let exists = sqlx::query_scalar::<_, i64>(
        "select count(*) from node_pairings where node_id = $1 and token_hash = $2 and active = true",
    )
    .bind(node_id)
    .bind(token_hash)
    .fetch_one(&state.pool)
    .await?
        > 0;

    Ok(Json(VerifyNodeResponse {
        ok: exists,
        node_id: exists.then_some(node_id),
    }))
}
