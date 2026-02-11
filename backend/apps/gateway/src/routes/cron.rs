use crate::cron_runtime;
use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::{Path, State};
use axum::Json;
use serde_json::Value;
use uuid::Uuid;

pub async fn list_jobs(
    State(state): State<AppState>,
) -> Result<Json<Vec<cron_runtime::CronJobRow>>, ApiError> {
    let jobs = sqlx::query_as::<_, cron_runtime::CronJobRow>(
        r#"
        select
          id,
          name,
          schedule_kind,
          schedule_expr,
          timezone,
          payload,
          session_target,
          delivery_mode,
          enabled,
          next_run_at,
          last_run_at,
          last_error,
          created_at,
          updated_at
        from cron_jobs
        order by created_at desc
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(jobs))
}

pub async fn list_runs(
    State(state): State<AppState>,
) -> Result<Json<Vec<cron_runtime::CronRunRow>>, ApiError> {
    let runs = sqlx::query_as::<_, cron_runtime::CronRunRow>(
        r#"
        select id, cron_job_id, status, started_at, finished_at, output
        from cron_runs
        order by started_at desc
        limit 100
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(runs))
}

pub async fn create_job(
    State(state): State<AppState>,
    Json(payload): Json<cron_runtime::CronCreateRequest>,
) -> Result<Json<cron_runtime::CronJobRow>, ApiError> {
    let job = cron_runtime::create_job(&state, payload).await?;
    Ok(Json(job))
}

pub async fn run_job_now(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<cron_runtime::CronRunRow>, ApiError> {
    let job = sqlx::query_as::<_, cron_runtime::CronJobRow>(
        r#"
        select
          id,
          name,
          schedule_kind,
          schedule_expr,
          timezone,
          payload,
          session_target,
          delivery_mode,
          enabled,
          next_run_at,
          last_run_at,
          last_error,
          created_at,
          updated_at
        from cron_jobs
        where id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await?
    .ok_or(ApiError::NotFound)?;

    let run = cron_runtime::execute_job(&state, &job).await?;
    Ok(Json(run))
}

pub async fn delete_job(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Value>, ApiError> {
    let result = sqlx::query("delete from cron_jobs where id = $1")
        .bind(id)
        .execute(&state.pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(ApiError::NotFound);
    }

    Ok(Json(serde_json::json!({ "deleted": true })))
}
