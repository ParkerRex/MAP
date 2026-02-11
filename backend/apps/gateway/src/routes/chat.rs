use crate::error::ApiError;
use crate::model_runtime;
use crate::state::AppState;
use async_stream::stream;
use axum::extract::{Path, State};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::Json;
use chrono::{DateTime, Utc};
use futures::stream::BoxStream;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use std::convert::Infallible;
use std::time::Duration;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateRunRequest {
    pub session_id: Option<Uuid>,
    pub prompt: String,
    pub model: Option<String>,
    pub fallback_models: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct CreateRunResponse {
    pub run_id: Uuid,
    pub session_id: Uuid,
    pub model_used: String,
    pub stream_path: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct RunRow {
    pub id: Uuid,
    pub session_id: Uuid,
    pub prompt: String,
    pub status: String,
    pub output: String,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

async fn resolve_session_id(state: &AppState, session_id: Option<Uuid>) -> Result<Uuid, ApiError> {
    if let Some(id) = session_id {
        let exists = sqlx::query_scalar::<_, i64>("select count(*) from sessions where id = $1")
            .bind(id)
            .fetch_one(&state.pool)
            .await?;
        if exists == 0 {
            return Err(ApiError::NotFound);
        }
        return Ok(id);
    }

    let created = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into sessions (title)
        values (null)
        returning id
        "#,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(created.0)
}

pub async fn create_run(
    State(state): State<AppState>,
    Json(payload): Json<CreateRunRequest>,
) -> Result<Json<CreateRunResponse>, ApiError> {
    let prompt = payload.prompt.trim();
    if prompt.is_empty() {
        return Err(ApiError::BadRequest("prompt is required".to_string()));
    }

    let session_id = resolve_session_id(&state, payload.session_id).await?;

    let run_id = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into chat_runs (session_id, prompt, status, output, metadata)
        values ($1, $2, 'running', '', '{}'::jsonb)
        returning id
        "#,
    )
    .bind(session_id)
    .bind(prompt)
    .fetch_one(&state.pool)
    .await?
    .0;

    let generation = model_runtime::generate_with_failover(
        &state,
        prompt,
        payload.model,
        payload.fallback_models,
    )
    .await;

    let (model_used, output, attempts, status) = match generation {
        Ok(result) => (
            result.model_used,
            result.output,
            serde_json::to_value(result.attempts).unwrap_or_else(|_| Value::Array(Vec::new())),
            "done".to_string(),
        ),
        Err(error) => (
            "none".to_string(),
            format!("Model generation failed: {error}"),
            Value::Array(Vec::new()),
            "error".to_string(),
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
    .bind(status)
    .bind(&output)
    .bind(serde_json::json!({
        "model_used": model_used,
        "attempts": attempts,
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
    .bind(prompt)
    .bind(&output)
    .execute(&state.pool)
    .await?;

    sqlx::query("update sessions set updated_at = now() where id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await?;

    Ok(Json(CreateRunResponse {
        run_id,
        session_id,
        model_used,
        stream_path: format!("/v1/chat/runs/{run_id}/stream"),
    }))
}

pub async fn get_run(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<RunRow>, ApiError> {
    let run = sqlx::query_as::<_, RunRow>(
        "select id, session_id, prompt, status, output, metadata, created_at, updated_at from chat_runs where id = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    Ok(Json(run))
}

pub async fn stream_run(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Sse<BoxStream<'static, Result<Event, Infallible>>>, ApiError> {
    let run = sqlx::query_as::<_, RunRow>(
        "select id, session_id, prompt, status, output, metadata, created_at, updated_at from chat_runs where id = $1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let output = run.output;
    let token_stream: BoxStream<'static, Result<Event, Infallible>> = Box::pin(stream! {
        for token in output.split_whitespace() {
            tokio::time::sleep(Duration::from_millis(20)).await;
            yield Ok(Event::default().data(format!("{token} ")));
        }
        yield Ok(Event::default().event("done").data("[DONE]"));
    });

    Ok(Sse::new(token_stream).keep_alive(KeepAlive::default()))
}
