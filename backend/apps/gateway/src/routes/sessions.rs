use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct SessionRow {
    pub id: Uuid,
    pub title: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSessionRequest {
    pub title: Option<String>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct SessionMessageRow {
    pub id: Uuid,
    pub session_id: Uuid,
    pub role: String,
    pub text: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct SessionRunRow {
    pub id: Uuid,
    pub session_id: Uuid,
    pub prompt: String,
    pub status: String,
    pub output: String,
    pub metadata: Value,
    pub model_used: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_sessions(
    State(state): State<AppState>,
) -> Result<Json<Vec<SessionRow>>, ApiError> {
    let sessions = sqlx::query_as::<_, SessionRow>(
        "select id, title, created_at, updated_at from sessions order by updated_at desc limit 100",
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(sessions))
}

pub async fn create_session(
    State(state): State<AppState>,
    Json(payload): Json<CreateSessionRequest>,
) -> Result<Json<SessionRow>, ApiError> {
    let session = sqlx::query_as::<_, SessionRow>(
        r#"
        insert into sessions (title)
        values ($1)
        returning id, title, created_at, updated_at
        "#,
    )
    .bind(payload.title)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(session))
}

pub async fn reset_session(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<SessionRow>, ApiError> {
    let session = sqlx::query_as::<_, SessionRow>(
        r#"
        update sessions
        set updated_at = now()
        where id = $1
        returning id, title, created_at, updated_at
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(session))
}

pub async fn list_session_messages(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<SessionMessageRow>>, ApiError> {
    let rows = sqlx::query_as::<_, SessionMessageRow>(
        r#"
        select id, session_id, role, text, created_at
        from session_messages
        where session_id = $1
        order by created_at asc
        "#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(rows))
}

pub async fn list_session_runs(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Vec<SessionRunRow>>, ApiError> {
    let rows = sqlx::query_as::<_, SessionRunRow>(
        r#"
        select
          id,
          session_id,
          prompt,
          status,
          output,
          metadata,
          metadata ->> 'model_used' as model_used,
          created_at,
          updated_at
        from chat_runs
        where session_id = $1
        order by created_at desc
        limit 50
        "#,
    )
    .bind(id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(rows))
}
