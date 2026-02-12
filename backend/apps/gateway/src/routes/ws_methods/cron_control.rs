use super::WsMethodError;
use crate::cron_runtime;
use crate::error::ApiError;
use crate::state::AppState;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use std::sync::OnceLock;
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

static TALK_MODE_STATE: OnceLock<RwLock<TalkModeState>> = OnceLock::new();

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

    if let Some(field) = unsupported_patch_field(&params.patch) {
        return Err(unavailable(format!(
            "cron.update patch `{field}` is not implemented in MAP Rust gateway"
        )));
    }

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
        payload = json!({ "message": message });
    }

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

    Ok(json!(updated))
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

    let _session_key = params
        .session_key
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());
    let _note = params
        .note
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    Err(unavailable(
        "`update.run` is recognized but update/restart automation is not implemented in MAP Rust gateway yet",
    ))
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

fn unsupported_patch_field(patch: &CronUpdatePatch) -> Option<&'static str> {
    if patch.description.is_some() {
        return Some("description");
    }
    if patch.delete_after_run.is_some() {
        return Some("deleteAfterRun");
    }
    if patch.wake_mode.is_some() {
        return Some("wakeMode");
    }
    if patch.agent_id.is_some() {
        return Some("agentId");
    }
    if patch.state.is_some() {
        return Some("state");
    }
    None
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

fn unavailable(message: impl Into<String>) -> WsMethodError {
    WsMethodError::Unavailable(message.into())
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
}
