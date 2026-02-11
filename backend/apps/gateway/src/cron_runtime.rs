use crate::error::ApiError;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use cron::Schedule;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use std::str::FromStr;
use std::time::Duration;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronJobPayload {
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronCreateRequest {
    pub name: String,
    pub schedule_kind: String,
    pub schedule_expr: String,
    pub timezone: Option<String>,
    pub payload: CronJobPayload,
    pub session_target: String,
    pub delivery_mode: Option<String>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct CronJobRow {
    pub id: Uuid,
    pub name: String,
    pub schedule_kind: String,
    pub schedule_expr: String,
    pub timezone: Option<String>,
    pub payload: Value,
    pub session_target: String,
    pub delivery_mode: Option<String>,
    pub enabled: bool,
    pub next_run_at: Option<DateTime<Utc>>,
    pub last_run_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, FromRow)]
pub struct CronRunRow {
    pub id: Uuid,
    pub cron_job_id: Uuid,
    pub status: String,
    pub started_at: DateTime<Utc>,
    pub finished_at: Option<DateTime<Utc>>,
    pub output: Value,
}

pub fn compute_next_run(
    schedule_kind: &str,
    schedule_expr: &str,
    now: DateTime<Utc>,
) -> Result<Option<DateTime<Utc>>, ApiError> {
    match schedule_kind {
        "every" => {
            let seconds = schedule_expr
                .trim()
                .parse::<i64>()
                .map_err(|_| ApiError::BadRequest("every schedule expects seconds".to_string()))?;
            if seconds <= 0 {
                return Err(ApiError::BadRequest(
                    "every schedule seconds must be positive".to_string(),
                ));
            }
            Ok(Some(now + chrono::TimeDelta::seconds(seconds)))
        }
        "at" => {
            let parsed = DateTime::parse_from_rfc3339(schedule_expr.trim())
                .map_err(|_| ApiError::BadRequest("at schedule must be ISO datetime".to_string()))?
                .with_timezone(&Utc);

            if parsed <= now {
                Ok(None)
            } else {
                Ok(Some(parsed))
            }
        }
        "cron" => {
            let schedule = Schedule::from_str(schedule_expr.trim())
                .map_err(|error| ApiError::BadRequest(format!("invalid cron schedule: {error}")))?;
            Ok(schedule.after(&now).next())
        }
        _ => Err(ApiError::BadRequest(
            "schedule_kind must be one of: every, at, cron".to_string(),
        )),
    }
}

pub async fn create_job(
    state: &AppState,
    payload: CronCreateRequest,
) -> Result<CronJobRow, ApiError> {
    let now = Utc::now();
    let next_run = compute_next_run(&payload.schedule_kind, &payload.schedule_expr, now)?;

    let row = sqlx::query_as::<_, CronJobRow>(
        r#"
        insert into cron_jobs (
          name,
          schedule_kind,
          schedule_expr,
          timezone,
          payload,
          session_target,
          delivery_mode,
          enabled,
          next_run_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, true, $8)
        returning
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
        "#,
    )
    .bind(payload.name)
    .bind(payload.schedule_kind)
    .bind(payload.schedule_expr)
    .bind(payload.timezone)
    .bind(serde_json::to_value(payload.payload).unwrap_or_else(|_| Value::Null))
    .bind(payload.session_target)
    .bind(payload.delivery_mode)
    .bind(next_run)
    .fetch_one(&state.pool)
    .await?;

    Ok(row)
}

async fn append_message_to_session(
    state: &AppState,
    session_id: Uuid,
    role: &str,
    text: &str,
) -> Result<(), ApiError> {
    sqlx::query(
        r#"
        insert into session_messages (session_id, role, text)
        values ($1, $2, $3)
        "#,
    )
    .bind(session_id)
    .bind(role)
    .bind(text)
    .execute(&state.pool)
    .await?;

    sqlx::query("update sessions set updated_at = now() where id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await?;

    Ok(())
}

async fn resolve_session_for_job(state: &AppState, job: &CronJobRow) -> Result<Uuid, ApiError> {
    if job.session_target == "main" {
        let session = sqlx::query_as::<_, (Uuid,)>(
            r#"
            insert into sessions (title)
            values ('main')
            on conflict do nothing
            returning id
            "#,
        )
        .fetch_optional(&state.pool)
        .await?;

        if let Some((session_id,)) = session {
            return Ok(session_id);
        }

        let existing = sqlx::query_as::<_, (Uuid,)>(
            "select id from sessions where title = 'main' order by updated_at desc limit 1",
        )
        .fetch_optional(&state.pool)
        .await?;

        if let Some((session_id,)) = existing {
            return Ok(session_id);
        }
    }

    let created =
        sqlx::query_as::<_, (Uuid,)>("insert into sessions (title) values ($1) returning id")
            .bind(format!("cron:{}", job.name))
            .fetch_one(&state.pool)
            .await?;

    Ok(created.0)
}

pub async fn execute_job(state: &AppState, job: &CronJobRow) -> Result<CronRunRow, ApiError> {
    let run = sqlx::query_as::<_, CronRunRow>(
        r#"
        insert into cron_runs (cron_job_id, status, output)
        values ($1, 'running', '{}'::jsonb)
        returning id, cron_job_id, status, started_at, finished_at, output
        "#,
    )
    .bind(job.id)
    .fetch_one(&state.pool)
    .await?;

    let message = job
        .payload
        .get("message")
        .and_then(Value::as_str)
        .unwrap_or("Scheduled cron run");

    let session_id = resolve_session_for_job(state, job).await?;
    append_message_to_session(state, session_id, "system", message).await?;
    append_message_to_session(
        state,
        session_id,
        "assistant",
        "Cron job executed by Rust gateway scheduler.",
    )
    .await?;

    let output = serde_json::json!({
        "session_id": session_id,
        "message": message,
    });

    let run = sqlx::query_as::<_, CronRunRow>(
        r#"
        update cron_runs
        set status = 'done', finished_at = now(), output = $2
        where id = $1
        returning id, cron_job_id, status, started_at, finished_at, output
        "#,
    )
    .bind(run.id)
    .bind(output)
    .fetch_one(&state.pool)
    .await?;

    let now = Utc::now();
    let next_run = compute_next_run(&job.schedule_kind, &job.schedule_expr, now)?;
    let enabled = if job.schedule_kind == "at" {
        next_run.is_some()
    } else {
        true
    };

    sqlx::query(
        r#"
        update cron_jobs
        set
          last_run_at = now(),
          next_run_at = $2,
          enabled = $3,
          last_error = null,
          updated_at = now()
        where id = $1
        "#,
    )
    .bind(job.id)
    .bind(next_run)
    .bind(enabled)
    .execute(&state.pool)
    .await?;

    Ok(run)
}

pub async fn scheduler_loop(state: AppState) {
    loop {
        let due_jobs = sqlx::query_as::<_, CronJobRow>(
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
            where enabled = true and next_run_at is not null and next_run_at <= now()
            order by next_run_at asc
            limit 25
            "#,
        )
        .fetch_all(&state.pool)
        .await;

        match due_jobs {
            Ok(jobs) => {
                for job in jobs {
                    if let Err(error) = execute_job(&state, &job).await {
                        let _ = sqlx::query(
                            r#"
                            update cron_jobs
                            set last_error = $2, updated_at = now(), next_run_at = now() + interval '1 minute'
                            where id = $1
                            "#,
                        )
                        .bind(job.id)
                        .bind(error.to_string())
                        .execute(&state.pool)
                        .await;
                    }
                }
            }
            Err(error) => {
                tracing::error!("cron scheduler query failed: {}", error);
            }
        }

        tokio::time::sleep(Duration::from_secs(state.config.cron_poll_interval_secs)).await;
    }
}
