use super::WsMethodError;
use crate::state::AppState;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;
use tokio::sync::RwLock;

const PRESENCE_TTL_MS: i64 = 5 * 60 * 1000;
const PRESENCE_MAX_ENTRIES: usize = 200;

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct AgentIdentityParams {
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
struct LastHeartbeatParams {}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SetHeartbeatsParams {
    enabled: bool,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
struct SystemPresenceParams {}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct SystemEventParams {
    text: Option<String>,
    #[serde(alias = "device_id")]
    device_id: Option<String>,
    #[serde(alias = "instance_id")]
    instance_id: Option<String>,
    host: Option<String>,
    ip: Option<String>,
    mode: Option<String>,
    version: Option<String>,
    platform: Option<String>,
    #[serde(alias = "device_family")]
    device_family: Option<String>,
    #[serde(alias = "model_identifier")]
    model_identifier: Option<String>,
    #[serde(alias = "last_input_seconds")]
    last_input_seconds: Option<f64>,
    reason: Option<String>,
    roles: Option<Vec<String>>,
    scopes: Option<Vec<String>>,
    tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PresenceEntry {
    text: String,
    ts: i64,
    host: Option<String>,
    ip: Option<String>,
    version: Option<String>,
    platform: Option<String>,
    device_family: Option<String>,
    model_identifier: Option<String>,
    last_input_seconds: Option<f64>,
    mode: Option<String>,
    reason: Option<String>,
    device_id: Option<String>,
    roles: Option<Vec<String>>,
    scopes: Option<Vec<String>>,
    tags: Option<Vec<String>>,
    instance_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct HeartbeatEventPayload {
    ts: i64,
    status: String,
    to: Option<String>,
    account_id: Option<String>,
    preview: Option<String>,
    duration_ms: Option<i64>,
    has_media: Option<bool>,
    reason: Option<String>,
    channel: Option<String>,
    silent: Option<bool>,
    indicator_type: Option<String>,
}

#[derive(Debug, Clone)]
pub(crate) struct SystemEventOutcome {
    pub(crate) response: Value,
    pub(crate) presence_event_payload: Value,
}

static HEARTBEATS_ENABLED: AtomicBool = AtomicBool::new(true);
static LAST_HEARTBEAT: OnceLock<RwLock<Option<HeartbeatEventPayload>>> = OnceLock::new();
static SYSTEM_PRESENCE: OnceLock<RwLock<HashMap<String, PresenceEntry>>> = OnceLock::new();

pub(crate) async fn agent_identity_get(
    state: &AppState,
    params: Value,
) -> Result<Value, WsMethodError> {
    let params = serde_json::from_value::<AgentIdentityParams>(params)
        .map_err(|_| invalid_request("invalid agent.identity.get params"))?;

    let requested_agent_id = normalize_agent_id(params.agent_id.as_deref());
    let session_agent_id = params
        .session_key
        .as_deref()
        .and_then(parse_agent_id_from_session_key);

    if let (Some(explicit), Some(from_session)) = (&requested_agent_id, &session_agent_id) {
        if explicit != from_session {
            return Err(invalid_request(format!(
                "invalid agent.identity.get params: agent `{explicit}` does not match session key agent `{from_session}`"
            )));
        }
    }

    let agent_id = session_agent_id
        .or(requested_agent_id)
        .unwrap_or_else(|| state.config.agent_id.clone());

    let avatar = normalize_non_empty(std::env::var("RUST_GATEWAY_AGENT_AVATAR").ok().as_deref());
    let emoji = normalize_non_empty(std::env::var("RUST_GATEWAY_AGENT_EMOJI").ok().as_deref());

    let mut payload = serde_json::Map::new();
    payload.insert("agentId".to_string(), Value::String(agent_id.clone()));
    payload.insert("name".to_string(), Value::String(agent_id));
    if let Some(avatar) = avatar {
        payload.insert("avatar".to_string(), Value::String(avatar));
    }
    if let Some(emoji) = emoji {
        payload.insert("emoji".to_string(), Value::String(emoji));
    }

    Ok(Value::Object(payload))
}

pub(crate) async fn last_heartbeat(params: Value) -> Result<Value, WsMethodError> {
    serde_json::from_value::<LastHeartbeatParams>(params)
        .map_err(|_| invalid_request("invalid last-heartbeat params"))?;

    let guard = last_heartbeat_store().read().await;
    Ok(match guard.as_ref() {
        Some(payload) => json!(payload),
        None => Value::Null,
    })
}

pub(crate) async fn set_heartbeats(params: Value) -> Result<Value, WsMethodError> {
    let params = serde_json::from_value::<SetHeartbeatsParams>(params)
        .map_err(|_| invalid_request("invalid set-heartbeats params: enabled (boolean) required"))?;

    HEARTBEATS_ENABLED.store(params.enabled, Ordering::SeqCst);

    if !params.enabled {
        let mut heartbeat = last_heartbeat_store().write().await;
        *heartbeat = Some(HeartbeatEventPayload {
            ts: now_ms(),
            status: "skipped".to_string(),
            to: None,
            account_id: None,
            preview: None,
            duration_ms: None,
            has_media: None,
            reason: Some("disabled".to_string()),
            channel: None,
            silent: None,
            indicator_type: None,
        });
    }

    Ok(json!({
        "ok": true,
        "enabled": params.enabled,
    }))
}

pub(crate) async fn system_presence(
    state: &AppState,
    params: Value,
) -> Result<Value, WsMethodError> {
    serde_json::from_value::<SystemPresenceParams>(params)
        .map_err(|_| invalid_request("invalid system-presence params"))?;

    let snapshot = list_presence(state).await;
    Ok(json!(snapshot))
}

pub(crate) async fn system_event(
    state: &AppState,
    params: Value,
) -> Result<SystemEventOutcome, WsMethodError> {
    let params = serde_json::from_value::<SystemEventParams>(params)
        .map_err(|_| invalid_request("invalid system-event params"))?;

    let text = params
        .text
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
        .ok_or_else(|| invalid_request("text required"))?;

    let mut store = system_presence_store().write().await;
    seed_gateway_presence_if_missing(state, &mut store);

    let key = resolve_presence_key(&params, &text);
    let existing = store.get(&key).cloned();
    let now = now_ms();

    let mut entry = existing.unwrap_or(PresenceEntry {
        text: text.clone(),
        ts: now,
        host: None,
        ip: None,
        version: None,
        platform: None,
        device_family: None,
        model_identifier: None,
        last_input_seconds: None,
        mode: None,
        reason: None,
        device_id: None,
        roles: None,
        scopes: None,
        tags: None,
        instance_id: None,
    });

    entry.text = text.clone();
    entry.ts = now;
    if let Some(host) = normalize_non_empty(params.host.as_deref()) {
        entry.host = Some(host);
    }
    if let Some(ip) = normalize_non_empty(params.ip.as_deref()) {
        entry.ip = Some(ip);
    }
    if let Some(version) = normalize_non_empty(params.version.as_deref()) {
        entry.version = Some(version);
    }
    if let Some(platform) = normalize_non_empty(params.platform.as_deref()) {
        entry.platform = Some(platform);
    }
    if let Some(device_family) = normalize_non_empty(params.device_family.as_deref()) {
        entry.device_family = Some(device_family);
    }
    if let Some(model_identifier) = normalize_non_empty(params.model_identifier.as_deref()) {
        entry.model_identifier = Some(model_identifier);
    }
    if let Some(mode) = normalize_non_empty(params.mode.as_deref()) {
        entry.mode = Some(mode);
    }
    if let Some(reason) = normalize_non_empty(params.reason.as_deref()) {
        entry.reason = Some(reason);
    }
    if let Some(device_id) = normalize_non_empty(params.device_id.as_deref()) {
        entry.device_id = Some(device_id);
    }
    if let Some(instance_id) = normalize_non_empty(params.instance_id.as_deref()) {
        entry.instance_id = Some(instance_id);
    }
    if let Some(last_input_seconds) = params.last_input_seconds {
        if last_input_seconds.is_finite() && last_input_seconds >= 0.0 {
            entry.last_input_seconds = Some(last_input_seconds);
        }
    }
    entry.roles = merge_string_lists(entry.roles.as_ref(), params.roles.as_ref());
    entry.scopes = merge_string_lists(entry.scopes.as_ref(), params.scopes.as_ref());
    entry.tags = merge_string_lists(entry.tags.as_ref(), params.tags.as_ref());

    store.insert(key, entry);
    prune_presence_locked(&mut store);

    let snapshot = sorted_presence_snapshot_locked(&store);
    drop(store);

    maybe_record_heartbeat(&text, &params).await;

    Ok(SystemEventOutcome {
        response: json!({ "ok": true }),
        presence_event_payload: json!({ "presence": snapshot }),
    })
}

async fn maybe_record_heartbeat(text: &str, params: &SystemEventParams) {
    if !HEARTBEATS_ENABLED.load(Ordering::SeqCst) {
        return;
    }

    let reason = normalize_non_empty(params.reason.as_deref());
    let mode = normalize_non_empty(params.mode.as_deref());
    let looks_like_heartbeat = reason
        .as_deref()
        .map(|value| {
            let lower = value.to_lowercase();
            lower.contains("heartbeat") || lower.contains("periodic")
        })
        .unwrap_or(false)
        || mode
            .as_deref()
            .map(|value| value.to_lowercase().contains("heartbeat"))
            .unwrap_or(false)
        || text.to_lowercase().contains("heartbeat");

    if !looks_like_heartbeat {
        return;
    }

    let mut heartbeat = last_heartbeat_store().write().await;
    *heartbeat = Some(HeartbeatEventPayload {
        ts: now_ms(),
        status: "sent".to_string(),
        to: None,
        account_id: None,
        preview: Some(truncate_text(text, 180)),
        duration_ms: None,
        has_media: None,
        reason,
        channel: None,
        silent: None,
        indicator_type: Some("alert".to_string()),
    });
}

async fn list_presence(state: &AppState) -> Vec<PresenceEntry> {
    let mut store = system_presence_store().write().await;
    seed_gateway_presence_if_missing(state, &mut store);
    touch_gateway_presence(&mut store);
    prune_presence_locked(&mut store);
    sorted_presence_snapshot_locked(&store)
}

fn resolve_presence_key(params: &SystemEventParams, text: &str) -> String {
    normalize_non_empty(params.device_id.as_deref())
        .or_else(|| normalize_non_empty(params.instance_id.as_deref()))
        .or_else(|| normalize_non_empty(params.host.as_deref()))
        .or_else(|| normalize_non_empty(params.ip.as_deref()))
        .map(|value| value.to_lowercase())
        .unwrap_or_else(|| text.chars().take(64).collect::<String>().to_lowercase())
}

fn sorted_presence_snapshot_locked(store: &HashMap<String, PresenceEntry>) -> Vec<PresenceEntry> {
    let mut values = store.values().cloned().collect::<Vec<_>>();
    values.sort_by(|a, b| b.ts.cmp(&a.ts));
    values
}

fn prune_presence_locked(store: &mut HashMap<String, PresenceEntry>) {
    let now = now_ms();
    let gateway_key = resolve_gateway_presence_key();
    store.retain(|key, value| key == &gateway_key || now.saturating_sub(value.ts) <= PRESENCE_TTL_MS);

    if store.len() <= PRESENCE_MAX_ENTRIES {
        return;
    }

    let mut values = store
        .iter()
        .map(|(key, value)| (key.clone(), value.ts))
        .collect::<Vec<_>>();
    values.sort_by(|a, b| b.1.cmp(&a.1));

    let keep = values
        .into_iter()
        .take(PRESENCE_MAX_ENTRIES)
        .map(|(key, _)| key)
        .collect::<HashSet<_>>();

    store.retain(|key, _| keep.contains(key));
}

fn seed_gateway_presence_if_missing(state: &AppState, store: &mut HashMap<String, PresenceEntry>) {
    let key = resolve_gateway_presence_key();
    if store.contains_key(&key) {
        return;
    }

    let host = resolve_host_label();
    let text = format!(
        "Gateway: {} · app {} · mode gateway · reason self",
        host, state.config.openclaw_ref_commit
    );

    store.insert(
        key,
        PresenceEntry {
            text,
            ts: now_ms(),
            host: Some(host),
            ip: None,
            version: Some(state.config.openclaw_ref_commit.clone()),
            platform: Some(std::env::consts::OS.to_string()),
            device_family: Some("Gateway".to_string()),
            model_identifier: None,
            last_input_seconds: None,
            mode: Some("gateway".to_string()),
            reason: Some("self".to_string()),
            device_id: None,
            roles: None,
            scopes: None,
            tags: None,
            instance_id: None,
        },
    );
}

fn touch_gateway_presence(store: &mut HashMap<String, PresenceEntry>) {
    let key = resolve_gateway_presence_key();
    if let Some(entry) = store.get_mut(&key) {
        entry.ts = now_ms();
    }
}

fn parse_agent_id_from_session_key(session_key: &str) -> Option<String> {
    let mut parts = session_key.split(':');
    let prefix = parts.next()?;
    if prefix != "agent" {
        return None;
    }
    normalize_agent_id(parts.next())
}

fn normalize_agent_id(value: Option<&str>) -> Option<String> {
    let cleaned = value
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .map(|entry| entry.to_lowercase())?;
    Some(cleaned)
}

fn merge_string_lists(
    existing: Option<&Vec<String>>,
    incoming: Option<&Vec<String>>,
) -> Option<Vec<String>> {
    let mut merged = Vec::new();
    if let Some(items) = existing {
        for item in items {
            if let Some(item) = normalize_non_empty(Some(item.as_str())) {
                merged.push(item);
            }
        }
    }
    if let Some(items) = incoming {
        for item in items {
            if let Some(item) = normalize_non_empty(Some(item.as_str())) {
                merged.push(item);
            }
        }
    }

    if merged.is_empty() {
        return None;
    }

    let mut seen = HashSet::new();
    let deduped = merged
        .into_iter()
        .filter(|item| seen.insert(item.to_lowercase()))
        .collect::<Vec<_>>();
    Some(deduped)
}

fn truncate_text(value: &str, limit: usize) -> String {
    if value.len() <= limit {
        return value.to_string();
    }
    value.chars().take(limit).collect::<String>()
}

fn normalize_non_empty(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .map(ToString::to_string)
}

fn resolve_gateway_presence_key() -> String {
    resolve_host_label().to_lowercase()
}

fn resolve_host_label() -> String {
    normalize_non_empty(std::env::var("HOSTNAME").ok().as_deref())
        .or_else(|| normalize_non_empty(std::env::var("COMPUTERNAME").ok().as_deref()))
        .unwrap_or_else(|| "gateway".to_string())
}

fn last_heartbeat_store() -> &'static RwLock<Option<HeartbeatEventPayload>> {
    LAST_HEARTBEAT.get_or_init(|| RwLock::new(None))
}

fn system_presence_store() -> &'static RwLock<HashMap<String, PresenceEntry>> {
    SYSTEM_PRESENCE.get_or_init(|| RwLock::new(HashMap::new()))
}

fn now_ms() -> i64 {
    Utc::now().timestamp_millis()
}

fn invalid_request(message: impl Into<String>) -> WsMethodError {
    WsMethodError::InvalidRequest(message.into())
}
