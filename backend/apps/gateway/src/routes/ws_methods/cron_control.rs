use super::WsMethodError;
use crate::cron_runtime;
use crate::error::ApiError;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::BTreeSet;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::OnceLock;
use std::time::{Duration, Instant};
use tokio::process::Command;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
struct CronStatusParams {}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CronUpdateParams {
    id: Option<String>,
    #[serde(alias = "job_id")]
    job_id: Option<String>,
    patch: CronUpdatePatch,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct CronUpdatePatch {
    name: Option<String>,
    enabled: Option<bool>,
    schedule: Option<Value>,
    payload: Option<Value>,
    #[serde(alias = "session_target")]
    session_target: Option<String>,
    #[serde(alias = "delivery_mode")]
    delivery_mode: Option<String>,
    delivery: Option<Value>,

    // Known OpenClaw fields that MAP Rust runtime does not support yet.
    description: Option<Value>,
    delete_after_run: Option<Value>,
    wake_mode: Option<Value>,
    agent_id: Option<Value>,
    state: Option<Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TalkModeParams {
    enabled: bool,
    phase: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct UpdateRunParams {
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    note: Option<String>,
    #[serde(alias = "restart_delay_ms")]
    restart_delay_ms: Option<i64>,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<i64>,
}

#[derive(Debug, Clone, Default)]
struct TalkModeState {
    enabled: bool,
    phase: Option<String>,
    ts: i64,
}

#[derive(Debug, Clone)]
struct ParsedSchedule {
    kind: String,
    expr: String,
    timezone_override: Option<Option<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateStepResult {
    name: String,
    command: String,
    cwd: String,
    duration_ms: i64,
    exit_code: Option<i32>,
    stdout_tail: Option<String>,
    stderr_tail: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateSnapshot {
    sha: Option<String>,
    version: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct UpdateRunResult {
    status: String,
    mode: String,
    root: Option<String>,
    reason: Option<String>,
    before: Option<UpdateSnapshot>,
    after: Option<UpdateSnapshot>,
    steps: Vec<UpdateStepResult>,
    duration_ms: i64,
}

#[derive(Debug)]
struct UpdateStepOutcome {
    step: UpdateStepResult,
    error: Option<String>,
}

static TALK_MODE_STATE: OnceLock<RwLock<TalkModeState>> = OnceLock::new();

const UPDATE_TIMEOUT_MS_DEFAULT: i64 = 20 * 60_000;
const UPDATE_LOG_TAIL_MAX_CHARS: usize = 8_000;

pub(crate) async fn cron_status(state: &AppState, params: Value) -> Result<Value, WsMethodError> {
    serde_json::from_value::<CronStatusParams>(params)
        .map_err(|_| invalid_request("invalid cron.status params"))?;

    let jobs = sqlx::query_scalar::<_, i64>("select count(*)::bigint from cron_jobs")
        .fetch_one(&state.pool)
        .await
        .map_err(|error| request_failed(error.to_string()))?;

    let next_wake_at = sqlx::query_scalar::<_, Option<DateTime<Utc>>>(
        "select min(next_run_at) from cron_jobs where enabled = true and next_run_at is not null",
    )
    .fetch_one(&state.pool)
    .await
    .map_err(|error| request_failed(error.to_string()))?;

    Ok(build_cron_status_payload(
        jobs,
        next_wake_at.map(|value| value.timestamp_millis()),
        state.config.cron_poll_interval_secs,
    ))
}

pub(crate) async fn cron_update(state: &AppState, params: Value) -> Result<Value, WsMethodError> {
    let params = serde_json::from_value::<CronUpdateParams>(params)
        .map_err(|_| invalid_request("invalid cron.update params"))?;

    let id_raw = resolve_cron_update_id(&params)
        .ok_or_else(|| invalid_request("invalid cron.update params: missing id"))?;
    let job_id = Uuid::parse_str(&id_raw)
        .map_err(|_| invalid_request("invalid cron.update params: id must be a UUID"))?;

    let existing = sqlx::query_as::<_, cron_runtime::CronJobRow>(
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
    .bind(job_id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|error| request_failed(error.to_string()))?
    .ok_or_else(|| not_found("cron job not found"))?;

    let mut name = existing.name.clone();
    if let Some(next_name) = params.patch.name.as_deref().map(str::trim) {
        if next_name.is_empty() {
            return Err(invalid_request(
                "invalid cron.update params: patch.name cannot be empty",
            ));
        }
        name = next_name.to_string();
    }

    let mut schedule_kind = existing.schedule_kind.clone();
    let mut schedule_expr = existing.schedule_expr.clone();
    let mut timezone = existing.timezone.clone();
    if let Some(schedule_patch) = params.patch.schedule.as_ref() {
        let parsed = parse_schedule_patch(schedule_patch)?;
        schedule_kind = parsed.kind;
        schedule_expr = parsed.expr;
        if let Some(value) = parsed.timezone_override {
            timezone = value;
        }
    }

    let mut payload = existing.payload.clone();
    if let Some(payload_patch) = params.patch.payload.as_ref() {
        let message = parse_payload_message(payload_patch)?;
        upsert_payload_message(&mut payload, message);
    }
    apply_openclaw_patch_fields(&mut payload, &params.patch)?;

    let mut session_target = existing.session_target.clone();
    if let Some(target) = params.patch.session_target.as_deref().map(str::trim) {
        let normalized = target.to_lowercase();
        if normalized != "main" && normalized != "isolated" {
            return Err(invalid_request(
                "invalid cron.update params: patch.sessionTarget must be `main` or `isolated`",
            ));
        }
        session_target = normalized;
    }

    let mut delivery_mode = existing.delivery_mode.clone();
    if let Some(mode) = resolve_delivery_mode_patch(&params.patch)? {
        delivery_mode = Some(mode);
    }

    let enabled = params.patch.enabled.unwrap_or(existing.enabled);
    let schedule_changed = params.patch.schedule.is_some();
    let enabled_changed = params.patch.enabled.is_some();

    let mut next_run_at = existing.next_run_at;
    if !enabled {
        next_run_at = None;
    } else if schedule_changed || enabled_changed {
        next_run_at = Some(
            cron_runtime::compute_next_run(&schedule_kind, &schedule_expr, Utc::now())
                .map_err(|error| invalid_request(format!("invalid cron.update params: {}", error)))?
                .ok_or_else(|| {
                    invalid_request(
                        "invalid cron.update params: schedule must resolve to a future run",
                    )
                })?,
        );
    }

    let updated = sqlx::query_as::<_, cron_runtime::CronJobRow>(
        r#"
        update cron_jobs
        set
          name = $2,
          schedule_kind = $3,
          schedule_expr = $4,
          timezone = $5,
          payload = $6,
          session_target = $7,
          delivery_mode = $8,
          enabled = $9,
          next_run_at = $10,
          updated_at = now()
        where id = $1
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
    .bind(job_id)
    .bind(name)
    .bind(schedule_kind)
    .bind(schedule_expr)
    .bind(timezone)
    .bind(payload)
    .bind(session_target)
    .bind(delivery_mode)
    .bind(enabled)
    .bind(next_run_at)
    .fetch_one(&state.pool)
    .await
    .map_err(|error| request_failed(error.to_string()))?;

    Ok(build_cron_update_response(updated))
}

pub(crate) async fn talk_mode(params: Value) -> Result<Value, WsMethodError> {
    let params = serde_json::from_value::<TalkModeParams>(params)
        .map_err(|_| invalid_request("invalid talk.mode params"))?;

    let phase = params
        .phase
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string);

    let payload = json!({
        "enabled": params.enabled,
        "phase": phase,
        "ts": Utc::now().timestamp_millis(),
    });

    let mut state = talk_mode_state().write().await;
    state.enabled = params.enabled;
    state.phase = payload
        .get("phase")
        .and_then(Value::as_str)
        .map(ToString::to_string);
    state.ts = payload
        .get("ts")
        .and_then(Value::as_i64)
        .unwrap_or_default();

    Ok(payload)
}

pub(crate) async fn update_run(params: Value) -> Result<Value, WsMethodError> {
    let params = serde_json::from_value::<UpdateRunParams>(params)
        .map_err(|_| invalid_request("invalid update.run params"))?;

    validate_update_run_params(&params)?;

    let session_key = params
        .session_key
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string);
    let note = params
        .note
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string);

    let result = run_gateway_update(params.timeout_ms).await;
    let sentinel_payload =
        build_update_sentinel_payload(&result, session_key.clone(), note.clone());
    let sentinel_path = write_restart_sentinel(&sentinel_payload).await.ok();
    let restart = schedule_gateway_sigusr1_restart(params.restart_delay_ms, "update.run");

    Ok(json!({
        "ok": true,
        "result": result,
        "restart": restart,
        "sentinel": {
            "path": sentinel_path,
            "payload": sentinel_payload,
        },
    }))
}

fn talk_mode_state() -> &'static RwLock<TalkModeState> {
    TALK_MODE_STATE.get_or_init(|| RwLock::new(TalkModeState::default()))
}

fn build_cron_status_payload(
    job_count: i64,
    next_wake_at_ms: Option<i64>,
    poll_interval: u64,
) -> Value {
    json!({
        "enabled": true,
        "storePath": "postgres:cron_jobs",
        "jobs": job_count.max(0),
        "nextWakeAtMs": next_wake_at_ms,
        "pollIntervalSecs": poll_interval,
    })
}

fn resolve_cron_update_id(params: &CronUpdateParams) -> Option<String> {
    params
        .id
        .as_deref()
        .or(params.job_id.as_deref())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn build_cron_update_response(updated: cron_runtime::CronJobRow) -> Value {
    let mut response = json!(updated);
    let Some(object) = response.as_object_mut() else {
        return response;
    };

    let openclaw_meta = object
        .get("payload")
        .and_then(Value::as_object)
        .and_then(|payload| payload.get("openclaw"))
        .and_then(Value::as_object)
        .cloned();

    if let Some(meta) = openclaw_meta {
        for key in [
            "description",
            "deleteAfterRun",
            "wakeMode",
            "agentId",
            "state",
        ] {
            if let Some(value) = meta.get(key) {
                object.insert(key.to_string(), value.clone());
            }
        }
    }

    response
}

fn upsert_payload_message(payload: &mut Value, message: String) {
    if !payload.is_object() {
        *payload = json!({});
    }
    if let Some(object) = payload.as_object_mut() {
        object.insert("message".to_string(), Value::String(message));
    }
}

fn apply_openclaw_patch_fields(
    payload: &mut Value,
    patch: &CronUpdatePatch,
) -> Result<(), WsMethodError> {
    let mut changed = false;
    let mut description_patch = None;
    let mut delete_after_run_patch = None;
    let mut wake_mode_patch = None;
    let mut agent_id_patch = None;
    let mut state_patch = None;

    if let Some(value) = patch.description.as_ref() {
        description_patch = Some(parse_nullable_string_patch(
            value,
            "patch.description",
            true,
        )?);
        changed = true;
    }

    if let Some(value) = patch.delete_after_run.as_ref() {
        delete_after_run_patch = Some(parse_boolean_patch(value, "patch.deleteAfterRun")?);
        changed = true;
    }

    if let Some(value) = patch.wake_mode.as_ref() {
        wake_mode_patch = Some(parse_wake_mode_patch(value)?);
        changed = true;
    }

    if let Some(value) = patch.agent_id.as_ref() {
        agent_id_patch = Some(parse_agent_id_patch(value)?);
        changed = true;
    }

    if let Some(value) = patch.state.as_ref() {
        state_patch = Some(parse_state_patch(value)?);
        changed = true;
    }

    if !changed {
        return Ok(());
    }

    if !payload.is_object() {
        *payload = json!({});
    }
    let Some(payload_object) = payload.as_object_mut() else {
        return Ok(());
    };

    let mut openclaw = payload_object
        .get("openclaw")
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();

    if let Some(value) = description_patch {
        match value {
            Some(text) => {
                openclaw.insert("description".to_string(), Value::String(text));
            }
            None => {
                openclaw.remove("description");
            }
        }
    }

    if let Some(value) = delete_after_run_patch {
        openclaw.insert("deleteAfterRun".to_string(), Value::Bool(value));
    }

    if let Some(value) = wake_mode_patch {
        openclaw.insert("wakeMode".to_string(), Value::String(value));
    }

    if let Some(value) = agent_id_patch {
        match value {
            Some(agent_id) => {
                openclaw.insert("agentId".to_string(), Value::String(agent_id));
            }
            None => {
                openclaw.remove("agentId");
            }
        }
    }

    if let Some(value) = state_patch {
        openclaw.insert("state".to_string(), value);
    }

    if openclaw.is_empty() {
        payload_object.remove("openclaw");
    } else {
        payload_object.insert("openclaw".to_string(), Value::Object(openclaw));
    }

    Ok(())
}

fn parse_nullable_string_patch(
    value: &Value,
    field_name: &str,
    allow_empty: bool,
) -> Result<Option<String>, WsMethodError> {
    if value.is_null() {
        return Ok(None);
    }

    let Some(raw) = value.as_str() else {
        return Err(invalid_request(format!(
            "invalid cron.update params: {field_name} must be a string or null"
        )));
    };

    let normalized = raw.trim().to_string();
    if !allow_empty && normalized.is_empty() {
        return Err(invalid_request(format!(
            "invalid cron.update params: {field_name} must be a non-empty string or null"
        )));
    }

    Ok(Some(normalized))
}

fn parse_boolean_patch(value: &Value, field_name: &str) -> Result<bool, WsMethodError> {
    value.as_bool().ok_or_else(|| {
        invalid_request(format!(
            "invalid cron.update params: {field_name} must be a boolean"
        ))
    })
}

fn parse_wake_mode_patch(value: &Value) -> Result<String, WsMethodError> {
    let Some(raw_mode) = value.as_str() else {
        return Err(invalid_request(
            "invalid cron.update params: patch.wakeMode must be `next-heartbeat` or `now`",
        ));
    };

    let normalized = raw_mode.trim().to_lowercase();
    if normalized == "next-heartbeat" || normalized == "now" {
        Ok(normalized)
    } else {
        Err(invalid_request(
            "invalid cron.update params: patch.wakeMode must be `next-heartbeat` or `now`",
        ))
    }
}

fn parse_agent_id_patch(value: &Value) -> Result<Option<String>, WsMethodError> {
    if value.is_null() {
        return Ok(None);
    }

    let Some(raw_agent_id) = value.as_str() else {
        return Err(invalid_request(
            "invalid cron.update params: patch.agentId must be a non-empty string or null",
        ));
    };

    let trimmed = raw_agent_id.trim();
    if trimmed.is_empty() {
        return Err(invalid_request(
            "invalid cron.update params: patch.agentId must be a non-empty string or null",
        ));
    }

    Ok(Some(normalize_agent_id(trimmed)))
}

fn normalize_agent_id(value: &str) -> String {
    let lowered = value.trim().to_lowercase();
    if lowered.is_empty() {
        return "main".to_string();
    }

    let mut output = String::with_capacity(lowered.len().min(64));
    let mut last_dash = false;
    for ch in lowered.chars() {
        if output.len() >= 64 {
            break;
        }

        if ch.is_ascii_alphanumeric() || ch == '_' || ch == '-' {
            output.push(ch);
            last_dash = false;
        } else if !last_dash {
            output.push('-');
            last_dash = true;
        }
    }

    while output.starts_with('-') {
        output.remove(0);
    }
    while output.ends_with('-') {
        output.pop();
    }

    if output.is_empty() {
        "main".to_string()
    } else {
        output
    }
}

fn parse_state_patch(value: &Value) -> Result<Value, WsMethodError> {
    let Some(object) = value.as_object() else {
        return Err(invalid_request(
            "invalid cron.update params: patch.state must be an object",
        ));
    };

    let mut normalized = serde_json::Map::new();
    let allowed_status_values: BTreeSet<&str> = ["ok", "error", "skipped"].into_iter().collect();

    for (key, raw_value) in object {
        match key.as_str() {
            "nextRunAtMs" | "runningAtMs" | "lastRunAtMs" | "lastDurationMs"
            | "consecutiveErrors" => {
                let Some(value) = raw_value.as_i64() else {
                    return Err(invalid_request(format!(
                        "invalid cron.update params: patch.state.{key} must be an integer >= 0"
                    )));
                };
                if value < 0 {
                    return Err(invalid_request(format!(
                        "invalid cron.update params: patch.state.{key} must be an integer >= 0"
                    )));
                }
                normalized.insert(key.clone(), Value::Number(value.into()));
            }
            "lastStatus" => {
                let Some(status) = raw_value.as_str() else {
                    return Err(invalid_request(
                        "invalid cron.update params: patch.state.lastStatus must be `ok`, `error`, or `skipped`",
                    ));
                };
                let normalized_status = status.trim().to_lowercase();
                if !allowed_status_values.contains(normalized_status.as_str()) {
                    return Err(invalid_request(
                        "invalid cron.update params: patch.state.lastStatus must be `ok`, `error`, or `skipped`",
                    ));
                }
                normalized.insert("lastStatus".to_string(), Value::String(normalized_status));
            }
            "lastError" => {
                let Some(error_value) = raw_value.as_str() else {
                    return Err(invalid_request(
                        "invalid cron.update params: patch.state.lastError must be a string",
                    ));
                };
                normalized.insert(
                    "lastError".to_string(),
                    Value::String(error_value.to_string()),
                );
            }
            _ => {
                return Err(invalid_request(format!(
                    "invalid cron.update params: patch.state.{key} is not supported"
                )));
            }
        }
    }

    Ok(Value::Object(normalized))
}

fn parse_schedule_patch(value: &Value) -> Result<ParsedSchedule, WsMethodError> {
    let object = value.as_object().ok_or_else(|| {
        invalid_request("invalid cron.update params: patch.schedule must be an object")
    })?;

    let kind = object
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .trim()
        .to_lowercase();

    match kind.as_str() {
        "every" => {
            let every_ms = object
                .get("everyMs")
                .or_else(|| object.get("every_ms"))
                .and_then(Value::as_i64)
                .ok_or_else(|| {
                    invalid_request(
                        "invalid cron.update params: patch.schedule.everyMs must be a positive integer",
                    )
                })?;
            if every_ms <= 0 {
                return Err(invalid_request(
                    "invalid cron.update params: patch.schedule.everyMs must be a positive integer",
                ));
            }

            Ok(ParsedSchedule {
                kind: "every".to_string(),
                expr: ((every_ms / 1000).max(1)).to_string(),
                timezone_override: Some(None),
            })
        }
        "cron" => {
            let expr = object
                .get("expr")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .ok_or_else(|| {
                    invalid_request(
                        "invalid cron.update params: patch.schedule.expr is required for cron schedules",
                    )
                })?
                .to_string();

            let timezone_override = object
                .get("tz")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(|value| Some(value.to_string()));

            Ok(ParsedSchedule {
                kind: "cron".to_string(),
                expr,
                timezone_override,
            })
        }
        "at" => {
            let at = object
                .get("at")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .ok_or_else(|| {
                    invalid_request(
                        "invalid cron.update params: patch.schedule.at is required for at schedules",
                    )
                })?
                .to_string();

            Ok(ParsedSchedule {
                kind: "at".to_string(),
                expr: at,
                timezone_override: Some(None),
            })
        }
        _ => Err(invalid_request(
            "invalid cron.update params: patch.schedule.kind must be one of `every`, `cron`, `at`",
        )),
    }
}

fn parse_payload_message(value: &Value) -> Result<String, WsMethodError> {
    let object = value.as_object().ok_or_else(|| {
        invalid_request("invalid cron.update params: patch.payload must be an object")
    })?;

    let kind = object
        .get("kind")
        .and_then(Value::as_str)
        .unwrap_or_default()
        .trim();

    if kind.eq_ignore_ascii_case("systemEvent") {
        return object
            .get("text")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToString::to_string)
            .ok_or_else(|| {
                invalid_request(
                    "invalid cron.update params: patch.payload.text is required for `systemEvent`",
                )
            });
    }

    if kind.eq_ignore_ascii_case("agentTurn") {
        return object
            .get("message")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToString::to_string)
            .ok_or_else(|| {
                invalid_request(
                    "invalid cron.update params: patch.payload.message is required for `agentTurn`",
                )
            });
    }

    object
        .get("message")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .or_else(|| {
            object
                .get("text")
                .and_then(Value::as_str)
                .map(str::trim)
                .filter(|value| !value.is_empty())
        })
        .map(ToString::to_string)
        .ok_or_else(|| {
            invalid_request(
                "invalid cron.update params: patch.payload must include a non-empty `message` or `text`",
            )
        })
}

fn resolve_delivery_mode_patch(patch: &CronUpdatePatch) -> Result<Option<String>, WsMethodError> {
    if let Some(raw_mode) = patch.delivery_mode.as_deref() {
        return parse_delivery_mode(raw_mode).map(Some);
    }

    let Some(delivery) = patch.delivery.as_ref() else {
        return Ok(None);
    };

    let object = delivery.as_object().ok_or_else(|| {
        invalid_request("invalid cron.update params: patch.delivery must be an object")
    })?;
    let mode = object
        .get("mode")
        .and_then(Value::as_str)
        .ok_or_else(|| {
            invalid_request(
                "invalid cron.update params: patch.delivery.mode is required when patch.delivery is present",
            )
        })?;

    parse_delivery_mode(mode).map(Some)
}

fn parse_delivery_mode(raw_mode: &str) -> Result<String, WsMethodError> {
    let normalized = raw_mode.trim().to_lowercase();
    if normalized == "none" || normalized == "announce" {
        Ok(normalized)
    } else {
        Err(invalid_request(
            "invalid cron.update params: delivery mode must be `none` or `announce`",
        ))
    }
}

async fn run_gateway_update(timeout_override_ms: Option<i64>) -> UpdateRunResult {
    let started = Instant::now();
    let timeout_ms = timeout_override_ms
        .unwrap_or(UPDATE_TIMEOUT_MS_DEFAULT)
        .max(1);

    if cfg!(test) {
        return UpdateRunResult {
            status: "skipped".to_string(),
            mode: "unknown".to_string(),
            root: None,
            reason: Some("update runner disabled in test builds".to_string()),
            before: None,
            after: None,
            steps: Vec::new(),
            duration_ms: started.elapsed().as_millis() as i64,
        };
    }

    let start_dir = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let git_root = resolve_git_root(&start_dir, timeout_ms).await;
    let root = git_root.clone().unwrap_or(start_dir.clone());
    let mode = if git_root.is_some() {
        "git".to_string()
    } else {
        detect_package_manager_mode(&root)
    };

    let before = read_update_snapshot(&root, timeout_ms).await;
    let mut steps = Vec::new();

    let (status, reason) = if mode == "git" {
        let outcome =
            run_update_step("pull", "git", &["pull", "--ff-only"], &root, timeout_ms).await;
        steps.push(outcome.step.clone());

        if outcome.step.exit_code == Some(0) && outcome.error.is_none() {
            ("ok".to_string(), None)
        } else {
            let fallback = outcome
                .step
                .stderr_tail
                .clone()
                .or(outcome.step.stdout_tail.clone())
                .unwrap_or_else(|| "git pull --ff-only failed".to_string());
            ("error".to_string(), outcome.error.or(Some(fallback)))
        }
    } else {
        (
            "skipped".to_string(),
            Some(format!(
                "update mode `{mode}` is recognized but only git pull updates are implemented in MAP Rust gateway"
            )),
        )
    };

    let after = read_update_snapshot(&root, timeout_ms).await;

    UpdateRunResult {
        status,
        mode,
        root: Some(root.to_string_lossy().to_string()),
        reason,
        before,
        after,
        steps,
        duration_ms: started.elapsed().as_millis() as i64,
    }
}

fn detect_package_manager_mode(root: &Path) -> String {
    if root.join("bun.lock").exists() || root.join("bun.lockb").exists() {
        return "bun".to_string();
    }
    if root.join("pnpm-lock.yaml").exists() {
        return "pnpm".to_string();
    }
    if root.join("package-lock.json").exists() {
        return "npm".to_string();
    }
    "unknown".to_string()
}

async fn resolve_git_root(start_dir: &Path, timeout_ms: i64) -> Option<PathBuf> {
    let mut command = Command::new("git");
    command
        .args([
            "-C",
            &start_dir.to_string_lossy(),
            "rev-parse",
            "--show-toplevel",
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true);

    let output = tokio::time::timeout(Duration::from_millis(timeout_ms as u64), command.output())
        .await
        .ok()?
        .ok()?;
    if !output.status.success() {
        return None;
    }

    let root = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if root.is_empty() {
        None
    } else {
        Some(PathBuf::from(root))
    }
}

async fn read_update_snapshot(root: &Path, timeout_ms: i64) -> Option<UpdateSnapshot> {
    let sha = read_git_sha(root, timeout_ms).await;
    let version = read_package_version(root).await;
    if sha.is_none() && version.is_none() {
        None
    } else {
        Some(UpdateSnapshot { sha, version })
    }
}

async fn read_git_sha(root: &Path, timeout_ms: i64) -> Option<String> {
    let mut command = Command::new("git");
    command
        .args(["-C", &root.to_string_lossy(), "rev-parse", "HEAD"])
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .kill_on_drop(true);

    let output = tokio::time::timeout(Duration::from_millis(timeout_ms as u64), command.output())
        .await
        .ok()?
        .ok()?;
    if !output.status.success() {
        return None;
    }

    let sha = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if sha.is_empty() {
        None
    } else {
        Some(sha)
    }
}

async fn read_package_version(root: &Path) -> Option<String> {
    let package_json_path = root.join("package.json");
    let bytes = tokio::fs::read(package_json_path).await.ok()?;
    let value: Value = serde_json::from_slice(&bytes).ok()?;
    value
        .get("version")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

async fn run_update_step(
    name: &str,
    program: &str,
    args: &[&str],
    cwd: &Path,
    timeout_ms: i64,
) -> UpdateStepOutcome {
    let started = Instant::now();
    let command_string = std::iter::once(program)
        .chain(args.iter().copied())
        .collect::<Vec<_>>()
        .join(" ");
    let cwd_string = cwd.to_string_lossy().to_string();

    let mut command = Command::new(program);
    command
        .args(args)
        .current_dir(cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    let timed =
        tokio::time::timeout(Duration::from_millis(timeout_ms as u64), command.output()).await;
    match timed {
        Ok(Ok(output)) => {
            let stdout_tail = trim_log_tail(
                String::from_utf8_lossy(&output.stdout).as_ref(),
                UPDATE_LOG_TAIL_MAX_CHARS,
            );
            let stderr_tail = trim_log_tail(
                String::from_utf8_lossy(&output.stderr).as_ref(),
                UPDATE_LOG_TAIL_MAX_CHARS,
            );
            let exit_code = output.status.code();
            let error = if output.status.success() {
                None
            } else {
                Some(
                    stderr_tail
                        .clone()
                        .or(stdout_tail.clone())
                        .unwrap_or_else(|| format!("{command_string} exited unsuccessfully")),
                )
            };

            UpdateStepOutcome {
                step: UpdateStepResult {
                    name: name.to_string(),
                    command: command_string,
                    cwd: cwd_string,
                    duration_ms: started.elapsed().as_millis() as i64,
                    exit_code,
                    stdout_tail,
                    stderr_tail,
                },
                error,
            }
        }
        Ok(Err(error)) => UpdateStepOutcome {
            step: UpdateStepResult {
                name: name.to_string(),
                command: command_string.clone(),
                cwd: cwd_string,
                duration_ms: started.elapsed().as_millis() as i64,
                exit_code: None,
                stdout_tail: None,
                stderr_tail: Some(error.to_string()),
            },
            error: Some(format!("{command_string} failed to execute: {error}")),
        },
        Err(_) => {
            let timeout_error = format!("{command_string} timed out after {timeout_ms}ms");
            UpdateStepOutcome {
                step: UpdateStepResult {
                    name: name.to_string(),
                    command: command_string,
                    cwd: cwd_string,
                    duration_ms: started.elapsed().as_millis() as i64,
                    exit_code: None,
                    stdout_tail: None,
                    stderr_tail: Some(timeout_error.clone()),
                },
                error: Some(timeout_error),
            }
        }
    }
}

fn trim_log_tail(input: &str, max_chars: usize) -> Option<String> {
    let text = input.trim_end();
    if text.is_empty() {
        return None;
    }
    let total_chars = text.chars().count();
    if total_chars <= max_chars {
        return Some(text.to_string());
    }
    let mut reversed = text.chars().rev().take(max_chars).collect::<Vec<_>>();
    reversed.reverse();
    let tail = reversed.into_iter().collect::<String>();
    Some(format!("...{tail}"))
}

fn build_update_sentinel_payload(
    result: &UpdateRunResult,
    session_key: Option<String>,
    note: Option<String>,
) -> Value {
    json!({
        "kind": "update",
        "status": result.status,
        "ts": Utc::now().timestamp_millis(),
        "sessionKey": session_key,
        "message": note,
        "doctorHint": Value::Null,
        "stats": {
            "mode": result.mode,
            "root": result.root,
            "before": result.before,
            "after": result.after,
            "steps": result.steps.iter().map(|step| {
                json!({
                    "name": step.name,
                    "command": step.command,
                    "cwd": step.cwd,
                    "durationMs": step.duration_ms,
                    "log": {
                        "stdoutTail": step.stdout_tail,
                        "stderrTail": step.stderr_tail,
                        "exitCode": step.exit_code,
                    }
                })
            }).collect::<Vec<_>>(),
            "reason": result.reason,
            "durationMs": result.duration_ms,
        },
    })
}

async fn write_restart_sentinel(payload: &Value) -> Result<String, std::io::Error> {
    let path = resolve_restart_sentinel_path();
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }

    let content = serde_json::to_vec_pretty(&json!({
        "version": 1,
        "payload": payload,
    }))
    .map_err(std::io::Error::other)?;
    tokio::fs::write(&path, content).await?;

    Ok(path.to_string_lossy().to_string())
}

fn resolve_restart_sentinel_path() -> PathBuf {
    resolve_state_dir().join("restart-sentinel.json")
}

fn resolve_state_dir() -> PathBuf {
    std::env::var("OPENCLAW_STATE_DIR")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".openclaw")
        })
}

fn schedule_gateway_sigusr1_restart(delay_ms_override: Option<i64>, reason: &str) -> Value {
    let delay_ms = delay_ms_override.unwrap_or(2_000).clamp(0, 60_000);
    let pid = std::process::id();
    let mode = if should_emit_restart_signal() {
        let pid_string = pid.to_string();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_millis(delay_ms as u64)).await;
            let _ = Command::new("kill")
                .arg("-USR1")
                .arg(pid_string)
                .stdout(Stdio::null())
                .stderr(Stdio::null())
                .status()
                .await;
        });
        "signal"
    } else {
        "emit"
    };

    json!({
        "ok": true,
        "pid": pid,
        "signal": "SIGUSR1",
        "delayMs": delay_ms,
        "reason": reason,
        "mode": mode,
    })
}

fn should_emit_restart_signal() -> bool {
    if cfg!(test) {
        return false;
    }

    std::env::var("RUST_GATEWAY_UPDATE_RESTART_ENABLED")
        .ok()
        .and_then(|value| parse_bool_env(&value))
        .unwrap_or(true)
}

fn parse_bool_env(value: &str) -> Option<bool> {
    match value.trim().to_lowercase().as_str() {
        "1" | "true" | "yes" | "on" => Some(true),
        "0" | "false" | "no" | "off" => Some(false),
        _ => None,
    }
}

fn validate_update_run_params(params: &UpdateRunParams) -> Result<(), WsMethodError> {
    if let Some(restart_delay_ms) = params.restart_delay_ms {
        if restart_delay_ms < 0 {
            return Err(invalid_request(
                "invalid update.run params: restartDelayMs must be >= 0",
            ));
        }
    }

    if let Some(timeout_ms) = params.timeout_ms {
        if timeout_ms <= 0 {
            return Err(invalid_request(
                "invalid update.run params: timeoutMs must be >= 1",
            ));
        }
    }

    Ok(())
}

fn invalid_request(message: impl Into<String>) -> WsMethodError {
    WsMethodError::InvalidRequest(message.into())
}

fn not_found(_message: impl Into<String>) -> WsMethodError {
    WsMethodError::Api(ApiError::NotFound)
}

fn request_failed(message: impl Into<String>) -> WsMethodError {
    WsMethodError::Api(ApiError::Anyhow(anyhow::anyhow!(message.into())))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cron_status_payload_has_expected_shape() {
        let payload = build_cron_status_payload(3, Some(1700000000000), 10);
        assert_eq!(payload.get("enabled").and_then(Value::as_bool), Some(true));
        assert_eq!(payload.get("jobs").and_then(Value::as_i64), Some(3));
        assert_eq!(
            payload.get("nextWakeAtMs").and_then(Value::as_i64),
            Some(1700000000000)
        );
        assert_eq!(
            payload.get("pollIntervalSecs").and_then(Value::as_u64),
            Some(10)
        );
    }

    #[test]
    fn cron_update_params_parse_camel_and_snake_job_id() {
        let camel = serde_json::from_value::<CronUpdateParams>(json!({
            "jobId": "ea95b4f7-a8d7-4724-88fe-b7f95ec14f44",
            "patch": {"enabled": false}
        }))
        .expect("camel-case params should parse");
        assert_eq!(
            resolve_cron_update_id(&camel).as_deref(),
            Some("ea95b4f7-a8d7-4724-88fe-b7f95ec14f44")
        );

        let snake = serde_json::from_value::<CronUpdateParams>(json!({
            "job_id": "ea95b4f7-a8d7-4724-88fe-b7f95ec14f44",
            "patch": {"enabled": true}
        }))
        .expect("snake-case params should parse");
        assert_eq!(
            resolve_cron_update_id(&snake).as_deref(),
            Some("ea95b4f7-a8d7-4724-88fe-b7f95ec14f44")
        );
    }

    #[test]
    fn parse_schedule_patch_validates_every_schedule() {
        let parsed = parse_schedule_patch(&json!({
            "kind": "every",
            "everyMs": 90_000
        }))
        .expect("every schedule should parse");

        assert_eq!(parsed.kind, "every");
        assert_eq!(parsed.expr, "90");
        assert_eq!(parsed.timezone_override, Some(None));

        let err = parse_schedule_patch(&json!({
            "kind": "every",
            "everyMs": 0
        }))
        .expect_err("zero interval should fail");
        assert!(matches!(err, WsMethodError::InvalidRequest(_)));
    }

    #[test]
    fn parse_payload_message_validates_kind_requirements() {
        let system = parse_payload_message(&json!({
            "kind": "systemEvent",
            "text": "sync now"
        }))
        .expect("systemEvent payload should parse");
        assert_eq!(system, "sync now");

        let agent = parse_payload_message(&json!({
            "kind": "agentTurn",
            "message": "run summary"
        }))
        .expect("agentTurn payload should parse");
        assert_eq!(agent, "run summary");

        let err = parse_payload_message(&json!({
            "kind": "systemEvent",
            "text": ""
        }))
        .expect_err("empty systemEvent text should fail");
        assert!(matches!(err, WsMethodError::InvalidRequest(_)));
    }

    #[test]
    fn talk_mode_params_reject_unknown_fields() {
        let result = serde_json::from_value::<TalkModeParams>(json!({
            "enabled": true,
            "phase": "listening",
            "extra": true
        }));
        assert!(result.is_err());
    }

    #[test]
    fn update_run_validation_rejects_negative_values() {
        let negative_delay = UpdateRunParams {
            restart_delay_ms: Some(-1),
            ..UpdateRunParams::default()
        };
        assert!(validate_update_run_params(&negative_delay).is_err());

        let zero_timeout = UpdateRunParams {
            timeout_ms: Some(0),
            ..UpdateRunParams::default()
        };
        assert!(validate_update_run_params(&zero_timeout).is_err());
    }

    #[test]
    fn apply_openclaw_patch_fields_accepts_supported_fields() {
        let mut payload = json!({
            "message": "existing message"
        });
        let patch = CronUpdatePatch {
            description: Some(json!("nightly digest")),
            delete_after_run: Some(json!(true)),
            wake_mode: Some(json!("now")),
            agent_id: Some(json!("Ops Team")),
            state: Some(json!({
                "nextRunAtMs": 1700000000000i64,
                "lastStatus": "ok",
                "lastError": "none"
            })),
            ..CronUpdatePatch::default()
        };

        apply_openclaw_patch_fields(&mut payload, &patch)
            .expect("supported OpenClaw patch fields should apply");

        let meta = payload
            .get("openclaw")
            .and_then(Value::as_object)
            .expect("openclaw metadata should be present");
        assert_eq!(
            meta.get("description").and_then(Value::as_str),
            Some("nightly digest")
        );
        assert_eq!(
            meta.get("deleteAfterRun").and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(meta.get("wakeMode").and_then(Value::as_str), Some("now"));
        assert_eq!(
            meta.get("agentId").and_then(Value::as_str),
            Some("ops-team")
        );
        assert_eq!(
            meta.get("state")
                .and_then(Value::as_object)
                .and_then(|state| state.get("nextRunAtMs"))
                .and_then(Value::as_i64),
            Some(1700000000000)
        );
    }

    #[test]
    fn apply_openclaw_patch_fields_rejects_invalid_state_keys() {
        let mut payload = json!({
            "message": "existing"
        });
        let patch = CronUpdatePatch {
            state: Some(json!({
                "unexpected": true
            })),
            ..CronUpdatePatch::default()
        };

        let result = apply_openclaw_patch_fields(&mut payload, &patch);
        assert!(matches!(result, Err(WsMethodError::InvalidRequest(_))));
    }

    #[test]
    fn build_cron_update_response_promotes_openclaw_metadata() {
        let now = Utc::now();
        let row = cron_runtime::CronJobRow {
            id: Uuid::now_v7(),
            name: "digest".to_string(),
            schedule_kind: "every".to_string(),
            schedule_expr: "60".to_string(),
            timezone: None,
            payload: json!({
                "message": "existing",
                "openclaw": {
                    "wakeMode": "now",
                    "agentId": "ops",
                    "state": {
                        "lastStatus": "ok"
                    }
                }
            }),
            session_target: "main".to_string(),
            delivery_mode: Some("announce".to_string()),
            enabled: true,
            next_run_at: None,
            last_run_at: None,
            last_error: None,
            created_at: now,
            updated_at: now,
        };

        let response = build_cron_update_response(row);
        assert_eq!(
            response.get("wakeMode").and_then(Value::as_str),
            Some("now")
        );
        assert_eq!(response.get("agentId").and_then(Value::as_str), Some("ops"));
        assert_eq!(
            response
                .get("state")
                .and_then(Value::as_object)
                .and_then(|state| state.get("lastStatus"))
                .and_then(Value::as_str),
            Some("ok")
        );
    }

    #[tokio::test]
    async fn update_run_returns_result_payload_for_valid_request() {
        let payload = update_run(json!({
            "sessionKey": "session:main",
            "note": "run update",
            "restartDelayMs": 0,
            "timeoutMs": 10_000
        }))
        .await
        .expect("valid update.run request should return payload");

        assert_eq!(payload.get("ok").and_then(Value::as_bool), Some(true));
        assert_eq!(
            payload
                .get("result")
                .and_then(Value::as_object)
                .and_then(|result| result.get("status"))
                .and_then(Value::as_str),
            Some("skipped")
        );
        assert_eq!(
            payload
                .get("restart")
                .and_then(Value::as_object)
                .and_then(|restart| restart.get("signal"))
                .and_then(Value::as_str),
            Some("SIGUSR1")
        );
        assert_eq!(
            payload
                .get("restart")
                .and_then(Value::as_object)
                .and_then(|restart| restart.get("mode"))
                .and_then(Value::as_str),
            Some("emit")
        );
        assert_eq!(
            payload
                .get("sentinel")
                .and_then(Value::as_object)
                .and_then(|sentinel| sentinel.get("payload"))
                .and_then(Value::as_object)
                .and_then(|payload| payload.get("kind"))
                .and_then(Value::as_str),
            Some("update")
        );
    }
}
