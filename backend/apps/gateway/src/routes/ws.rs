use crate::auth::{self, GatewayAuthContext};
use crate::cron_runtime::{CronCreateRequest, CronJobPayload};
use crate::error::ApiError;
use crate::model_runtime;
use crate::routes;
use crate::routes::sessions::{SessionMessageRow, SessionRow, SessionRunRow};
use crate::safety::confirmation_required;
use crate::state::AppState;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Extension, Path, Query, State};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::FromRow;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, OnceLock};
use tokio::sync::{oneshot, Mutex, RwLock};
use uuid::Uuid;

pub async fn gateway_ws(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Extension(auth_context): Extension<GatewayAuthContext>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_gateway_socket(socket, state, auth_context))
}

#[derive(Debug, Deserialize)]
struct WsRequest {
    #[serde(rename = "type")]
    kind: String,
    id: String,
    method: String,
    #[serde(default)]
    params: Value,
}

#[derive(Debug, Default, Deserialize)]
struct ConnectParams {
    auth: Option<ConnectAuth>,
    client: Option<ConnectClient>,
    resume: Option<ResumeParams>,
}

#[derive(Debug, Default, Deserialize)]
struct ConnectAuth {
    token: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
struct ConnectClient {
    role: Option<String>,
    name: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResumeParams {
    #[serde(alias = "after_cursor")]
    after_cursor: Option<i64>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionsCreateParams {
    title: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionsPatchParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    id: Option<Uuid>,
    title: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionsResetParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    id: Option<Uuid>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionsResolveParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatSendParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    prompt: Option<String>,
    message: Option<String>,
    model: Option<String>,
    #[serde(alias = "fallback_models")]
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    #[serde(alias = "idempotency_key")]
    idempotency_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatHistoryParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    key: Option<String>,
    #[serde(alias = "message_limit")]
    message_limit: Option<i64>,
    #[serde(alias = "run_limit")]
    run_limit: Option<i64>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatInjectParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    key: Option<String>,
    text: Option<String>,
    message: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatAbortParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    key: Option<String>,
    #[serde(alias = "run_id")]
    run_id: Option<Uuid>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct EventsResumeParams {
    #[serde(alias = "after_cursor")]
    after_cursor: Option<i64>,
    limit: Option<i64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModelsProfileUpsertParams {
    provider: String,
    #[serde(alias = "profile_id")]
    profile_id: Option<String>,
    #[serde(alias = "profile_type")]
    profile_type: Option<String>,
    payload: Option<Value>,
    #[serde(alias = "api_key")]
    api_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UuidIdParams {
    id: Option<Uuid>,
    #[serde(alias = "request_id")]
    request_id: Option<Uuid>,
    #[serde(alias = "job_id")]
    job_id: Option<Uuid>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ModelsGenerateParams {
    prompt: String,
    model: Option<String>,
    #[serde(alias = "fallback_models")]
    fallback_models: Option<Vec<String>>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CronCreateParams {
    name: Option<String>,
    #[serde(alias = "schedule_kind")]
    schedule_kind: Option<String>,
    #[serde(alias = "schedule_expr")]
    schedule_expr: Option<String>,
    timezone: Option<String>,
    payload: Option<Value>,
    #[serde(alias = "session_target")]
    session_target: Option<String>,
    #[serde(alias = "delivery_mode")]
    delivery_mode: Option<String>,
    schedule: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PairingListParams {
    provider: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PairingDecisionParams {
    id: Option<Uuid>,
    provider: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelAccountUpsertParams {
    provider: String,
    #[serde(alias = "account_key")]
    account_key: String,
    metadata: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelRouteUpsertParams {
    provider: String,
    #[serde(alias = "account_id")]
    account_id: Option<Uuid>,
    #[serde(alias = "peer_key")]
    peer_key: String,
    #[serde(alias = "session_scope")]
    session_scope: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelsResolveSessionParams {
    provider: String,
    #[serde(alias = "peer_kind")]
    peer_kind: String,
    #[serde(alias = "peer_id")]
    peer_id: String,
    #[serde(alias = "account_key")]
    account_key: Option<String>,
    #[serde(alias = "thread_id")]
    thread_id: Option<String>,
    #[serde(alias = "dm_scope")]
    dm_scope: Option<String>,
    #[serde(alias = "identity_key")]
    identity_key: Option<String>,
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    #[serde(alias = "main_key")]
    main_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelsInboundParams {
    provider: String,
    #[serde(alias = "peer_kind")]
    peer_kind: String,
    #[serde(alias = "peer_id")]
    peer_id: String,
    text: String,
    #[serde(alias = "account_key")]
    account_key: Option<String>,
    #[serde(alias = "thread_id")]
    thread_id: Option<String>,
    #[serde(alias = "dm_scope")]
    dm_scope: Option<String>,
    #[serde(alias = "dm_policy")]
    dm_policy: Option<String>,
    #[serde(alias = "identity_key")]
    identity_key: Option<String>,
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    #[serde(alias = "main_key")]
    main_key: Option<String>,
    model: Option<String>,
    #[serde(alias = "fallback_models")]
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    metadata: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodePairRequestParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "node_key")]
    node_key: Option<String>,
    #[serde(alias = "display_name")]
    display_name: Option<String>,
    caps: Option<Vec<String>>,
    commands: Option<Vec<String>>,
    capabilities: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeVerifyParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "node_key")]
    node_key: Option<String>,
    token: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentParams {
    #[serde(alias = "session_id")]
    session_id: Option<Uuid>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    message: Option<String>,
    prompt: Option<String>,
    model: Option<String>,
    #[serde(alias = "fallback_models")]
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    #[serde(alias = "idempotency_key")]
    idempotency_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentWaitParams {
    #[serde(alias = "run_id")]
    run_id: String,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<u64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SendParams {
    to: Option<String>,
    message: Option<String>,
    #[serde(alias = "idempotency_key")]
    idempotency_key: Option<String>,
    channel: Option<String>,
    #[serde(alias = "account_id")]
    account_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PollParams {
    to: Option<String>,
    question: Option<String>,
    options: Option<Vec<String>>,
    #[serde(alias = "idempotency_key")]
    idempotency_key: Option<String>,
    channel: Option<String>,
    #[serde(alias = "account_id")]
    account_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WakeParams {
    mode: Option<String>,
    text: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentsListParams {
    #[allow(dead_code)]
    include_files: Option<bool>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentsMutateParams {
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    id: Option<String>,
    name: Option<String>,
    workspace: Option<String>,
    model: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AgentsFilesParams {
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    id: Option<String>,
    name: Option<String>,
    content: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigSetParams {
    raw: Option<String>,
    #[serde(alias = "base_hash")]
    base_hash: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConfigSchemaParams {}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WizardStartParams {
    mode: Option<String>,
    workspace: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WizardNextParams {
    #[serde(alias = "session_id")]
    session_id: String,
    answer: Option<Value>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct WizardSessionParams {
    #[serde(alias = "session_id")]
    session_id: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LogsTailParams {
    cursor: Option<u64>,
    limit: Option<usize>,
    #[serde(alias = "max_bytes")]
    max_bytes: Option<usize>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecApprovalsSetParams {
    file: Option<Value>,
    #[serde(alias = "base_hash")]
    base_hash: Option<String>,
    #[serde(alias = "node_id")]
    node_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecApprovalRequestParams {
    id: Option<String>,
    command: Option<String>,
    cwd: Option<String>,
    host: Option<String>,
    security: Option<String>,
    ask: Option<String>,
    #[serde(alias = "agent_id")]
    agent_id: Option<String>,
    #[serde(alias = "resolved_path")]
    resolved_path: Option<String>,
    #[serde(alias = "session_key")]
    session_key: Option<String>,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<u64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExecApprovalResolveParams {
    id: String,
    decision: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeDescribeParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "node_key")]
    node_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeInvokeParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "node_key")]
    node_key: Option<String>,
    command: Option<String>,
    params: Option<Value>,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<u64>,
    #[serde(alias = "idempotency_key")]
    idempotency_key: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct NodeEventParams {
    #[serde(alias = "node_id")]
    node_id: Option<String>,
    #[serde(alias = "node_key")]
    node_key: Option<String>,
    event: Option<String>,
    payload: Option<Value>,
    #[serde(alias = "payload_json")]
    payload_json: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChannelsLogoutParams {
    channel: Option<String>,
    provider: Option<String>,
    #[serde(alias = "account_id")]
    account_id: Option<String>,
    #[serde(alias = "account_key")]
    account_key: Option<String>,
}

#[derive(Debug, Clone)]
struct WizardSessionState {
    mode: String,
    workspace: Option<String>,
    step: u8,
    status: String,
    error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct AgentRecord {
    id: String,
    name: String,
    workspace: Option<String>,
    model: Option<String>,
    is_default: bool,
    created_at_ms: i64,
    updated_at_ms: i64,
}

#[derive(Debug)]
struct PendingExecApproval {
    request: Value,
    created_at_ms: i64,
    expires_at_ms: i64,
    resolver: oneshot::Sender<String>,
}

static AGENT_REGISTRY: OnceLock<RwLock<HashMap<String, AgentRecord>>> = OnceLock::new();
static EXEC_APPROVALS_GATEWAY: OnceLock<RwLock<Value>> = OnceLock::new();
static EXEC_APPROVALS_NODES: OnceLock<RwLock<HashMap<String, Value>>> = OnceLock::new();
static EXEC_APPROVAL_PENDING: OnceLock<Mutex<HashMap<String, PendingExecApproval>>> =
    OnceLock::new();

fn now_ms() -> i64 {
    Utc::now().timestamp_millis()
}

fn default_exec_approvals_file() -> Value {
    json!({
        "version": 1,
        "socket": {
            "path": "~/.map/exec-approvals.sock"
        },
        "defaults": {
            "security": "allowlist",
            "ask": "on-miss",
            "askFallback": "on-miss",
            "autoAllowSkills": true
        },
        "agents": {}
    })
}

fn hash_value(value: &Value) -> String {
    let encoded = serde_json::to_vec(value).unwrap_or_default();
    let mut hasher = Sha256::new();
    hasher.update(encoded);
    hex::encode(hasher.finalize())
}

fn agents_registry() -> &'static RwLock<HashMap<String, AgentRecord>> {
    AGENT_REGISTRY.get_or_init(|| RwLock::new(HashMap::new()))
}

async fn ensure_default_agent(state: &AppState) {
    let registry = agents_registry();
    let mut guard = registry.write().await;
    if guard.is_empty() {
        let ts = now_ms();
        guard.insert(
            state.config.agent_id.clone(),
            AgentRecord {
                id: state.config.agent_id.clone(),
                name: state.config.agent_id.clone(),
                workspace: None,
                model: Some(state.config.primary_model.clone()),
                is_default: true,
                created_at_ms: ts,
                updated_at_ms: ts,
            },
        );
    }
}

fn exec_approvals_gateway_store() -> &'static RwLock<Value> {
    EXEC_APPROVALS_GATEWAY.get_or_init(|| RwLock::new(default_exec_approvals_file()))
}

fn exec_approvals_nodes_store() -> &'static RwLock<HashMap<String, Value>> {
    EXEC_APPROVALS_NODES.get_or_init(|| RwLock::new(HashMap::new()))
}

fn pending_exec_approvals() -> &'static Mutex<HashMap<String, PendingExecApproval>> {
    EXEC_APPROVAL_PENDING.get_or_init(|| Mutex::new(HashMap::new()))
}

fn normalize_agent_id(raw: Option<String>, fallback: &str) -> String {
    raw.unwrap_or_else(|| fallback.to_string())
        .trim()
        .to_lowercase()
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.' {
                ch
            } else if ch.is_whitespace() {
                '-'
            } else {
                '\0'
            }
        })
        .filter(|ch| *ch != '\0')
        .collect::<String>()
}

fn normalize_channel(raw: Option<String>, fallback: &str) -> String {
    raw.unwrap_or_else(|| fallback.to_string())
        .trim()
        .to_lowercase()
}

fn allowed_agent_file_name(name: &str) -> bool {
    matches!(
        name,
        "AGENTS.md"
            | "SOUL.md"
            | "TOOLS.md"
            | "IDENTITY.md"
            | "USER.md"
            | "HEARTBEAT.md"
            | "BOOTSTRAP.md"
            | "memory.md"
            | "MEMORY.md"
    )
}

fn config_snapshot_value(state: &AppState) -> Value {
    let providers = state
        .config
        .providers
        .values()
        .map(|provider| {
            json!({
                "provider": provider.provider,
                "baseUrl": provider.base_url,
                "envKeyConfigured": provider.env_api_key.is_some()
            })
        })
        .collect::<Vec<_>>();
    json!({
        "gateway": {
            "host": state.config.host,
            "port": state.config.port,
            "authEnabled": !state.config.auth_tokens.is_empty(),
            "openclawRefCommit": state.config.openclaw_ref_commit,
        },
        "agents": {
            "defaultId": state.config.agent_id,
            "mainKey": state.config.main_key,
            "dmScope": state.config.dm_scope,
        },
        "models": {
            "primary": state.config.primary_model,
            "fallbacks": state.config.fallback_models,
            "providers": providers,
        },
        "skills": {
            "workspaceDir": state.config.skills_workspace_dir,
            "managedDir": state.config.skills_managed_dir,
            "bundledDir": state.config.skills_bundled_dir,
        },
        "cron": {
            "pollIntervalSecs": state.config.cron_poll_interval_secs,
        }
    })
}

fn collect_string_array(value: Option<&Value>) -> Vec<String> {
    value
        .and_then(Value::as_array)
        .map(|entries| {
            entries
                .iter()
                .filter_map(Value::as_str)
                .map(ToString::to_string)
                .collect::<Vec<_>>()
        })
        .unwrap_or_default()
}

#[derive(Debug, Serialize)]
struct SessionsResolveResult {
    session: SessionRow,
    session_key: Option<String>,
}

#[derive(Debug)]
struct ChatRunResult {
    run_id: Uuid,
    session_id: Uuid,
    status: String,
    model_used: String,
    output: String,
    requires_confirmation: bool,
}

type SharedSocketWriter = Arc<Mutex<futures::stream::SplitSink<WebSocket, Message>>>;

#[derive(Debug, Clone)]
struct ChatRunTask {
    run_id: Uuid,
    session_id: Uuid,
    session_key: String,
    auth_subject: String,
    prompt: String,
    model: Option<String>,
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    idempotency_key: Option<String>,
}

#[derive(Debug, FromRow)]
struct StoredWsEvent {
    id: i64,
    event: String,
    payload: Value,
}

#[derive(Debug, FromRow)]
struct IdempotencyRecordRow {
    request_hash: String,
    run_id: Option<Uuid>,
    response_payload: Option<Value>,
}

async fn handle_gateway_socket(
    socket: WebSocket,
    state: AppState,
    preauthenticated_auth: GatewayAuthContext,
) {
    state.metrics.inc_ws_connection_open();

    let (sink, mut stream) = socket.split();
    let socket = Arc::new(Mutex::new(sink));
    let mut connected = false;
    let mut socket_auth = preauthenticated_auth.clone();
    let mut wizard_sessions: HashMap<String, WizardSessionState> = HashMap::new();

    while let Some(frame) = stream.next().await {
        let message = match frame {
            Ok(Message::Text(text)) => text.to_string(),
            Ok(Message::Close(_)) => break,
            Ok(_) => continue,
            Err(error) => {
                state.metrics.inc_ws_error();
                tracing::warn!(target: "gateway.ws", error = %error, "ws frame read error");
                break;
            }
        };

        let request = match serde_json::from_str::<WsRequest>(&message) {
            Ok(request) => request,
            Err(_) => {
                state.metrics.inc_ws_error();
                if send_error(
                    &socket,
                    "unknown",
                    "bad_request",
                    "invalid request envelope",
                )
                .await
                .is_err()
                {
                    break;
                }
                continue;
            }
        };

        if request.kind != "req" {
            state.metrics.inc_ws_error();
            if send_error(
                &socket,
                &request.id,
                "bad_request",
                "request type must be `req`",
            )
            .await
            .is_err()
            {
                break;
            }
            continue;
        }

        if !connected {
            if request.method != "connect" {
                let _ = send_error(
                    &socket,
                    &request.id,
                    "protocol_error",
                    "first request must be `connect`",
                )
                .await;
                let _ = close_socket(&socket).await;
                break;
            }

            let params = match serde_json::from_value::<ConnectParams>(request.params) {
                Ok(params) => params,
                Err(_) => {
                    state.metrics.inc_ws_error();
                    let _ = send_error(
                        &socket,
                        &request.id,
                        "bad_request",
                        "invalid connect params",
                    )
                    .await;
                    let _ = close_socket(&socket).await;
                    break;
                }
            };

            let connect_token = params
                .auth
                .as_ref()
                .and_then(|auth| auth.token.as_ref())
                .map(|token| token.trim())
                .filter(|token| !token.is_empty());

            socket_auth = match auth::authenticate_socket_connect(
                &state,
                &preauthenticated_auth,
                connect_token,
            ) {
                Ok(auth) => auth,
                Err(_) => {
                    state.metrics.inc_ws_error();
                    let _ = send_error(&socket, &request.id, "unauthorized", "invalid token").await;
                    let _ = close_socket(&socket).await;
                    break;
                }
            };

            if !socket_auth.has_scope("gateway.ws") {
                state.metrics.inc_ws_error();
                let _ = send_error(
                    &socket,
                    &request.id,
                    "forbidden",
                    "missing required scope `gateway.ws`",
                )
                .await;
                let _ = close_socket(&socket).await;
                break;
            }

            let connect_limit = state.rate_limiter.check(
                &format!("ws-connect:{}", socket_auth.subject),
                state.config.ws_rate_limit_per_minute,
            );
            if !connect_limit.allowed {
                state.metrics.inc_rate_limited();
                let _ = send_error(
                    &socket,
                    &request.id,
                    "rate_limited",
                    &format!(
                        "rate limited; retry after {}s",
                        connect_limit.retry_after_secs
                    ),
                )
                .await;
                let _ = close_socket(&socket).await;
                break;
            }

            let latest_cursor = latest_event_cursor(&state, &socket_auth.subject)
                .await
                .unwrap_or(0);
            connected = true;
            let payload = json!({
                "status": "ok",
                "protocol": "map-gateway-ws.v1",
                "openclawRefCommit": state.config.openclaw_ref_commit,
                "auth": {
                    "subject": socket_auth.subject,
                    "scopes": socket_auth.scopes(),
                },
                "resume": {
                    "supported": true,
                    "cursor": latest_cursor,
                    "maxEvents": state.config.ws_resume_max_events,
                },
                "client": {
                    "role": params.client.as_ref().and_then(|client| client.role.clone()).unwrap_or_else(|| "operator".to_string()),
                    "name": params.client.as_ref().and_then(|client| client.name.clone())
                }
            });
            if send_ok(&socket, &request.id, payload).await.is_err() {
                break;
            }

            if let Some(resume) = params.resume {
                let after_cursor = resume.after_cursor.unwrap_or(0).max(0);
                let limit = resume
                    .limit
                    .unwrap_or(state.config.ws_resume_max_events)
                    .clamp(1, state.config.ws_resume_max_events);
                if replay_ws_events(&state, &socket, &socket_auth.subject, after_cursor, limit)
                    .await
                    .is_err()
                {
                    break;
                }
            }

            continue;
        }

        let result = dispatch_request(
            &state,
            &socket_auth,
            &request,
            &socket,
            &mut wizard_sessions,
        )
        .await;

        if result.is_err() {
            break;
        }
    }

    state.metrics.inc_ws_connection_close();
}

fn canonical_ws_method(method: &str) -> Option<&'static str> {
    Some(match method {
        "health" => "health",
        "status" => "status",
        "logs/tail" => "logs.tail",
        "logs.tail" => "logs.tail",
        "config/get" => "config.get",
        "config.get" => "config.get",
        "config/schema" => "config.schema",
        "config.schema" => "config.schema",
        "config/set" | "config/apply" | "config/patch" => "config.set",
        "config.set" | "config.apply" | "config.patch" => "config.set",
        "update.run" | "update/run" => "update.run",
        "wizard/start" => "wizard.start",
        "wizard.start" => "wizard.start",
        "wizard/next" => "wizard.next",
        "wizard.next" => "wizard.next",
        "wizard/cancel" => "wizard.cancel",
        "wizard.cancel" => "wizard.cancel",
        "wizard/status" => "wizard.status",
        "wizard.status" => "wizard.status",
        "agents/list" => "agents.list",
        "agents.list" => "agents.list",
        "agents/create" => "agents.create",
        "agents.create" => "agents.create",
        "agents/update" => "agents.update",
        "agents.update" => "agents.update",
        "agents/delete" => "agents.delete",
        "agents.delete" => "agents.delete",
        "agents/files/list" => "agents.files.list",
        "agents.files.list" => "agents.files.list",
        "agents/files/get" => "agents.files.get",
        "agents.files.get" => "agents.files.get",
        "agents/files/set" => "agents.files.set",
        "agents.files.set" => "agents.files.set",
        "agent" => "agent",
        "agent/wait" => "agent.wait",
        "agent.wait" => "agent.wait",
        "agent.send" | "agent/send" => "send",
        "agent.poll" | "agent/poll" => "poll",
        "agent.wake" | "agent/wake" => "wake",
        "send" => "send",
        "poll" => "poll",
        "wake" => "wake",
        "talk.mode" | "talk/mode" => "talk.mode",
        "sessions.list" => "sessions.list",
        "sessions.create" => "sessions.create",
        "sessions.patch" => "sessions.patch",
        "sessions.reset" => "sessions.reset",
        "sessions.resolve" => "sessions.resolve",
        "chat.history" => "chat.history",
        "chat.send" => "chat.send",
        "chat.inject" => "chat.inject",
        "chat.abort" => "chat.abort",
        "events.resume" => "events.resume",
        "models.list" | "models.get" | "models" => "models.list",
        "models.profiles.list" => "models.profiles.list",
        "models.profiles.upsert" => "models.profiles.upsert",
        "models.profiles.delete" => "models.profiles.delete",
        "models.generate" => "models.generate",
        "skills.list" | "skills.status" => "skills.list",
        "skills.rescan" => "skills.rescan",
        "security.audit" => "security.audit",
        "cron.jobs.list" | "cron.list" => "cron.jobs.list",
        "cron.runs.list" | "cron.runs" => "cron.runs.list",
        "cron.jobs.create" | "cron.add" => "cron.jobs.create",
        "cron.jobs.run" | "cron.run" => "cron.jobs.run",
        "cron.jobs.delete" | "cron.remove" => "cron.jobs.delete",
        "cron.status" | "cron/status" => "cron.status",
        "cron.update" | "cron/update" => "cron.update",
        "channels.summary" => "channels.summary",
        "channels.status" => "channels.status",
        "channels/logout" => "channels.logout",
        "channels.logout" => "channels.logout",
        "channels.accounts.list" => "channels.accounts.list",
        "channels.accounts.upsert" => "channels.accounts.upsert",
        "channels.accounts.delete" => "channels.accounts.delete",
        "channels.routes.list" => "channels.routes.list",
        "channels.routes.upsert" => "channels.routes.upsert",
        "channels.routes.delete" => "channels.routes.delete",
        "channels.resolveSession" | "channels.resolve-session" | "channels.resolve_session" => {
            "channels.resolveSession"
        }
        "channels.inbound" => "channels.inbound",
        "channels.pairing.list" => "channels.pairing.list",
        "channels.pairing.approve" => "channels.pairing.approve",
        "channels.pairing.reject" => "channels.pairing.reject",
        "exec/approvals/get" => "exec.approvals.get",
        "exec.approvals.get" => "exec.approvals.get",
        "exec/approvals/set" => "exec.approvals.set",
        "exec.approvals.set" => "exec.approvals.set",
        "exec/approvals/node/get" => "exec.approvals.node.get",
        "exec.approvals.node.get" => "exec.approvals.node.get",
        "exec/approvals/node/set" => "exec.approvals.node.set",
        "exec.approvals.node.set" => "exec.approvals.node.set",
        "exec/approval/request" => "exec.approval.request",
        "exec.approval.request" => "exec.approval.request",
        "exec/approval/resolve" => "exec.approval.resolve",
        "exec.approval.resolve" => "exec.approval.resolve",
        "nodes.list" | "node.list" => "nodes.list",
        "node/describe" | "nodes/describe" => "node.describe",
        "node.describe" | "nodes.describe" => "node.describe",
        "node/invoke" | "nodes/invoke" => "node.invoke",
        "node.invoke" | "nodes.invoke" => "node.invoke",
        "node/event" | "nodes/event" => "node.event",
        "node.event" | "nodes.event" => "node.event",
        "nodes.pair.request" | "node.pair.request" => "nodes.pair.request",
        "nodes.pair.approve" | "node.pair.approve" => "nodes.pair.approve",
        "nodes.pair.reject" | "node.pair.reject" => "nodes.pair.reject",
        "nodes.verify" | "node.pair.verify" => "nodes.verify",
        _ => return routes::ws_methods::canonical_ws_method(method),
    })
}

async fn dispatch_request(
    state: &AppState,
    auth: &GatewayAuthContext,
    request: &WsRequest,
    socket: &SharedSocketWriter,
    wizard_sessions: &mut HashMap<String, WizardSessionState>,
) -> Result<(), ()> {
    let Some(method) = canonical_ws_method(request.method.as_str()) else {
        return send_error(socket, &request.id, "method_not_found", "unknown method").await;
    };

    let required_scope = auth::required_ws_scope(method);
    if !auth.has_scope(required_scope) {
        state.metrics.inc_ws_error();
        return send_error(
            socket,
            &request.id,
            "forbidden",
            &format!("missing required scope `{required_scope}`"),
        )
        .await;
    }

    let rate_decision = state.rate_limiter.check(
        &format!("ws:{}:{method}", auth.subject),
        state.config.ws_rate_limit_per_minute,
    );
    if !rate_decision.allowed {
        state.metrics.inc_rate_limited();
        return send_error(
            socket,
            &request.id,
            "rate_limited",
            &format!(
                "rate limited; retry after {}s",
                rate_decision.retry_after_secs
            ),
        )
        .await;
    }

    state.metrics.inc_ws_request(method);
    tracing::debug!(
        target: "gateway.ws",
        method = method,
        request_id = request.id,
        auth_subject = auth.subject,
        "dispatching websocket request"
    );

    match method {
        "health" => {
            let payload = json!({
                "status": "ok",
                "openclawRefCommit": state.config.openclaw_ref_commit,
                "timestamp": Utc::now().to_rfc3339(),
            });
            send_ok(socket, &request.id, payload).await
        }

        "status" => {
            let payload = json!({
                "status": "ok",
                "openclawRefCommit": state.config.openclaw_ref_commit,
                "timestamp": Utc::now().to_rfc3339(),
            });
            send_ok(socket, &request.id, payload).await
        }

        "logs.tail" => {
            let params = serde_json::from_value::<LogsTailParams>(request.params.clone())
                .unwrap_or_default();
            let file = std::env::var("RUST_GATEWAY_LOG_FILE")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .map(PathBuf::from)
                .unwrap_or_else(|| PathBuf::from("./logs/map-gateway.log"));

            let cursor = params.cursor.unwrap_or(0);
            let limit = params.limit.unwrap_or(500).clamp(1, 5_000);
            let max_bytes = params.max_bytes.unwrap_or(250_000).clamp(1, 1_000_000);

            let bytes = tokio::fs::read(&file).await.unwrap_or_default();
            let size = bytes.len() as u64;

            let (start, reset) = if cursor > size {
                (size.saturating_sub(max_bytes as u64), true)
            } else {
                (cursor, false)
            };
            let mut truncated = false;
            let adjusted_start = if size.saturating_sub(start) > max_bytes as u64 {
                truncated = true;
                size.saturating_sub(max_bytes as u64)
            } else {
                start
            };
            if adjusted_start > 0 {
                truncated = true;
            }

            let text = if adjusted_start < size {
                String::from_utf8_lossy(&bytes[adjusted_start as usize..]).to_string()
            } else {
                String::new()
            };
            let mut lines = text.lines().map(ToString::to_string).collect::<Vec<_>>();
            if lines.len() > limit {
                lines = lines.split_off(lines.len() - limit);
            }

            send_ok(
                socket,
                &request.id,
                json!({
                    "file": file.to_string_lossy(),
                    "cursor": size,
                    "size": size,
                    "lines": lines,
                    "truncated": truncated,
                    "reset": reset,
                }),
            )
            .await
        }

        "config.get" => {
            let _ = serde_json::from_value::<ConfigSchemaParams>(request.params.clone())
                .unwrap_or_default();
            let config = config_snapshot_value(state);
            let raw = serde_json::to_string_pretty(&config).unwrap_or_else(|_| "{}".to_string());
            send_ok(
                socket,
                &request.id,
                json!({
                    "path": null,
                    "exists": true,
                    "raw": raw,
                    "hash": hash_value(&config),
                    "parsed": config,
                    "valid": true,
                    "config": config,
                    "issues": []
                }),
            )
            .await
        }

        "config.schema" => {
            let _ = serde_json::from_value::<ConfigSchemaParams>(request.params.clone())
                .unwrap_or_default();
            send_ok(
                socket,
                &request.id,
                json!({
                    "schema": {
                        "type": "object",
                        "title": "Map Gateway Runtime Config",
                        "properties": {
                            "gateway": {"type": "object"},
                            "agents": {"type": "object"},
                            "models": {"type": "object"},
                            "skills": {"type": "object"},
                            "cron": {"type": "object"}
                        }
                    },
                    "uiHints": {},
                    "version": "map-gateway-rs.v1",
                    "generatedAt": Utc::now().to_rfc3339(),
                }),
            )
            .await
        }

        "config.set" | "config.apply" | "config.patch" => {
            let params = serde_json::from_value::<ConfigSetParams>(request.params.clone())
                .unwrap_or_default();
            let _ = params.raw;
            let _ = params.base_hash;
            let config = config_snapshot_value(state);
            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "path": null,
                    "hash": hash_value(&config),
                    "config": config,
                    "applied": false,
                    "warning": "Runtime config is read-only in MAP Rust gateway.",
                }),
            )
            .await
        }

        "update.run" => {
            match routes::ws_methods::cron_control::update_run(request.params.clone()).await {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "wizard.start" => {
            let params = serde_json::from_value::<WizardStartParams>(request.params.clone())
                .unwrap_or_default();
            let session_id = Uuid::now_v7().to_string();
            wizard_sessions.insert(
                session_id.clone(),
                WizardSessionState {
                    mode: params.mode.unwrap_or_else(|| "local".to_string()),
                    workspace: params.workspace,
                    step: 0,
                    status: "running".to_string(),
                    error: None,
                },
            );
            send_ok(
                socket,
                &request.id,
                json!({
                    "sessionId": session_id,
                    "done": false,
                    "status": "running",
                    "step": {
                        "stepId": "confirm",
                        "kind": "input",
                        "prompt": "Confirm wizard settings (type any value to continue)."
                    }
                }),
            )
            .await
        }

        "wizard.next" => {
            let params = match serde_json::from_value::<WizardNextParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid wizard.next params",
                    )
                    .await;
                }
            };
            let Some(session) = wizard_sessions.get_mut(&params.session_id) else {
                return send_error(socket, &request.id, "bad_request", "wizard not found").await;
            };
            let _ = params.answer;
            if session.step == 0 {
                session.step = 1;
                session.status = "done".to_string();
                let result = json!({
                    "done": true,
                    "status": "done",
                    "result": {
                        "mode": session.mode,
                        "workspace": session.workspace,
                    }
                });
                wizard_sessions.remove(&params.session_id);
                return send_ok(socket, &request.id, result).await;
            }
            send_ok(
                socket,
                &request.id,
                json!({
                    "done": true,
                    "status": "done"
                }),
            )
            .await
        }

        "wizard.cancel" => {
            let params = match serde_json::from_value::<WizardSessionParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid wizard.cancel params",
                    )
                    .await;
                }
            };
            let Some(session) = wizard_sessions.remove(&params.session_id) else {
                return send_error(socket, &request.id, "bad_request", "wizard not found").await;
            };
            send_ok(
                socket,
                &request.id,
                json!({
                    "status": "cancelled",
                    "error": session.error,
                }),
            )
            .await
        }

        "wizard.status" => {
            let params = match serde_json::from_value::<WizardSessionParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid wizard.status params",
                    )
                    .await;
                }
            };
            let Some(session) = wizard_sessions.get(&params.session_id) else {
                return send_error(socket, &request.id, "bad_request", "wizard not found").await;
            };
            send_ok(
                socket,
                &request.id,
                json!({
                    "status": session.status,
                    "error": session.error
                }),
            )
            .await
        }

        "agents.list" => {
            let _ = serde_json::from_value::<AgentsListParams>(request.params.clone())
                .unwrap_or_default();
            ensure_default_agent(state).await;
            let guard = agents_registry().read().await;
            let mut agents = guard.values().cloned().collect::<Vec<_>>();
            agents.sort_by(|left, right| left.id.cmp(&right.id));
            let payload_agents = agents
                .into_iter()
                .map(|agent| {
                    json!({
                        "id": agent.id,
                        "name": agent.name,
                    })
                })
                .collect::<Vec<_>>();
            send_ok(
                socket,
                &request.id,
                json!({
                    "defaultId": state.config.agent_id,
                    "mainKey": state.config.main_key,
                    "scope": "map",
                    "agents": payload_agents
                }),
            )
            .await
        }

        "agents.create" => {
            let params = match serde_json::from_value::<AgentsMutateParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agents.create params",
                    )
                    .await;
                }
            };
            ensure_default_agent(state).await;
            let id = normalize_agent_id(
                params.agent_id.or(params.id).or(params.name.clone()),
                "agent",
            );
            if id.is_empty() {
                return send_error(socket, &request.id, "bad_request", "agentId is required").await;
            }
            let mut guard = agents_registry().write().await;
            if guard.contains_key(&id) {
                return send_error(socket, &request.id, "bad_request", "agent already exists")
                    .await;
            }
            let ts = now_ms();
            guard.insert(
                id.clone(),
                AgentRecord {
                    id: id.clone(),
                    name: params.name.unwrap_or_else(|| id.clone()),
                    workspace: params.workspace,
                    model: params.model,
                    is_default: false,
                    created_at_ms: ts,
                    updated_at_ms: ts,
                },
            );
            send_ok(socket, &request.id, json!({"ok": true, "agentId": id})).await
        }

        "agents.update" => {
            let params = match serde_json::from_value::<AgentsMutateParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agents.update params",
                    )
                    .await;
                }
            };
            ensure_default_agent(state).await;
            let id = normalize_agent_id(params.agent_id.or(params.id), "");
            if id.is_empty() {
                return send_error(socket, &request.id, "bad_request", "agentId is required").await;
            }
            let mut guard = agents_registry().write().await;
            let Some(entry) = guard.get_mut(&id) else {
                return send_error(socket, &request.id, "not_found", "agent not found").await;
            };
            if let Some(name) = params.name {
                entry.name = name;
            }
            if params.workspace.is_some() {
                entry.workspace = params.workspace;
            }
            if params.model.is_some() {
                entry.model = params.model;
            }
            entry.updated_at_ms = now_ms();
            send_ok(socket, &request.id, json!({"ok": true, "agentId": id})).await
        }

        "agents.delete" => {
            let params = match serde_json::from_value::<AgentsMutateParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agents.delete params",
                    )
                    .await;
                }
            };
            let id = normalize_agent_id(params.agent_id.or(params.id), "");
            if id.is_empty() {
                return send_error(socket, &request.id, "bad_request", "agentId is required").await;
            }
            if id == state.config.agent_id {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "cannot delete default agent",
                )
                .await;
            }
            let mut guard = agents_registry().write().await;
            let removed = guard.remove(&id).is_some();
            if !removed {
                return send_error(socket, &request.id, "not_found", "agent not found").await;
            }
            send_ok(socket, &request.id, json!({"ok": true, "agentId": id})).await
        }

        "agents.files.list" => {
            let params = serde_json::from_value::<AgentsFilesParams>(request.params.clone())
                .unwrap_or_default();
            ensure_default_agent(state).await;
            let agent_id =
                normalize_agent_id(params.agent_id.or(params.id), &state.config.agent_id);
            let guard = agents_registry().read().await;
            let Some(agent) = guard.get(&agent_id) else {
                return send_error(socket, &request.id, "not_found", "agent not found").await;
            };
            let workspace = agent
                .workspace
                .as_deref()
                .map(PathBuf::from)
                .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
            let file_names = [
                "AGENTS.md",
                "SOUL.md",
                "TOOLS.md",
                "IDENTITY.md",
                "USER.md",
                "HEARTBEAT.md",
                "BOOTSTRAP.md",
                "memory.md",
            ];
            let mut files = Vec::new();
            for name in file_names {
                let path = workspace.join(name);
                match tokio::fs::metadata(&path).await {
                    Ok(meta) if meta.is_file() => files.push(json!({
                        "name": name,
                        "path": path.to_string_lossy(),
                        "missing": false,
                        "size": meta.len(),
                        "updatedAtMs": meta.modified().ok().and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok()).map(|duration| duration.as_millis() as i64),
                    })),
                    _ => files.push(json!({
                        "name": name,
                        "path": path.to_string_lossy(),
                        "missing": true,
                    })),
                }
            }
            send_ok(
                socket,
                &request.id,
                json!({
                    "agentId": agent_id,
                    "workspace": workspace.to_string_lossy(),
                    "files": files
                }),
            )
            .await
        }

        "agents.files.get" => {
            let params = match serde_json::from_value::<AgentsFilesParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agents.files.get params",
                    )
                    .await;
                }
            };
            ensure_default_agent(state).await;
            let agent_id =
                normalize_agent_id(params.agent_id.or(params.id), &state.config.agent_id);
            let Some(name) = params.name else {
                return send_error(socket, &request.id, "bad_request", "name is required").await;
            };
            if !allowed_agent_file_name(&name) {
                return send_error(socket, &request.id, "bad_request", "unsupported file name")
                    .await;
            }
            let guard = agents_registry().read().await;
            let Some(agent) = guard.get(&agent_id) else {
                return send_error(socket, &request.id, "not_found", "agent not found").await;
            };
            let workspace = agent
                .workspace
                .as_deref()
                .map(PathBuf::from)
                .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
            let path = workspace.join(&name);
            let content = tokio::fs::read_to_string(&path).await.ok();
            let missing = content.is_none();
            send_ok(
                socket,
                &request.id,
                json!({
                    "agentId": agent_id,
                    "workspace": workspace.to_string_lossy(),
                    "file": {
                        "name": name,
                        "path": path.to_string_lossy(),
                        "missing": missing,
                        "content": content
                    }
                }),
            )
            .await
        }

        "agents.files.set" => {
            let params = match serde_json::from_value::<AgentsFilesParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agents.files.set params",
                    )
                    .await;
                }
            };
            ensure_default_agent(state).await;
            let agent_id =
                normalize_agent_id(params.agent_id.or(params.id), &state.config.agent_id);
            let Some(name) = params.name else {
                return send_error(socket, &request.id, "bad_request", "name is required").await;
            };
            let Some(content) = params.content else {
                return send_error(socket, &request.id, "bad_request", "content is required").await;
            };
            if !allowed_agent_file_name(&name) {
                return send_error(socket, &request.id, "bad_request", "unsupported file name")
                    .await;
            }
            let guard = agents_registry().read().await;
            let Some(agent) = guard.get(&agent_id) else {
                return send_error(socket, &request.id, "not_found", "agent not found").await;
            };
            let workspace = agent
                .workspace
                .as_deref()
                .map(PathBuf::from)
                .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
            if tokio::fs::create_dir_all(&workspace).await.is_err() {
                return send_error(
                    socket,
                    &request.id,
                    "request_failed",
                    "failed to prepare workspace",
                )
                .await;
            }
            let path = workspace.join(&name);
            if tokio::fs::write(&path, content).await.is_err() {
                return send_error(
                    socket,
                    &request.id,
                    "request_failed",
                    "failed to write file",
                )
                .await;
            }
            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "agentId": agent_id,
                    "workspace": workspace.to_string_lossy(),
                    "file": {
                        "name": name,
                        "path": path.to_string_lossy(),
                        "missing": false
                    }
                }),
            )
            .await
        }

        "agent" => {
            let params = match serde_json::from_value::<AgentParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(socket, &request.id, "bad_request", "invalid agent params")
                        .await;
                }
            };
            let prompt = params
                .message
                .as_deref()
                .or(params.prompt.as_deref())
                .unwrap_or_default()
                .trim()
                .to_string();
            if prompt.is_empty() {
                return send_error(socket, &request.id, "bad_request", "message is required").await;
            }
            let normalized_idempotency_key = params
                .idempotency_key
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string);
            let session =
                resolve_or_create_session_with_refs(state, params.session_id, params.session_key)
                    .await
                    .map_err(|_| ())?;
            if let Some(key) = normalized_idempotency_key.as_deref() {
                let fingerprint = chat_send_fingerprint(
                    session.id,
                    &prompt,
                    params.model.as_deref(),
                    params.fallback_models.as_ref(),
                    params.confirmed,
                );
                match claim_or_load_idempotency(state, &auth.subject, "agent", key, &fingerprint)
                    .await
                {
                    Ok(Some(payload)) => {
                        state.metrics.inc_idempotency_hit();
                        return send_ok(socket, &request.id, payload).await;
                    }
                    Ok(None) => state.metrics.inc_idempotency_miss(),
                    Err(error) => return send_api_error(socket, &request.id, error).await,
                }
            }
            let session_key = lookup_session_key(state, session.id)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| session.id.to_string());
            let run_id = create_chat_run_record(
                state,
                session.id,
                &prompt,
                normalized_idempotency_key.clone(),
            )
            .await
            .map_err(|_| ())?;
            let run = execute_chat_run(
                state,
                run_id,
                session.id,
                prompt,
                params.model,
                params.fallback_models,
                params.confirmed,
                normalized_idempotency_key.clone(),
            )
            .await
            .map_err(|_| ())?;
            let payload = json!({
                "runId": run.run_id,
                "sessionId": run.session_id,
                "sessionKey": session_key,
                "status": run.status,
                "modelUsed": run.model_used,
                "output": run.output,
            });
            if let Some(key) = normalized_idempotency_key.as_deref() {
                if let Err(error) = store_idempotency_response(
                    state,
                    &auth.subject,
                    "agent",
                    key,
                    run.run_id,
                    payload.clone(),
                )
                .await
                {
                    tracing::warn!(
                        target: "gateway.ws",
                        idempotency_key = key,
                        error = %error,
                        "failed to persist idempotency response for agent request"
                    );
                }
            }
            send_ok(socket, &request.id, payload).await
        }

        "agent.wait" => {
            let params = match serde_json::from_value::<AgentWaitParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid agent.wait params",
                    )
                    .await;
                }
            };
            let run_id = params.run_id.trim().to_string();
            if run_id.is_empty() {
                return send_error(socket, &request.id, "bad_request", "runId is required").await;
            }
            let timeout_ms = params.timeout_ms.unwrap_or(30_000).min(300_000);
            let started = std::time::Instant::now();
            loop {
                let row = sqlx::query_as::<
                    _,
                    (
                        String,
                        Option<chrono::DateTime<Utc>>,
                        Option<chrono::DateTime<Utc>>,
                    ),
                >(
                    "select status, created_at, updated_at from chat_runs where id::text = $1",
                )
                .bind(&run_id)
                .fetch_optional(&state.pool)
                .await
                .map_err(|_| ())?;

                if let Some((status, started_at, ended_at)) = row {
                    if status != "running" {
                        return send_ok(
                            socket,
                            &request.id,
                            json!({
                                "runId": run_id,
                                "status": if status == "error" { "error" } else { "ok" },
                                "startedAt": started_at.map(|value| value.timestamp_millis()),
                                "endedAt": ended_at.map(|value| value.timestamp_millis()),
                                "error": if status == "error" { Some("run failed") } else { None::<&str> },
                            }),
                        )
                        .await;
                    }
                } else {
                    return send_error(socket, &request.id, "not_found", "run not found").await;
                }

                if started.elapsed().as_millis() as u64 >= timeout_ms {
                    return send_ok(
                        socket,
                        &request.id,
                        json!({
                            "runId": run_id,
                            "status": "timeout"
                        }),
                    )
                    .await;
                }

                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
        }

        "agent.identity.get" => {
            match routes::ws_methods::system_runtime::agent_identity_get(state, request.params.clone())
                .await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "send" => {
            let params = match serde_json::from_value::<SendParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(socket, &request.id, "bad_request", "invalid send params")
                        .await;
                }
            };
            let to = params.to.unwrap_or_default().trim().to_string();
            let message = params.message.unwrap_or_default().trim().to_string();
            if to.is_empty() || message.is_empty() {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "to and message are required",
                )
                .await;
            }
            let run_id = params
                .idempotency_key
                .unwrap_or_else(|| format!("send_{}", Uuid::now_v7()));
            let channel = normalize_channel(params.channel.clone(), "whatsapp");
            let payload = json!({
                "runId": run_id,
                "messageId": format!("msg_{}", Uuid::now_v7()),
                "channel": channel.clone(),
                "to": to,
                "accepted": true,
                "note": "MAP gateway accepted outbound message (connector delivery not wired in Rust runtime yet)."
            });
            let _ = sqlx::query(
                "insert into audit_logs (category, action, actor, details) values ('channels', 'send', 'operator', $1)",
            )
            .bind(json!({
                "to": to,
                "channel": channel,
                "accountId": params.account_id,
                "message": message
            }))
            .execute(&state.pool)
            .await;
            send_ok(socket, &request.id, payload).await
        }

        "poll" => {
            let params = match serde_json::from_value::<PollParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(socket, &request.id, "bad_request", "invalid poll params")
                        .await;
                }
            };
            let to = params.to.unwrap_or_default().trim().to_string();
            let question = params.question.unwrap_or_default().trim().to_string();
            let options = params
                .options
                .unwrap_or_default()
                .into_iter()
                .map(|item| item.trim().to_string())
                .filter(|item| !item.is_empty())
                .collect::<Vec<_>>();
            if to.is_empty() || question.is_empty() || options.len() < 2 {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "to, question, and at least two options are required",
                )
                .await;
            }
            let run_id = params
                .idempotency_key
                .unwrap_or_else(|| format!("poll_{}", Uuid::now_v7()));
            let channel = normalize_channel(params.channel.clone(), "whatsapp");
            let account_id = params.account_id.clone();
            let _ = sqlx::query(
                "insert into audit_logs (category, action, actor, details) values ('channels', 'poll', 'operator', $1)",
            )
            .bind(json!({
                "to": to,
                "channel": channel,
                "accountId": account_id,
                "question": question,
                "options": options
            }))
            .execute(&state.pool)
            .await;
            send_ok(
                socket,
                &request.id,
                json!({
                    "runId": run_id,
                    "pollId": format!("poll_{}", Uuid::now_v7()),
                    "channel": normalize_channel(params.channel, "whatsapp"),
                    "to": to,
                    "accountId": account_id,
                    "accepted": true,
                    "note": "MAP gateway accepted poll request (connector delivery not wired in Rust runtime yet)."
                }),
            )
            .await
        }

        "wake" => {
            let params =
                serde_json::from_value::<WakeParams>(request.params.clone()).unwrap_or_default();
            let mode = params.mode.unwrap_or_else(|| "now".to_string());
            let text = params
                .text
                .unwrap_or_else(|| "Wake and run the main assistant context now.".to_string());
            if mode == "next-heartbeat" {
                return send_ok(
                    socket,
                    &request.id,
                    json!({
                        "ok": true,
                        "mode": mode,
                        "queued": true,
                        "message": "Wake queued for next heartbeat cycle.",
                    }),
                )
                .await;
            }

            let session_key = format!("agent:{}:{}", state.config.agent_id, state.config.main_key);
            let session =
                resolve_or_create_session_with_refs(state, None, Some(session_key.clone()))
                    .await
                    .map_err(|_| ())?;
            let run_id = create_chat_run_record(state, session.id, &text, None)
                .await
                .map_err(|_| ())?;
            let run = execute_chat_run(
                state,
                run_id,
                session.id,
                text,
                None,
                None,
                Some(true),
                None,
            )
            .await
            .map_err(|_| ())?;
            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "mode": mode,
                    "runId": run.run_id,
                    "sessionId": run.session_id,
                    "sessionKey": session_key,
                    "status": run.status,
                }),
            )
            .await
        }

        "last-heartbeat" => {
            match routes::ws_methods::system_runtime::last_heartbeat(request.params.clone()).await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "set-heartbeats" => {
            match routes::ws_methods::system_runtime::set_heartbeats(request.params.clone()).await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "system-presence" => {
            match routes::ws_methods::system_runtime::system_presence(state, request.params.clone())
                .await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "system-event" => {
            match routes::ws_methods::system_runtime::system_event(state, request.params.clone())
                .await
            {
                Ok(outcome) => {
                    let _ = send_event(
                        state,
                        socket,
                        &auth.subject,
                        "presence",
                        outcome.presence_event_payload.clone(),
                    )
                    .await;
                    send_ok(socket, &request.id, outcome.response).await
                }
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "talk.mode" => {
            match routes::ws_methods::cron_control::talk_mode(request.params.clone()).await {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "browser.request"
        | "tts.status"
        | "tts.providers"
        | "tts.enable"
        | "tts.disable"
        | "tts.convert"
        | "tts.setProvider"
        | "voicewake.get"
        | "voicewake.set" => {
            match routes::ws_methods::media_tools::dispatch(state, method, request.params.clone())
                .await
            {
                Some(Ok(payload)) => {
                    if method == "voicewake.set" {
                        let _ = send_event(
                            state,
                            socket,
                            &auth.subject,
                            "voicewake.changed",
                            payload.clone(),
                        )
                        .await;
                    }
                    send_ok(socket, &request.id, payload).await
                }
                Some(Err(error)) => send_ws_method_error(socket, &request.id, error).await,
                None => send_error(socket, &request.id, "method_not_found", "unknown method").await,
            }
        }

        "sessions.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::sessions::list_sessions(State(state.clone())).await,
            )
            .await
        }

        "sessions.create" => {
            let params = serde_json::from_value::<SessionsCreateParams>(request.params.clone())
                .unwrap_or_default();
            send_api_result(
                socket,
                &request.id,
                routes::sessions::create_session(
                    State(state.clone()),
                    Json(routes::sessions::CreateSessionRequest {
                        title: params.title,
                    }),
                )
                .await,
            )
            .await
        }

        "sessions.patch" => {
            let params = match serde_json::from_value::<SessionsPatchParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid sessions.patch params",
                    )
                    .await;
                }
            };

            let session_id = params.session_id.or(params.id);
            let Some(session_id) = session_id else {
                return send_error(socket, &request.id, "bad_request", "sessionId is required")
                    .await;
            };

            let session = sqlx::query_as::<_, SessionRow>(
                r#"
                update sessions
                set title = coalesce($2, title), updated_at = now()
                where id = $1
                returning id, title, created_at, updated_at
                "#,
            )
            .bind(session_id)
            .bind(params.title)
            .fetch_optional(&state.pool)
            .await
            .map_err(|_| ())?;

            match session {
                Some(session) => send_ok(socket, &request.id, json!(session)).await,
                None => send_error(socket, &request.id, "not_found", "session not found").await,
            }
        }

        "sessions.reset" => {
            let params = serde_json::from_value::<SessionsResetParams>(request.params.clone())
                .unwrap_or_default();
            let session_id = params.session_id.or(params.id);
            let Some(session_id) = session_id else {
                return send_error(socket, &request.id, "bad_request", "sessionId is required")
                    .await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::sessions::reset_session(State(state.clone()), Path(session_id)).await,
            )
            .await
        }

        "sessions.resolve" => {
            let params = serde_json::from_value::<SessionsResolveParams>(request.params.clone())
                .unwrap_or_default();
            let session = resolve_or_create_session_with_refs(
                state,
                params.session_id.or(params.id),
                params.session_key.or(params.key),
            )
            .await;

            match session {
                Ok(session) => {
                    let session_key = lookup_session_key(state, session.id).await.ok().flatten();
                    send_ok(
                        socket,
                        &request.id,
                        json!(SessionsResolveResult {
                            session,
                            session_key,
                        }),
                    )
                    .await
                }
                Err(error) => send_api_error(socket, &request.id, error).await,
            }
        }

        "chat.history" => {
            let params = serde_json::from_value::<ChatHistoryParams>(request.params.clone())
                .unwrap_or_default();
            let limit = params.limit.unwrap_or(200).clamp(1, 1_000);
            let message_limit = params.message_limit.unwrap_or(limit).clamp(1, 1_000);
            let run_limit = params.run_limit.unwrap_or(limit).clamp(1, 1_000);

            let session = resolve_or_create_session_with_refs(
                state,
                params.session_id,
                params.session_key.or(params.key),
            )
            .await
            .map_err(|_| ())?;

            let messages = sqlx::query_as::<_, SessionMessageRow>(
                r#"
                select id, session_id, role, text, created_at
                from session_messages
                where session_id = $1
                order by created_at asc
                limit $2
                "#,
            )
            .bind(session.id)
            .bind(message_limit)
            .fetch_all(&state.pool)
            .await
            .map_err(|_| ())?;

            let runs = sqlx::query_as::<_, SessionRunRow>(
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
                limit $2
                "#,
            )
            .bind(session.id)
            .bind(run_limit)
            .fetch_all(&state.pool)
            .await
            .map_err(|_| ())?;

            let session_key = lookup_session_key(state, session.id).await.ok().flatten();
            let payload = json!({
                "session": session,
                "sessionKey": session_key,
                "messages": messages,
                "runs": runs,
            });
            send_ok(socket, &request.id, payload).await
        }

        "chat.send" => {
            let params = match serde_json::from_value::<ChatSendParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid chat.send params",
                    )
                    .await;
                }
            };

            let prompt = params
                .prompt
                .as_deref()
                .or(params.message.as_deref())
                .unwrap_or_default()
                .trim()
                .to_string();
            if prompt.is_empty() {
                return send_error(socket, &request.id, "bad_request", "prompt is required").await;
            }

            let session = match resolve_or_create_session_with_refs(
                state,
                params.session_id,
                params.session_key,
            )
            .await
            {
                Ok(session) => session,
                Err(error) => {
                    tracing::error!("chat.send session resolution failed: {error}");
                    return send_api_error(socket, &request.id, error).await;
                }
            };

            let session_key = lookup_session_key(state, session.id)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| session.id.to_string());

            let normalized_idempotency_key = params
                .idempotency_key
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string);

            if let Some(key) = normalized_idempotency_key.as_deref() {
                let fingerprint = chat_send_fingerprint(
                    session.id,
                    &prompt,
                    params.model.as_deref(),
                    params.fallback_models.as_ref(),
                    params.confirmed,
                );
                match claim_or_load_idempotency(
                    state,
                    &auth.subject,
                    "chat.send",
                    key,
                    &fingerprint,
                )
                .await
                {
                    Ok(Some(payload)) => {
                        state.metrics.inc_idempotency_hit();
                        return send_ok(socket, &request.id, payload).await;
                    }
                    Ok(None) => state.metrics.inc_idempotency_miss(),
                    Err(error) => return send_api_error(socket, &request.id, error).await,
                }
            }

            let run_id = match create_chat_run_record(
                state,
                session.id,
                &prompt,
                normalized_idempotency_key.clone(),
            )
            .await
            {
                Ok(run_id) => run_id,
                Err(error) => {
                    tracing::error!("chat.send failed to create run: {error}");
                    return send_error(
                        socket,
                        &request.id,
                        "request_failed",
                        "failed to create chat run",
                    )
                    .await;
                }
            };

            let accepted = json!({
                "runId": run_id,
                "sessionId": session.id,
                "sessionKey": session_key,
                "status": "accepted"
            });

            if let Some(key) = normalized_idempotency_key.as_deref() {
                if let Err(error) = store_idempotency_response(
                    state,
                    &auth.subject,
                    "chat.send",
                    key,
                    run_id,
                    accepted.clone(),
                )
                .await
                {
                    tracing::warn!(
                        target: "gateway.ws",
                        idempotency_key = key,
                        error = %error,
                        "failed to persist idempotency response"
                    );
                }
            }

            send_ok(socket, &request.id, accepted).await?;

            let task = ChatRunTask {
                run_id,
                session_id: session.id,
                session_key,
                auth_subject: auth.subject.clone(),
                prompt,
                model: params.model,
                fallback_models: params.fallback_models,
                confirmed: params.confirmed,
                idempotency_key: normalized_idempotency_key,
            };

            let state = state.clone();
            let socket = Arc::clone(socket);
            state.metrics.inc_chat_run();
            tokio::spawn(async move {
                run_chat_task(state, socket, task).await;
            });

            Ok(())
        }

        "chat.inject" => {
            let params = match serde_json::from_value::<ChatInjectParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid chat.inject params",
                    )
                    .await;
                }
            };

            let text = params
                .text
                .as_deref()
                .or(params.message.as_deref())
                .unwrap_or_default()
                .trim();
            if text.is_empty() {
                return send_error(socket, &request.id, "bad_request", "text is required").await;
            }

            let session = resolve_or_create_session_with_refs(
                state,
                params.session_id,
                params.session_key.or(params.key),
            )
            .await
            .map_err(|_| ())?;

            sqlx::query(
                r#"
                insert into session_messages (session_id, role, text)
                values ($1, 'assistant', $2)
                "#,
            )
            .bind(session.id)
            .bind(text)
            .execute(&state.pool)
            .await
            .map_err(|_| ())?;

            sqlx::query("update sessions set updated_at = now() where id = $1")
                .bind(session.id)
                .execute(&state.pool)
                .await
                .map_err(|_| ())?;

            let session_key = lookup_session_key(state, session.id)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| session.id.to_string());

            send_ok(
                socket,
                &request.id,
                json!({"ok": true, "sessionId": session.id, "sessionKey": session_key}),
            )
            .await?;
            send_event(
                state,
                socket,
                &auth.subject,
                "chat",
                json!({
                    "kind": "injected",
                    "sessionId": session.id,
                    "sessionKey": session_key,
                    "text": text,
                }),
            )
            .await
        }

        "chat.abort" => {
            let params = serde_json::from_value::<ChatAbortParams>(request.params.clone())
                .unwrap_or_default();

            let mut aborted_runs = Vec::<(Uuid, Uuid)>::new();
            if let Some(run_id) = params.run_id {
                let rows = sqlx::query_as::<_, (Uuid, Uuid)>(
                    r#"
                    update chat_runs
                    set status = 'aborted', updated_at = now()
                    where id = $1 and status = 'running'
                    returning id, session_id
                    "#,
                )
                .bind(run_id)
                .fetch_all(&state.pool)
                .await
                .map_err(|_| ())?;
                aborted_runs.extend(rows);
            } else if let Some(session_id) = params.session_id {
                let rows = sqlx::query_as::<_, (Uuid, Uuid)>(
                    r#"
                    update chat_runs
                    set status = 'aborted', updated_at = now()
                    where session_id = $1 and status = 'running'
                    returning id, session_id
                    "#,
                )
                .bind(session_id)
                .fetch_all(&state.pool)
                .await
                .map_err(|_| ())?;
                aborted_runs.extend(rows);
            } else if let Some(session_key) = params.session_key.or(params.key) {
                let rows = sqlx::query_as::<_, (Uuid, Uuid)>(
                    r#"
                    update chat_runs
                    set status = 'aborted', updated_at = now()
                    where session_id in (
                      select id from sessions where session_key = $1
                    ) and status = 'running'
                    returning id, session_id
                    "#,
                )
                .bind(session_key)
                .fetch_all(&state.pool)
                .await
                .map_err(|_| ())?;
                aborted_runs.extend(rows);
            }

            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "aborted": aborted_runs.len(),
                    "runIds": aborted_runs.iter().map(|(run_id, _)| run_id).collect::<Vec<_>>(),
                }),
            )
            .await?;

            for (run_id, session_id) in aborted_runs {
                state.run_cancellations.cancel(run_id);
                let session_key = lookup_session_key(state, session_id)
                    .await
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| session_id.to_string());
                send_event(
                    state,
                    socket,
                    &auth.subject,
                    "chat",
                    json!({
                        "kind": "run.aborted",
                        "runId": run_id,
                        "sessionId": session_id,
                        "sessionKey": session_key,
                        "state": "aborted",
                    }),
                )
                .await?;
            }

            Ok(())
        }

        "events.resume" => {
            let params = serde_json::from_value::<EventsResumeParams>(request.params.clone())
                .unwrap_or_default();
            let after_cursor = params.after_cursor.unwrap_or(0).max(0);
            let limit = params
                .limit
                .unwrap_or(state.config.ws_resume_max_events)
                .clamp(1, state.config.ws_resume_max_events);

            let replayed =
                replay_ws_events(state, socket, &auth.subject, after_cursor, limit).await?;
            state.metrics.inc_chat_resume_request();
            let latest = latest_event_cursor(state, &auth.subject)
                .await
                .unwrap_or(after_cursor);
            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "replayed": replayed,
                    "afterCursor": after_cursor,
                    "cursor": latest,
                }),
            )
            .await
        }

        "models.list" => {
            let Json(payload) = routes::models::list_models(State(state.clone())).await;
            send_ok(socket, &request.id, json!(payload)).await
        }

        "models.profiles.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::models::list_profiles(State(state.clone())).await,
            )
            .await
        }

        "models.profiles.upsert" => {
            let params =
                match serde_json::from_value::<ModelsProfileUpsertParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid models.profiles.upsert params",
                        )
                        .await;
                    }
                };

            let provider = params.provider.trim();
            if provider.is_empty() {
                return send_error(socket, &request.id, "bad_request", "provider is required")
                    .await;
            }

            let profile_id = params
                .profile_id
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string)
                .unwrap_or_else(|| format!("{provider}-{}", Uuid::now_v7()));

            let profile_type = params
                .profile_type
                .as_deref()
                .map(str::trim)
                .filter(|value| !value.is_empty())
                .map(ToString::to_string)
                .unwrap_or_else(|| "api_key".to_string());

            let payload = if let Some(payload) = params.payload {
                payload
            } else if let Some(api_key) = params.api_key {
                json!({"api_key": api_key})
            } else {
                Value::Object(Default::default())
            };

            send_api_result(
                socket,
                &request.id,
                routes::models::upsert_profile(
                    State(state.clone()),
                    Json(routes::models::UpsertAuthProfileRequest {
                        provider: provider.to_string(),
                        profile_id,
                        profile_type,
                        payload,
                    }),
                )
                .await,
            )
            .await
        }

        "models.profiles.delete" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };
            send_api_result(
                socket,
                &request.id,
                routes::models::delete_profile(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "models.generate" => {
            let params =
                match serde_json::from_value::<ModelsGenerateParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid models.generate params",
                        )
                        .await;
                    }
                };

            send_api_result(
                socket,
                &request.id,
                routes::models::generate_preview(
                    State(state.clone()),
                    Json(routes::models::GenerateRequest {
                        prompt: params.prompt,
                        model: params.model,
                        fallback_models: params.fallback_models,
                    }),
                )
                .await,
            )
            .await
        }

        "skills.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::skills::list_skills(State(state.clone())).await,
            )
            .await
        }

        "skills.rescan" => {
            send_api_result(
                socket,
                &request.id,
                routes::skills::rescan_skills(State(state.clone())).await,
            )
            .await
        }

        "skills.bins" | "skills.install" | "skills.update" => {
            match routes::ws_methods::skills_ext::dispatch(method, state, request.params.clone())
                .await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "security.audit" => {
            send_api_result(
                socket,
                &request.id,
                routes::security::audit(State(state.clone())).await,
            )
            .await
        }

        "cron.status" => {
            match routes::ws_methods::cron_control::cron_status(state, request.params.clone()).await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "cron.update" => {
            match routes::ws_methods::cron_control::cron_update(state, request.params.clone()).await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_ws_method_error(socket, &request.id, error).await,
            }
        }

        "cron.jobs.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::cron::list_jobs(State(state.clone())).await,
            )
            .await
        }

        "cron.runs.list" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let result = routes::cron::list_runs(State(state.clone())).await;

            match result {
                Ok(Json(runs)) => {
                    let filtered = if let Some(id) = params.id.or(params.job_id) {
                        runs.into_iter()
                            .filter(|run| run.cron_job_id == id)
                            .collect::<Vec<_>>()
                    } else {
                        runs
                    };
                    send_ok(socket, &request.id, json!(filtered)).await
                }
                Err(error) => send_api_error(socket, &request.id, error).await,
            }
        }

        "cron.jobs.create" => {
            let params = match serde_json::from_value::<CronCreateParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid cron.jobs.create params",
                    )
                    .await;
                }
            };

            let request_payload = match build_cron_create_request(params) {
                Ok(payload) => payload,
                Err(message) => {
                    return send_error(socket, &request.id, "bad_request", &message).await
                }
            };

            send_api_result(
                socket,
                &request.id,
                routes::cron::create_job(State(state.clone()), Json(request_payload)).await,
            )
            .await
        }

        "cron.jobs.run" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id.or(params.job_id) else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::cron::run_job_now(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "cron.jobs.delete" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id.or(params.job_id) else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::cron::delete_job(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "channels.summary" => {
            send_api_result(
                socket,
                &request.id,
                routes::channels::list_channels(State(state.clone())).await,
            )
            .await
        }

        "channels.status" => {
            let summary = routes::channels::list_channels(State(state.clone())).await;
            let accounts = routes::channels::list_accounts(State(state.clone())).await;
            let routes_list = routes::channels::list_routes(State(state.clone())).await;
            let pairings = routes::channels::list_pairing_requests(
                State(state.clone()),
                Query(routes::channels::PairingQuery { provider: None }),
            )
            .await;

            match (summary, accounts, routes_list, pairings) {
                (Ok(Json(summary)), Ok(Json(accounts)), Ok(Json(routes)), Ok(Json(pairings))) => {
                    send_ok(
                        socket,
                        &request.id,
                        json!({
                            "ts": Utc::now().timestamp_millis(),
                            "summary": summary,
                            "accounts": accounts,
                            "routes": routes,
                            "pairingRequests": pairings,
                        }),
                    )
                    .await
                }
                (Err(error), _, _, _)
                | (_, Err(error), _, _)
                | (_, _, Err(error), _)
                | (_, _, _, Err(error)) => send_api_error(socket, &request.id, error).await,
            }
        }

        "channels.logout" => {
            let params = serde_json::from_value::<ChannelsLogoutParams>(request.params.clone())
                .unwrap_or_default();
            let provider = params
                .channel
                .or(params.provider)
                .map(|value| value.trim().to_lowercase())
                .filter(|value| !value.is_empty());
            let Some(provider) = provider else {
                return send_error(socket, &request.id, "bad_request", "channel is required").await;
            };
            let account_match = params
                .account_id
                .or(params.account_key)
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());

            let deleted = if let Some(account) = account_match.as_ref() {
                sqlx::query(
                    "delete from channel_accounts where provider = $1 and (account_key = $2 or id::text = $2)",
                )
                .bind(&provider)
                .bind(account)
                .execute(&state.pool)
                .await
                .map_err(|_| ())?
                .rows_affected()
            } else {
                sqlx::query("delete from channel_accounts where provider = $1")
                    .bind(&provider)
                    .execute(&state.pool)
                    .await
                    .map_err(|_| ())?
                    .rows_affected()
            };

            send_ok(
                socket,
                &request.id,
                json!({
                    "channel": provider,
                    "accountId": account_match,
                    "cleared": deleted > 0,
                    "deleted": deleted,
                }),
            )
            .await
        }

        "web.login.start" => {
            match routes::ws_methods::web_login::start(state, &auth.subject, request.params.clone())
                .await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_error(socket, &request.id, error.code, &error.message).await,
            }
        }

        "web.login.wait" => {
            match routes::ws_methods::web_login::wait(state, &auth.subject, request.params.clone())
                .await
            {
                Ok(payload) => send_ok(socket, &request.id, payload).await,
                Err(error) => send_error(socket, &request.id, error.code, &error.message).await,
            }
        }

        "channels.accounts.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::channels::list_accounts(State(state.clone())).await,
            )
            .await
        }

        "channels.accounts.upsert" => {
            let params = match serde_json::from_value::<ChannelAccountUpsertParams>(
                request.params.clone(),
            ) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid channels.accounts.upsert params",
                    )
                    .await;
                }
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::upsert_account(
                    State(state.clone()),
                    Json(routes::channels::UpsertChannelAccountRequest {
                        provider: params.provider,
                        account_key: params.account_key,
                        metadata: params.metadata,
                    }),
                )
                .await,
            )
            .await
        }

        "channels.accounts.delete" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::delete_account(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "channels.routes.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::channels::list_routes(State(state.clone())).await,
            )
            .await
        }

        "channels.routes.upsert" => {
            let params =
                match serde_json::from_value::<ChannelRouteUpsertParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid channels.routes.upsert params",
                        )
                        .await;
                    }
                };

            send_api_result(
                socket,
                &request.id,
                routes::channels::upsert_route(
                    State(state.clone()),
                    Json(routes::channels::UpsertChannelRouteRequest {
                        provider: params.provider,
                        account_id: params.account_id,
                        peer_key: params.peer_key,
                        session_scope: params.session_scope,
                    }),
                )
                .await,
            )
            .await
        }

        "channels.routes.delete" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::delete_route(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "channels.resolveSession" => {
            let params = match serde_json::from_value::<ChannelsResolveSessionParams>(
                request.params.clone(),
            ) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid channels.resolveSession params",
                    )
                    .await;
                }
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::resolve_session(
                    State(state.clone()),
                    Json(routes::channels::ResolveSessionRequest {
                        provider: params.provider,
                        peer_kind: params.peer_kind,
                        peer_id: params.peer_id,
                        account_key: params.account_key,
                        thread_id: params.thread_id,
                        dm_scope: params.dm_scope,
                        identity_key: params.identity_key,
                        agent_id: params.agent_id,
                        main_key: params.main_key,
                    }),
                )
                .await,
            )
            .await
        }

        "channels.inbound" => {
            let params =
                match serde_json::from_value::<ChannelsInboundParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid channels.inbound params",
                        )
                        .await;
                    }
                };

            match routes::channels::inbound_message(
                State(state.clone()),
                Json(routes::channels::InboundMessageRequest {
                    provider: params.provider,
                    peer_kind: params.peer_kind,
                    peer_id: params.peer_id,
                    text: params.text,
                    account_key: params.account_key,
                    thread_id: params.thread_id,
                    dm_scope: params.dm_scope,
                    dm_policy: params.dm_policy,
                    identity_key: params.identity_key,
                    agent_id: params.agent_id,
                    main_key: params.main_key,
                    model: params.model,
                    fallback_models: params.fallback_models,
                    confirmed: params.confirmed,
                    metadata: params.metadata,
                }),
            )
            .await
            {
                Ok((status, Json(payload))) => {
                    let mut payload_value = serde_json::to_value(payload).map_err(|_| ())?;
                    if let Some(object) = payload_value.as_object_mut() {
                        object.insert("status_code".to_string(), json!(status.as_u16()));
                    }
                    send_ok(socket, &request.id, payload_value).await
                }
                Err(error) => send_api_error(socket, &request.id, error).await,
            }
        }

        "channels.pairing.list" => {
            let params = serde_json::from_value::<PairingListParams>(request.params.clone())
                .unwrap_or_default();
            send_api_result(
                socket,
                &request.id,
                routes::channels::list_pairing_requests(
                    State(state.clone()),
                    Query(routes::channels::PairingQuery {
                        provider: params.provider,
                    }),
                )
                .await,
            )
            .await
        }

        "channels.pairing.approve" => {
            let params = serde_json::from_value::<PairingDecisionParams>(request.params.clone())
                .unwrap_or_default();
            let Some(id) = params.id else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::approve_pairing_request(
                    State(state.clone()),
                    Path(id),
                    Query(routes::channels::PairingDecisionRequest {
                        provider: params.provider,
                    }),
                )
                .await,
            )
            .await
        }

        "channels.pairing.reject" => {
            let params = serde_json::from_value::<PairingDecisionParams>(request.params.clone())
                .unwrap_or_default();
            let Some(id) = params.id else {
                return send_error(socket, &request.id, "bad_request", "id is required").await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::channels::reject_pairing_request(
                    State(state.clone()),
                    Path(id),
                    Query(routes::channels::PairingDecisionRequest {
                        provider: params.provider,
                    }),
                )
                .await,
            )
            .await
        }

        "exec.approvals.get" => {
            let guard = exec_approvals_gateway_store().read().await;
            let file = guard.clone();
            send_ok(
                socket,
                &request.id,
                json!({
                    "path": "~/.map/exec-approvals.json",
                    "exists": true,
                    "hash": hash_value(&file),
                    "file": file,
                }),
            )
            .await
        }

        "exec.approvals.set" => {
            let params =
                match serde_json::from_value::<ExecApprovalsSetParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid exec.approvals.set params",
                        )
                        .await;
                    }
                };
            let Some(file) = params.file.filter(|value| value.is_object()) else {
                return send_error(socket, &request.id, "bad_request", "file is required").await;
            };
            let Some(base_hash) = params.base_hash else {
                return send_error(socket, &request.id, "bad_request", "baseHash is required")
                    .await;
            };
            let mut guard = exec_approvals_gateway_store().write().await;
            if base_hash != hash_value(&guard) {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "exec approvals changed; reload and retry",
                )
                .await;
            }
            *guard = file.clone();
            send_ok(
                socket,
                &request.id,
                json!({
                    "path": "~/.map/exec-approvals.json",
                    "exists": true,
                    "hash": hash_value(&file),
                    "file": file,
                }),
            )
            .await
        }

        "exec.approvals.node.get" => {
            let params = serde_json::from_value::<ExecApprovalsSetParams>(request.params.clone())
                .unwrap_or_default();
            let node_id = params
                .node_id
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let Some(node_id) = node_id else {
                return send_error(socket, &request.id, "bad_request", "nodeId is required").await;
            };
            let guard = exec_approvals_nodes_store().read().await;
            let file = guard
                .get(&node_id)
                .cloned()
                .unwrap_or_else(default_exec_approvals_file);
            send_ok(
                socket,
                &request.id,
                json!({
                    "path": format!("node:{node_id}:exec-approvals.json"),
                    "exists": true,
                    "hash": hash_value(&file),
                    "file": file,
                }),
            )
            .await
        }

        "exec.approvals.node.set" => {
            let params =
                match serde_json::from_value::<ExecApprovalsSetParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid exec.approvals.node.set params",
                        )
                        .await;
                    }
                };
            let node_id = params
                .node_id
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty());
            let Some(node_id) = node_id else {
                return send_error(socket, &request.id, "bad_request", "nodeId is required").await;
            };
            let Some(file) = params.file.filter(|value| value.is_object()) else {
                return send_error(socket, &request.id, "bad_request", "file is required").await;
            };
            let Some(base_hash) = params.base_hash else {
                return send_error(socket, &request.id, "bad_request", "baseHash is required")
                    .await;
            };
            let mut guard = exec_approvals_nodes_store().write().await;
            let current = guard
                .get(&node_id)
                .cloned()
                .unwrap_or_else(default_exec_approvals_file);
            if base_hash != hash_value(&current) {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "exec approvals changed; reload and retry",
                )
                .await;
            }
            guard.insert(node_id.clone(), file.clone());
            send_ok(
                socket,
                &request.id,
                json!({
                    "path": format!("node:{node_id}:exec-approvals.json"),
                    "exists": true,
                    "hash": hash_value(&file),
                    "file": file,
                }),
            )
            .await
        }

        "exec.approval.request" => {
            let params =
                match serde_json::from_value::<ExecApprovalRequestParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid exec.approval.request params",
                        )
                        .await;
                    }
                };
            let command = params.command.unwrap_or_default().trim().to_string();
            if command.is_empty() {
                return send_error(socket, &request.id, "bad_request", "command is required").await;
            }
            let id = params
                .id
                .map(|value| value.trim().to_string())
                .filter(|value| !value.is_empty())
                .unwrap_or_else(|| Uuid::now_v7().to_string());
            let timeout_ms = params.timeout_ms.unwrap_or(120_000).clamp(1_000, 300_000);
            let created_at_ms = now_ms();
            let expires_at_ms = created_at_ms + timeout_ms as i64;
            let (tx, rx) = oneshot::channel::<String>();
            let request_payload = json!({
                "command": command,
                "cwd": params.cwd,
                "host": params.host,
                "security": params.security,
                "ask": params.ask,
                "agentId": params.agent_id,
                "resolvedPath": params.resolved_path,
                "sessionKey": params.session_key,
            });
            {
                let mut guard = pending_exec_approvals().lock().await;
                if guard.contains_key(&id) {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "approval id already pending",
                    )
                    .await;
                }
                guard.insert(
                    id.clone(),
                    PendingExecApproval {
                        request: request_payload.clone(),
                        created_at_ms,
                        expires_at_ms,
                        resolver: tx,
                    },
                );
            }
            let _ = send_event(
                state,
                socket,
                &auth.subject,
                "exec.approval.requested",
                json!({
                    "id": id,
                    "request": request_payload,
                    "createdAtMs": created_at_ms,
                    "expiresAtMs": expires_at_ms,
                }),
            )
            .await;

            let decision = match tokio::time::timeout(
                std::time::Duration::from_millis(timeout_ms),
                rx,
            )
            .await
            {
                Ok(Ok(decision)) => decision,
                _ => "deny".to_string(),
            };
            {
                let mut guard = pending_exec_approvals().lock().await;
                guard.remove(&id);
            }
            send_ok(
                socket,
                &request.id,
                json!({
                    "id": id,
                    "decision": decision,
                    "createdAtMs": created_at_ms,
                    "expiresAtMs": expires_at_ms,
                }),
            )
            .await
        }

        "exec.approval.resolve" => {
            let params =
                match serde_json::from_value::<ExecApprovalResolveParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid exec.approval.resolve params",
                        )
                        .await;
                    }
                };
            let decision = params.decision.trim().to_string();
            if !matches!(decision.as_str(), "allow-once" | "allow-always" | "deny") {
                return send_error(socket, &request.id, "bad_request", "invalid decision").await;
            }
            let pending = {
                let mut guard = pending_exec_approvals().lock().await;
                guard.remove(&params.id)
            };
            let Some(pending) = pending else {
                return send_error(socket, &request.id, "bad_request", "unknown approval id").await;
            };
            let _ = pending.resolver.send(decision.clone());
            let _ = send_event(
                state,
                socket,
                &auth.subject,
                "exec.approval.resolved",
                json!({
                    "id": params.id,
                    "decision": decision,
                    "request": pending.request,
                    "createdAtMs": pending.created_at_ms,
                    "expiresAtMs": pending.expires_at_ms,
                    "ts": now_ms(),
                }),
            )
            .await;
            send_ok(
                socket,
                &request.id,
                json!({
                    "ok": true,
                    "id": params.id,
                    "decision": decision,
                    "createdAtMs": pending.created_at_ms,
                    "expiresAtMs": pending.expires_at_ms,
                }),
            )
            .await
        }

        "nodes.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::nodes::list_nodes(State(state.clone())).await,
            )
            .await
        }

        "node.describe" => {
            let params = match serde_json::from_value::<NodeDescribeParams>(request.params.clone())
            {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid node.describe params",
                    )
                    .await;
                }
            };
            let node_id = params
                .node_id
                .or(params.node_key)
                .unwrap_or_default()
                .trim()
                .to_string();
            if node_id.is_empty() {
                return send_error(socket, &request.id, "bad_request", "nodeId is required").await;
            }
            let row = sqlx::query_as::<_, (String, Option<String>, String, Value)>(
                "select node_key, display_name, pairing_status, capabilities from nodes where node_key = $1 or id::text = $1 limit 1",
            )
            .bind(&node_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|_| ())?;
            let Some((node_key, display_name, pairing_status, capabilities)) = row else {
                return send_error(socket, &request.id, "not_found", "unknown nodeId").await;
            };
            send_ok(
                socket,
                &request.id,
                json!({
                    "ts": now_ms(),
                    "nodeId": node_key,
                    "displayName": display_name,
                    "caps": collect_string_array(capabilities.get("caps")),
                    "commands": collect_string_array(capabilities.get("commands")),
                    "permissions": capabilities.get("permissions").cloned().unwrap_or(Value::Null),
                    "paired": pairing_status == "approved",
                    "connected": false,
                }),
            )
            .await
        }

        "node.invoke" => {
            let params = match serde_json::from_value::<NodeInvokeParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid node.invoke params",
                    )
                    .await;
                }
            };
            let node_id = params
                .node_id
                .or(params.node_key)
                .unwrap_or_default()
                .trim()
                .to_string();
            let command = params.command.unwrap_or_default().trim().to_string();
            if node_id.is_empty() || command.is_empty() {
                return send_error(
                    socket,
                    &request.id,
                    "bad_request",
                    "nodeId and command are required",
                )
                .await;
            }
            let row = sqlx::query_as::<_, (String, Value)>(
                "select pairing_status, capabilities from nodes where node_key = $1 or id::text = $1 limit 1",
            )
            .bind(&node_id)
            .fetch_optional(&state.pool)
            .await
            .map_err(|_| ())?;
            let Some((pairing_status, _capabilities)) = row else {
                return send_error(socket, &request.id, "not_found", "unknown nodeId").await;
            };
            if pairing_status != "approved" {
                return send_error(socket, &request.id, "unavailable", "node not paired").await;
            }

            if command == "system.execApprovals.get" {
                let guard = exec_approvals_nodes_store().read().await;
                let file = guard
                    .get(&node_id)
                    .cloned()
                    .unwrap_or_else(default_exec_approvals_file);
                return send_ok(
                    socket,
                    &request.id,
                    json!({
                        "ok": true,
                        "nodeId": node_id,
                        "command": command,
                        "payload": {
                            "path": format!("node:{node_id}:exec-approvals.json"),
                            "exists": true,
                            "hash": hash_value(&file),
                            "file": file,
                        }
                    }),
                )
                .await;
            }

            if command == "system.execApprovals.set" {
                let obj = params.params.unwrap_or_else(|| json!({}));
                let Some(file) = obj.get("file").cloned().filter(|value| value.is_object()) else {
                    return send_error(socket, &request.id, "bad_request", "file is required")
                        .await;
                };
                let Some(base_hash) = obj
                    .get("baseHash")
                    .and_then(Value::as_str)
                    .map(ToString::to_string)
                else {
                    return send_error(socket, &request.id, "bad_request", "baseHash is required")
                        .await;
                };
                let mut guard = exec_approvals_nodes_store().write().await;
                let current = guard
                    .get(&node_id)
                    .cloned()
                    .unwrap_or_else(default_exec_approvals_file);
                if base_hash != hash_value(&current) {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "exec approvals changed; reload and retry",
                    )
                    .await;
                }
                guard.insert(node_id.clone(), file.clone());
                return send_ok(
                    socket,
                    &request.id,
                    json!({
                        "ok": true,
                        "nodeId": node_id,
                        "command": command,
                        "payload": {
                            "path": format!("node:{node_id}:exec-approvals.json"),
                            "exists": true,
                            "hash": hash_value(&file),
                            "file": file,
                        }
                    }),
                )
                .await;
            }

            if command == "system.ping" {
                return send_ok(
                    socket,
                    &request.id,
                    json!({
                        "ok": true,
                        "nodeId": node_id,
                        "command": command,
                        "payload": {
                            "pong": true,
                            "ts": now_ms(),
                        },
                    }),
                )
                .await;
            }

            let _ = params.timeout_ms;
            let _ = params.idempotency_key;
            send_error(
                socket,
                &request.id,
                "unavailable",
                "node not connected; invoke is not available in Rust runtime yet",
            )
            .await
        }

        "node.event" => {
            let params = match serde_json::from_value::<NodeEventParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid node.event params",
                    )
                    .await;
                }
            };
            let event = params.event.unwrap_or_default().trim().to_string();
            if event.is_empty() {
                return send_error(socket, &request.id, "bad_request", "event is required").await;
            }
            let node_id = params
                .node_id
                .or(params.node_key)
                .unwrap_or_else(|| "node".to_string());
            let payload = if let Some(raw) = params.payload_json {
                serde_json::from_str::<Value>(&raw).unwrap_or(Value::String(raw))
            } else {
                params.payload.unwrap_or(Value::Null)
            };
            let _ = sqlx::query(
                "insert into audit_logs (category, action, actor, details) values ('nodes', 'event', $1, $2)",
            )
            .bind(&node_id)
            .bind(json!({
                "event": event,
                "payload": payload,
            }))
            .execute(&state.pool)
            .await;
            let _ = send_event(
                state,
                socket,
                &auth.subject,
                &event,
                json!({
                    "nodeId": node_id,
                    "payload": payload,
                }),
            )
            .await;
            send_ok(socket, &request.id, json!({"ok": true})).await
        }

        "nodes.pair.request" => {
            let params =
                match serde_json::from_value::<NodePairRequestParams>(request.params.clone()) {
                    Ok(params) => params,
                    Err(_) => {
                        return send_error(
                            socket,
                            &request.id,
                            "bad_request",
                            "invalid nodes.pair.request params",
                        )
                        .await;
                    }
                };

            let node_key = params
                .node_key
                .or(params.node_id)
                .unwrap_or_default()
                .trim()
                .to_string();

            if node_key.is_empty() {
                return send_error(socket, &request.id, "bad_request", "nodeKey is required").await;
            }

            let capabilities = if let Some(capabilities) = params.capabilities {
                Some(capabilities)
            } else {
                let mut map = serde_json::Map::new();
                if let Some(caps) = params.caps {
                    map.insert("caps".to_string(), json!(caps));
                }
                if let Some(commands) = params.commands {
                    map.insert("commands".to_string(), json!(commands));
                }
                if map.is_empty() {
                    None
                } else {
                    Some(Value::Object(map))
                }
            };

            send_api_result(
                socket,
                &request.id,
                routes::nodes::request_pairing(
                    State(state.clone()),
                    Json(routes::nodes::PairingRequestPayload {
                        node_key,
                        display_name: params.display_name,
                        capabilities,
                    }),
                )
                .await,
            )
            .await
        }

        "nodes.pair.approve" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id.or(params.request_id) else {
                return send_error(socket, &request.id, "bad_request", "requestId is required")
                    .await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::nodes::approve_pairing(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "nodes.pair.reject" => {
            let params =
                serde_json::from_value::<UuidIdParams>(request.params.clone()).unwrap_or_default();
            let Some(id) = params.id.or(params.request_id) else {
                return send_error(socket, &request.id, "bad_request", "requestId is required")
                    .await;
            };

            send_api_result(
                socket,
                &request.id,
                routes::nodes::reject_pairing(State(state.clone()), Path(id)).await,
            )
            .await
        }

        "nodes.verify" => {
            let params = match serde_json::from_value::<NodeVerifyParams>(request.params.clone()) {
                Ok(params) => params,
                Err(_) => {
                    return send_error(
                        socket,
                        &request.id,
                        "bad_request",
                        "invalid nodes.verify params",
                    )
                    .await;
                }
            };

            let node_key = params
                .node_key
                .or(params.node_id)
                .unwrap_or_default()
                .trim()
                .to_string();
            if node_key.is_empty() {
                return send_error(socket, &request.id, "bad_request", "nodeKey is required").await;
            }

            send_api_result(
                socket,
                &request.id,
                routes::nodes::verify_node(
                    State(state.clone()),
                    Json(routes::nodes::VerifyNodePayload {
                        node_key,
                        token: params.token,
                    }),
                )
                .await,
            )
            .await
        }

        "node.invoke.result"
        | "node.pair.list"
        | "node.rename"
        | "device.pair.list"
        | "device.pair.approve"
        | "device.pair.reject"
        | "device.token.rotate"
        | "device.token.revoke" => {
            match routes::ws_methods::nodes_device::dispatch(state, method, request.params.clone())
                .await
            {
                Some(Ok(payload)) => send_ok(socket, &request.id, payload).await,
                Some(Err(error)) => send_ws_method_error(socket, &request.id, error).await,
                None => send_error(socket, &request.id, "method_not_found", "unknown method").await,
            }
        }

        _ => send_error(socket, &request.id, "method_not_found", "unknown method").await,
    }
}

fn build_cron_create_request(params: CronCreateParams) -> Result<CronCreateRequest, String> {
    let name = params
        .name
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "name is required".to_string())?
        .to_string();

    let (schedule_kind, schedule_expr) = if let (Some(kind), Some(expr)) = (
        params.schedule_kind.as_deref().map(str::trim),
        params.schedule_expr.as_deref().map(str::trim),
    ) {
        if kind.is_empty() || expr.is_empty() {
            return Err("scheduleKind and scheduleExpr are required".to_string());
        }
        (kind.to_string(), expr.to_string())
    } else if let Some(schedule) = params.schedule.as_ref() {
        let kind = schedule
            .get("kind")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .trim()
            .to_lowercase();

        match kind.as_str() {
            "every" => {
                let every_ms = schedule
                    .get("everyMs")
                    .or_else(|| schedule.get("every_ms"))
                    .and_then(Value::as_i64)
                    .unwrap_or(60_000)
                    .max(1);
                let seconds = (every_ms / 1_000).max(1);
                ("every".to_string(), seconds.to_string())
            }
            "cron" => {
                let expr = schedule
                    .get("expr")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .trim()
                    .to_string();
                if expr.is_empty() {
                    return Err("schedule.expr is required for cron schedules".to_string());
                }
                ("cron".to_string(), expr)
            }
            "at" => {
                let at = schedule
                    .get("at")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .trim()
                    .to_string();
                if at.is_empty() {
                    return Err("schedule.at is required for at schedules".to_string());
                }
                ("at".to_string(), at)
            }
            _ => {
                return Err(
                    "schedule kind must be one of: every, cron, at; or provide scheduleKind/scheduleExpr"
                        .to_string(),
                )
            }
        }
    } else {
        return Err("scheduleKind and scheduleExpr are required".to_string());
    };

    let payload_value = params
        .payload
        .unwrap_or_else(|| Value::Object(Default::default()));
    let message = payload_value
        .get("message")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
        .or_else(|| {
            if payload_value.get("kind").and_then(Value::as_str) == Some("systemEvent") {
                payload_value
                    .get("text")
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(ToString::to_string)
            } else if payload_value.get("kind").and_then(Value::as_str) == Some("agentTurn") {
                payload_value
                    .get("message")
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(ToString::to_string)
            } else {
                None
            }
        })
        .unwrap_or_else(|| "Scheduled cron run".to_string());

    Ok(CronCreateRequest {
        name,
        schedule_kind,
        schedule_expr,
        timezone: params.timezone,
        payload: CronJobPayload { message },
        session_target: params.session_target.unwrap_or_else(|| "main".to_string()),
        delivery_mode: params.delivery_mode,
    })
}

async fn resolve_or_create_session_with_refs(
    state: &AppState,
    session_id: Option<Uuid>,
    session_key: Option<String>,
) -> Result<SessionRow, ApiError> {
    if let Some(id) = session_id {
        let session = sqlx::query_as::<_, SessionRow>(
            "select id, title, created_at, updated_at from sessions where id = $1",
        )
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;
        return Ok(session);
    }

    let normalized_key = session_key
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string);

    if let Some(key) = normalized_key {
        if let Some(session) = sqlx::query_as::<_, SessionRow>(
            "select id, title, created_at, updated_at from sessions where session_key = $1",
        )
        .bind(&key)
        .fetch_optional(&state.pool)
        .await?
        {
            sqlx::query("update sessions set updated_at = now() where id = $1")
                .bind(session.id)
                .execute(&state.pool)
                .await?;
            return Ok(session);
        }

        let created = sqlx::query_as::<_, SessionRow>(
            r#"
            insert into sessions (title, session_key)
            values ($1, $2)
            on conflict (session_key)
            do update set updated_at = now()
            returning id, title, created_at, updated_at
            "#,
        )
        .bind(Some(key.clone()))
        .bind(key)
        .fetch_one(&state.pool)
        .await?;

        return Ok(created);
    }

    resolve_or_create_session(state, None).await
}

async fn resolve_or_create_session(
    state: &AppState,
    session_id: Option<Uuid>,
) -> Result<SessionRow, ApiError> {
    if let Some(id) = session_id {
        let session = sqlx::query_as::<_, SessionRow>(
            "select id, title, created_at, updated_at from sessions where id = $1",
        )
        .bind(id)
        .fetch_optional(&state.pool)
        .await?
        .ok_or(ApiError::NotFound)?;
        return Ok(session);
    }

    if let Some(existing) = sqlx::query_as::<_, SessionRow>(
        "select id, title, created_at, updated_at from sessions order by updated_at desc limit 1",
    )
    .fetch_optional(&state.pool)
    .await?
    {
        return Ok(existing);
    }

    let created = sqlx::query_as::<_, SessionRow>(
        r#"
        insert into sessions (title)
        values (null)
        returning id, title, created_at, updated_at
        "#,
    )
    .fetch_one(&state.pool)
    .await?;

    Ok(created)
}

async fn lookup_session_key(
    state: &AppState,
    session_id: Uuid,
) -> Result<Option<String>, ApiError> {
    let row =
        sqlx::query_scalar::<_, Option<String>>("select session_key from sessions where id = $1")
            .bind(session_id)
            .fetch_one(&state.pool)
            .await?;

    Ok(row)
}

fn chat_send_fingerprint(
    session_id: Uuid,
    prompt: &str,
    model: Option<&str>,
    fallback_models: Option<&Vec<String>>,
    confirmed: Option<bool>,
) -> String {
    let material = json!({
        "sessionId": session_id,
        "prompt": prompt.trim(),
        "model": model.map(str::trim),
        "fallbackModels": fallback_models,
        "confirmed": confirmed.unwrap_or(false),
    });
    hash_value(&material)
}

async fn claim_or_load_idempotency(
    state: &AppState,
    auth_subject: &str,
    method: &str,
    idempotency_key: &str,
    request_hash: &str,
) -> Result<Option<Value>, ApiError> {
    sqlx::query(
        r#"
        delete from gateway_idempotency_keys
        where auth_subject = $1
          and method = $2
          and idempotency_key = $3
          and expires_at <= now()
        "#,
    )
    .bind(auth_subject)
    .bind(method)
    .bind(idempotency_key)
    .execute(&state.pool)
    .await?;

    let inserted = sqlx::query(
        r#"
        insert into gateway_idempotency_keys (
            auth_subject,
            method,
            idempotency_key,
            request_hash,
            status,
            expires_at
        )
        values ($1, $2, $3, $4, 'in_progress', now() + make_interval(secs => $5::int))
        on conflict (auth_subject, method, idempotency_key) do nothing
        "#,
    )
    .bind(auth_subject)
    .bind(method)
    .bind(idempotency_key)
    .bind(request_hash)
    .bind(state.config.idempotency_ttl_secs)
    .execute(&state.pool)
    .await?;

    if inserted.rows_affected() > 0 {
        return Ok(None);
    }

    let row = sqlx::query_as::<_, IdempotencyRecordRow>(
        r#"
        select request_hash, run_id, response_payload
        from gateway_idempotency_keys
        where auth_subject = $1 and method = $2 and idempotency_key = $3
        "#,
    )
    .bind(auth_subject)
    .bind(method)
    .bind(idempotency_key)
    .fetch_optional(&state.pool)
    .await?;

    let Some(row) = row else {
        return Ok(None);
    };

    if row.request_hash != request_hash {
        return Err(ApiError::BadRequest(
            "idempotency key was already used with a different payload".to_string(),
        ));
    }

    if let Some(payload) = row.response_payload {
        return Ok(Some(payload));
    }

    Ok(Some(json!({
        "status": "in_progress",
        "runId": row.run_id,
    })))
}

async fn store_idempotency_response(
    state: &AppState,
    auth_subject: &str,
    method: &str,
    idempotency_key: &str,
    run_id: Uuid,
    response_payload: Value,
) -> Result<(), ApiError> {
    sqlx::query(
        r#"
        update gateway_idempotency_keys
        set run_id = $4,
            response_payload = $5,
            status = 'completed',
            updated_at = now(),
            expires_at = now() + make_interval(secs => $6::int)
        where auth_subject = $1 and method = $2 and idempotency_key = $3
        "#,
    )
    .bind(auth_subject)
    .bind(method)
    .bind(idempotency_key)
    .bind(run_id)
    .bind(response_payload)
    .bind(state.config.idempotency_ttl_secs)
    .execute(&state.pool)
    .await?;
    Ok(())
}

async fn create_chat_run_record(
    state: &AppState,
    session_id: Uuid,
    prompt: &str,
    idempotency_key: Option<String>,
) -> Result<Uuid, ApiError> {
    let run_id = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into chat_runs (session_id, prompt, status, output, metadata)
        values ($1, $2, 'running', '', $3)
        returning id
        "#,
    )
    .bind(session_id)
    .bind(prompt)
    .bind(json!({
        "idempotency_key": idempotency_key
    }))
    .fetch_one(&state.pool)
    .await?
    .0;

    Ok(run_id)
}

async fn execute_chat_run(
    state: &AppState,
    run_id: Uuid,
    session_id: Uuid,
    prompt: String,
    model: Option<String>,
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    idempotency_key: Option<String>,
) -> Result<ChatRunResult, ApiError> {
    let prompt = prompt.trim().to_string();
    let cancellation_guard = state.run_cancellations.register(run_id);

    let needs_confirmation = confirmation_required(&prompt, confirmed);
    if needs_confirmation {
        let output = "Confirmation required: this request appears to include destructive or high-impact operations. Re-send with `confirmed: true` to continue.";
        let status = "needs_confirmation".to_string();
        let model_used = "none".to_string();

        let updated = sqlx::query(
            r#"
            update chat_runs
            set status = $2, output = $3, metadata = $4, updated_at = now()
            where id = $1 and status = 'running'
            "#,
        )
        .bind(run_id)
        .bind(&status)
        .bind(output)
        .bind(json!({
            "model_used": model_used,
            "attempts": [],
            "requires_confirmation": true,
            "idempotency_key": idempotency_key
        }))
        .execute(&state.pool)
        .await?;

        if updated.rows_affected() == 0 {
            return Ok(ChatRunResult {
                run_id,
                session_id,
                status: "aborted".to_string(),
                model_used,
                output: String::new(),
                requires_confirmation: false,
            });
        }

        sqlx::query(
            r#"
            insert into session_messages (session_id, role, text)
            values ($1, 'user', $2), ($1, 'assistant', $3)
            "#,
        )
        .bind(session_id)
        .bind(&prompt)
        .bind(output)
        .execute(&state.pool)
        .await?;

        sqlx::query("update sessions set updated_at = now() where id = $1")
            .bind(session_id)
            .execute(&state.pool)
            .await?;

        return Ok(ChatRunResult {
            run_id,
            session_id,
            status,
            model_used,
            output: output.to_string(),
            requires_confirmation: true,
        });
    }

    let generation = model_runtime::generate_with_failover_cancellable(
        state,
        &prompt,
        model,
        fallback_models,
        Some(cancellation_guard.token()),
    )
    .await;

    let (model_used, output, attempts, status) = match generation {
        Ok(result) => (
            result.model_used,
            result.output,
            serde_json::to_value(result.attempts).unwrap_or_else(|_| Value::Array(Vec::new())),
            "done".to_string(),
        ),
        Err(model_runtime::ModelGenerationError::Cancelled { attempts }) => (
            "none".to_string(),
            String::new(),
            serde_json::to_value(attempts).unwrap_or_else(|_| Value::Array(Vec::new())),
            "aborted".to_string(),
        ),
        Err(model_runtime::ModelGenerationError::Api(error)) => (
            "none".to_string(),
            format!("Model generation failed: {error}"),
            Value::Array(Vec::new()),
            "error".to_string(),
        ),
    };

    let metadata = json!({
        "model_used": model_used,
        "attempts": attempts,
        "idempotency_key": idempotency_key
    });
    let updated = if status == "aborted" {
        sqlx::query(
            r#"
            update chat_runs
            set status = $2, output = $3, metadata = $4, updated_at = now()
            where id = $1 and status in ('running', 'aborted')
            "#,
        )
        .bind(run_id)
        .bind(&status)
        .bind(&output)
        .bind(&metadata)
        .execute(&state.pool)
        .await?
    } else {
        sqlx::query(
            r#"
            update chat_runs
            set status = $2, output = $3, metadata = $4, updated_at = now()
            where id = $1 and status = 'running'
            "#,
        )
        .bind(run_id)
        .bind(&status)
        .bind(&output)
        .bind(&metadata)
        .execute(&state.pool)
        .await?
    };

    if updated.rows_affected() == 0 {
        return Ok(ChatRunResult {
            run_id,
            session_id,
            status: "aborted".to_string(),
            model_used: "none".to_string(),
            output: String::new(),
            requires_confirmation: false,
        });
    }

    if status == "aborted" {
        sqlx::query(
            r#"
            insert into session_messages (session_id, role, text)
            values ($1, 'user', $2)
            "#,
        )
        .bind(session_id)
        .bind(&prompt)
        .execute(&state.pool)
        .await?;
    } else {
        sqlx::query(
            r#"
            insert into session_messages (session_id, role, text)
            values ($1, 'user', $2), ($1, 'assistant', $3)
            "#,
        )
        .bind(session_id)
        .bind(&prompt)
        .bind(&output)
        .execute(&state.pool)
        .await?;
    }

    sqlx::query("update sessions set updated_at = now() where id = $1")
        .bind(session_id)
        .execute(&state.pool)
        .await?;

    Ok(ChatRunResult {
        run_id,
        session_id,
        status,
        model_used,
        output,
        requires_confirmation: false,
    })
}

async fn run_chat_task(state: AppState, socket: SharedSocketWriter, task: ChatRunTask) {
    let mut seq = 0_i64;
    if send_event(
        &state,
        &socket,
        &task.auth_subject,
        "chat",
        json!({
            "kind": "run.started",
            "runId": task.run_id,
            "sessionId": task.session_id,
            "sessionKey": task.session_key,
            "seq": seq,
        }),
    )
    .await
    .is_err()
    {
        return;
    }

    let run = match execute_chat_run(
        &state,
        task.run_id,
        task.session_id,
        task.prompt,
        task.model,
        task.fallback_models,
        task.confirmed,
        task.idempotency_key.clone(),
    )
    .await
    {
        Ok(run) => run,
        Err(error) => {
            tracing::error!("chat.send failed: {error}");
            let error_message = format!("Failed to execute chat run: {error}");
            let _ = sqlx::query(
                r#"
                update chat_runs
                set status = 'error', output = $2, metadata = $3, updated_at = now()
                where id = $1 and status = 'running'
                "#,
            )
            .bind(task.run_id)
            .bind(&error_message)
            .bind(json!({
                "model_used": "none",
                "attempts": [],
                "idempotency_key": task.idempotency_key,
                "error": error_message
            }))
            .execute(&state.pool)
            .await;

            seq += 1;
            let _ = send_event(
                &state,
                &socket,
                &task.auth_subject,
                "chat",
                json!({
                    "kind": "run.finished",
                    "runId": task.run_id,
                    "sessionId": task.session_id,
                    "sessionKey": task.session_key,
                    "status": "error",
                    "modelUsed": "none",
                    "requiresConfirmation": false,
                    "output": "",
                    "state": "error",
                    "errorMessage": error_message,
                    "seq": seq,
                }),
            )
            .await;
            return;
        }
    };

    if run.status == "aborted" {
        let _ = send_event(
            &state,
            &socket,
            &task.auth_subject,
            "chat",
            json!({
                "kind": "run.aborted",
                "runId": run.run_id,
                "sessionId": run.session_id,
                "sessionKey": task.session_key,
                "state": "aborted",
            }),
        )
        .await;
        return;
    }

    for token in run.output.split_whitespace() {
        seq += 1;
        if send_event(
            &state,
            &socket,
            &task.auth_subject,
            "chat",
            json!({
                "kind": "delta",
                "runId": run.run_id,
                "sessionId": run.session_id,
                "sessionKey": task.session_key,
                "text": format!("{token} "),
                "state": "delta",
                "seq": seq,
            }),
        )
        .await
        .is_err()
        {
            return;
        }
    }

    seq += 1;
    let event_state = if run.requires_confirmation || run.status == "error" {
        "error"
    } else {
        "final"
    };
    let output = run.output;
    let output_for_message = output.clone();
    let output_for_error = output.clone();

    let mut payload = json!({
        "kind": "run.finished",
        "runId": run.run_id,
        "sessionId": run.session_id,
        "sessionKey": task.session_key,
        "status": run.status,
        "modelUsed": run.model_used,
        "requiresConfirmation": run.requires_confirmation,
        "output": output,
        "state": event_state,
        "seq": seq,
        "message": {
            "role": "assistant",
            "content": [{"type": "text", "text": output_for_message}],
        }
    });
    if event_state == "error" {
        payload["errorMessage"] = Value::String(output_for_error);
    }

    let _ = send_event(&state, &socket, &task.auth_subject, "chat", payload).await;
}

fn api_error_to_wire(error: &ApiError) -> (&'static str, String) {
    match error {
        ApiError::NotFound => ("not_found", "not found".to_string()),
        ApiError::Unauthorized => ("unauthorized", "unauthorized".to_string()),
        ApiError::Forbidden(message) => ("forbidden", message.clone()),
        ApiError::BadRequest(message) => ("bad_request", message.clone()),
        ApiError::RateLimited { retry_after_secs } => (
            "rate_limited",
            format!("rate limited; retry after {retry_after_secs}s"),
        ),
        ApiError::Database(db) => ("request_failed", db.to_string()),
        ApiError::Anyhow(anyhow) => ("request_failed", anyhow.to_string()),
    }
}

async fn send_api_error(socket: &SharedSocketWriter, id: &str, error: ApiError) -> Result<(), ()> {
    let (code, message) = api_error_to_wire(&error);
    send_error(socket, id, code, &message).await
}

async fn send_ws_method_error(
    socket: &SharedSocketWriter,
    id: &str,
    error: routes::ws_methods::WsMethodError,
) -> Result<(), ()> {
    match error {
        routes::ws_methods::WsMethodError::InvalidRequest(message) => {
            send_error(socket, id, "invalid_request", &message).await
        }
        routes::ws_methods::WsMethodError::Unavailable(message) => {
            send_error(socket, id, "unavailable", &message).await
        }
        routes::ws_methods::WsMethodError::Api(error) => send_api_error(socket, id, error).await,
    }
}

async fn send_api_result<T: Serialize>(
    socket: &SharedSocketWriter,
    id: &str,
    result: Result<Json<T>, ApiError>,
) -> Result<(), ()> {
    match result {
        Ok(Json(payload)) => send_ok(socket, id, json!(payload)).await,
        Err(error) => send_api_error(socket, id, error).await,
    }
}

async fn send_ok(socket: &SharedSocketWriter, id: &str, payload: Value) -> Result<(), ()> {
    let envelope = json!({
        "type": "res",
        "id": id,
        "ok": true,
        "payload": payload
    });
    let mut writer = socket.lock().await;
    writer
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}

async fn send_error(
    socket: &SharedSocketWriter,
    id: &str,
    code: &str,
    message: &str,
) -> Result<(), ()> {
    let envelope = json!({
        "type": "res",
        "id": id,
        "ok": false,
        "error": {
            "code": code,
            "message": message
        }
    });
    let mut writer = socket.lock().await;
    writer
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}

async fn latest_event_cursor(state: &AppState, auth_subject: &str) -> Result<i64, ApiError> {
    let cursor = sqlx::query_scalar::<_, Option<i64>>(
        "select max(id) from gateway_ws_events where auth_subject = $1",
    )
    .bind(auth_subject)
    .fetch_one(&state.pool)
    .await?
    .unwrap_or(0);

    Ok(cursor)
}

async fn replay_ws_events(
    state: &AppState,
    socket: &SharedSocketWriter,
    auth_subject: &str,
    after_cursor: i64,
    limit: i64,
) -> Result<usize, ()> {
    let rows = sqlx::query_as::<_, StoredWsEvent>(
        r#"
        select id, event, payload
        from gateway_ws_events
        where auth_subject = $1
          and id > $2
        order by id asc
        limit $3
        "#,
    )
    .bind(auth_subject)
    .bind(after_cursor)
    .bind(limit)
    .fetch_all(&state.pool)
    .await
    .map_err(|_| ())?;

    for row in &rows {
        send_event_envelope(socket, &row.event, row.payload.clone(), row.id).await?;
    }

    Ok(rows.len())
}

async fn persist_ws_event(
    state: &AppState,
    auth_subject: &str,
    event: &str,
    payload: &Value,
) -> Result<i64, ApiError> {
    let run_id = payload
        .get("runId")
        .and_then(Value::as_str)
        .and_then(|value| Uuid::parse_str(value).ok());
    let session_id = payload
        .get("sessionId")
        .and_then(Value::as_str)
        .and_then(|value| Uuid::parse_str(value).ok());

    let cursor = sqlx::query_scalar::<_, i64>(
        r#"
        insert into gateway_ws_events (auth_subject, event, run_id, session_id, payload)
        values ($1, $2, $3, $4, $5)
        returning id
        "#,
    )
    .bind(auth_subject)
    .bind(event)
    .bind(run_id)
    .bind(session_id)
    .bind(payload)
    .fetch_one(&state.pool)
    .await?;

    Ok(cursor)
}

async fn send_event_envelope(
    socket: &SharedSocketWriter,
    event: &str,
    payload: Value,
    cursor: i64,
) -> Result<(), ()> {
    let envelope = json!({
        "type": "event",
        "event": event,
        "cursor": cursor,
        "payload": payload
    });
    let mut writer = socket.lock().await;
    writer
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}

async fn send_event(
    state: &AppState,
    socket: &SharedSocketWriter,
    auth_subject: &str,
    event: &str,
    payload: Value,
) -> Result<(), ()> {
    let cursor = persist_ws_event(state, auth_subject, event, &payload)
        .await
        .map_err(|_| ())?;
    state.metrics.inc_ws_event(event);
    send_event_envelope(socket, event, payload, cursor).await
}

async fn close_socket(socket: &SharedSocketWriter) -> Result<(), ()> {
    let mut writer = socket.lock().await;
    writer.send(Message::Close(None)).await.map_err(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn ws_method_matrix_supports_map_and_openclaw_aliases() {
        let matrix = [
            ("logs.tail", "logs.tail"),
            ("logs/tail", "logs.tail"),
            ("config.get", "config.get"),
            ("config/get", "config.get"),
            ("config.schema", "config.schema"),
            ("config/schema", "config.schema"),
            ("config.set", "config.set"),
            ("config/set", "config.set"),
            ("wizard.start", "wizard.start"),
            ("wizard/start", "wizard.start"),
            ("wizard.next", "wizard.next"),
            ("wizard/next", "wizard.next"),
            ("wizard.cancel", "wizard.cancel"),
            ("wizard/cancel", "wizard.cancel"),
            ("wizard.status", "wizard.status"),
            ("wizard/status", "wizard.status"),
            ("agents.list", "agents.list"),
            ("agents/list", "agents.list"),
            ("agents.files.list", "agents.files.list"),
            ("agents/files/list", "agents.files.list"),
            ("agent.wait", "agent.wait"),
            ("agent/wait", "agent.wait"),
            ("agent.send", "send"),
            ("agent/send", "send"),
            ("agent.poll", "poll"),
            ("agent/poll", "poll"),
            ("agent.wake", "wake"),
            ("agent/wake", "wake"),
            ("talk.mode", "talk.mode"),
            ("talk/mode", "talk.mode"),
            ("update.run", "update.run"),
            ("update/run", "update.run"),
            ("channels.logout", "channels.logout"),
            ("channels/logout", "channels.logout"),
            ("exec.approvals.get", "exec.approvals.get"),
            ("exec/approvals/get", "exec.approvals.get"),
            ("exec.approvals.node.get", "exec.approvals.node.get"),
            ("exec/approvals/node/get", "exec.approvals.node.get"),
            ("node.describe", "node.describe"),
            ("node/describe", "node.describe"),
            ("node.invoke", "node.invoke"),
            ("node/invoke", "node.invoke"),
            ("node.event", "node.event"),
            ("node/event", "node.event"),
            ("models.list", "models.list"),
            ("models.get", "models.list"),
            ("models", "models.list"),
            ("skills.list", "skills.list"),
            ("skills.status", "skills.list"),
            ("cron.jobs.list", "cron.jobs.list"),
            ("cron.list", "cron.jobs.list"),
            ("cron.runs.list", "cron.runs.list"),
            ("cron.runs", "cron.runs.list"),
            ("cron.jobs.create", "cron.jobs.create"),
            ("cron.add", "cron.jobs.create"),
            ("cron.jobs.run", "cron.jobs.run"),
            ("cron.run", "cron.jobs.run"),
            ("cron.jobs.delete", "cron.jobs.delete"),
            ("cron.remove", "cron.jobs.delete"),
            ("cron.status", "cron.status"),
            ("cron/status", "cron.status"),
            ("cron.update", "cron.update"),
            ("cron/update", "cron.update"),
            ("channels.resolveSession", "channels.resolveSession"),
            ("channels.resolve-session", "channels.resolveSession"),
            ("channels.resolve_session", "channels.resolveSession"),
            ("nodes.list", "nodes.list"),
            ("node.list", "nodes.list"),
            ("nodes.pair.request", "nodes.pair.request"),
            ("node.pair.request", "nodes.pair.request"),
            ("nodes.pair.approve", "nodes.pair.approve"),
            ("node.pair.approve", "nodes.pair.approve"),
            ("nodes.pair.reject", "nodes.pair.reject"),
            ("node.pair.reject", "nodes.pair.reject"),
            ("nodes.verify", "nodes.verify"),
            ("node.pair.verify", "nodes.verify"),
            ("agent.identity.get", "agent.identity.get"),
            ("agent/identity/get", "agent.identity.get"),
            ("browser.request", "browser.request"),
            ("browser/request", "browser.request"),
            ("device.pair.list", "device.pair.list"),
            ("device/pair/list", "device.pair.list"),
            ("device.pair.approve", "device.pair.approve"),
            ("device/pair/approve", "device.pair.approve"),
            ("device.pair.reject", "device.pair.reject"),
            ("device/pair/reject", "device.pair.reject"),
            ("device.token.rotate", "device.token.rotate"),
            ("device/token/rotate", "device.token.rotate"),
            ("device.token.revoke", "device.token.revoke"),
            ("device/token/revoke", "device.token.revoke"),
            ("last-heartbeat", "last-heartbeat"),
            ("set-heartbeats", "set-heartbeats"),
            ("node.invoke.result", "node.invoke.result"),
            ("node/invoke/result", "node.invoke.result"),
            ("node.pair.list", "node.pair.list"),
            ("node/pair/list", "node.pair.list"),
            ("nodes.pair.list", "node.pair.list"),
            ("node.rename", "node.rename"),
            ("node/rename", "node.rename"),
            ("sessions.compact", "sessions.compact"),
            ("sessions/compact", "sessions.compact"),
            ("sessions.delete", "sessions.delete"),
            ("sessions/delete", "sessions.delete"),
            ("sessions.preview", "sessions.preview"),
            ("sessions/preview", "sessions.preview"),
            ("sessions.usage", "sessions.usage"),
            ("sessions/usage", "sessions.usage"),
            ("sessions.usage.logs", "sessions.usage.logs"),
            ("sessions/usage/logs", "sessions.usage.logs"),
            ("sessions.usage.timeseries", "sessions.usage.timeseries"),
            ("sessions/usage/timeseries", "sessions.usage.timeseries"),
            ("skills.bins", "skills.bins"),
            ("skills/bins", "skills.bins"),
            ("skills.install", "skills.install"),
            ("skills/install", "skills.install"),
            ("skills.update", "skills.update"),
            ("skills/update", "skills.update"),
            ("system-event", "system-event"),
            ("system-presence", "system-presence"),
            ("tts.status", "tts.status"),
            ("tts/status", "tts.status"),
            ("tts.providers", "tts.providers"),
            ("tts/providers", "tts.providers"),
            ("tts.enable", "tts.enable"),
            ("tts/enable", "tts.enable"),
            ("tts.disable", "tts.disable"),
            ("tts/disable", "tts.disable"),
            ("tts.convert", "tts.convert"),
            ("tts/convert", "tts.convert"),
            ("tts.setProvider", "tts.setProvider"),
            ("tts.set-provider", "tts.setProvider"),
            ("tts.set_provider", "tts.setProvider"),
            ("tts/setProvider", "tts.setProvider"),
            ("usage.cost", "usage.cost"),
            ("usage/cost", "usage.cost"),
            ("usage.status", "usage.status"),
            ("usage/status", "usage.status"),
            ("voicewake.get", "voicewake.get"),
            ("voicewake/get", "voicewake.get"),
            ("voicewake.set", "voicewake.set"),
            ("voicewake/set", "voicewake.set"),
            ("web.login.start", "web.login.start"),
            ("web/login/start", "web.login.start"),
            ("web.login.wait", "web.login.wait"),
            ("web/login/wait", "web.login.wait"),
        ];

        for (method, canonical) in matrix {
            assert_eq!(
                canonical_ws_method(method),
                Some(canonical),
                "method `{method}` should resolve to `{canonical}`"
            );
        }

        assert_eq!(canonical_ws_method("not.a.real.method"), None);
    }

    #[test]
    fn openclaw_parity_methods_are_not_unavailable_stubs() {
        let methods = [
            "agent.identity.get",
            "browser.request",
            "cron.status",
            "cron.update",
            "device.pair.list",
            "device.pair.approve",
            "device.pair.reject",
            "device.token.rotate",
            "device.token.revoke",
            "last-heartbeat",
            "node.invoke.result",
            "node.pair.list",
            "node.rename",
            "sessions.compact",
            "sessions.delete",
            "sessions.preview",
            "sessions.usage",
            "sessions.usage.logs",
            "sessions.usage.timeseries",
            "set-heartbeats",
            "skills.bins",
            "skills.install",
            "skills.update",
            "system-event",
            "system-presence",
            "talk.mode",
            "tts.status",
            "tts.providers",
            "tts.enable",
            "tts.disable",
            "tts.convert",
            "tts.setProvider",
            "usage.cost",
            "usage.status",
            "voicewake.get",
            "voicewake.set",
            "web.login.start",
            "web.login.wait",
        ];

        for method in methods {
            assert!(
                !routes::ws_methods::is_unavailable_stub_method(method),
                "`{method}` should not be marked unavailable after parity implementation"
            );
        }
    }

    #[test]
    fn ws_param_aliases_accept_map_and_openclaw_chat_shapes() {
        let session_id = Uuid::now_v7();
        let run_id = Uuid::now_v7();

        let map_send = serde_json::from_value::<ChatSendParams>(json!({
            "sessionId": session_id,
            "sessionKey": "session:main",
            "prompt": "hello",
            "fallbackModels": ["openai:gpt-4o-mini"],
            "idempotencyKey": "map-idem",
            "confirmed": true
        }))
        .expect("map-style chat.send params should parse");
        assert_eq!(map_send.session_id, Some(session_id));
        assert_eq!(map_send.session_key.as_deref(), Some("session:main"));
        assert_eq!(map_send.prompt.as_deref(), Some("hello"));
        assert_eq!(
            map_send.fallback_models,
            Some(vec!["openai:gpt-4o-mini".to_string()])
        );
        assert_eq!(map_send.idempotency_key.as_deref(), Some("map-idem"));
        assert_eq!(map_send.confirmed, Some(true));

        let openclaw_send = serde_json::from_value::<ChatSendParams>(json!({
            "session_id": session_id,
            "session_key": "session:main",
            "message": "hello",
            "fallback_models": ["openai:gpt-4o-mini"],
            "idempotency_key": "openclaw-idem"
        }))
        .expect("openclaw-style chat.send params should parse");
        assert_eq!(openclaw_send.session_id, Some(session_id));
        assert_eq!(openclaw_send.session_key.as_deref(), Some("session:main"));
        assert_eq!(openclaw_send.message.as_deref(), Some("hello"));
        assert_eq!(
            openclaw_send.fallback_models,
            Some(vec!["openai:gpt-4o-mini".to_string()])
        );
        assert_eq!(
            openclaw_send.idempotency_key.as_deref(),
            Some("openclaw-idem")
        );

        let map_history = serde_json::from_value::<ChatHistoryParams>(json!({
            "sessionId": session_id,
            "messageLimit": 64,
            "runLimit": 16
        }))
        .expect("map-style chat.history params should parse");
        assert_eq!(map_history.session_id, Some(session_id));
        assert_eq!(map_history.message_limit, Some(64));
        assert_eq!(map_history.run_limit, Some(16));

        let openclaw_history = serde_json::from_value::<ChatHistoryParams>(json!({
            "session_id": session_id,
            "message_limit": 64,
            "run_limit": 16
        }))
        .expect("openclaw-style chat.history params should parse");
        assert_eq!(openclaw_history.session_id, Some(session_id));
        assert_eq!(openclaw_history.message_limit, Some(64));
        assert_eq!(openclaw_history.run_limit, Some(16));

        let map_abort = serde_json::from_value::<ChatAbortParams>(json!({ "runId": run_id }))
            .expect("map-style chat.abort params should parse");
        assert_eq!(map_abort.run_id, Some(run_id));

        let openclaw_abort = serde_json::from_value::<ChatAbortParams>(json!({ "run_id": run_id }))
            .expect("openclaw-style chat.abort params should parse");
        assert_eq!(openclaw_abort.run_id, Some(run_id));
    }

    #[test]
    fn ws_param_aliases_accept_map_and_openclaw_control_plane_shapes() {
        let session_id = Uuid::now_v7();
        let request_id = Uuid::now_v7();

        let map_sessions = serde_json::from_value::<SessionsResolveParams>(json!({
            "sessionId": session_id,
            "sessionKey": "main"
        }))
        .expect("map-style sessions.resolve params should parse");
        assert_eq!(map_sessions.session_id, Some(session_id));
        assert_eq!(map_sessions.session_key.as_deref(), Some("main"));

        let openclaw_sessions = serde_json::from_value::<SessionsResolveParams>(json!({
            "session_id": session_id,
            "session_key": "main"
        }))
        .expect("openclaw-style sessions.resolve params should parse");
        assert_eq!(openclaw_sessions.session_id, Some(session_id));
        assert_eq!(openclaw_sessions.session_key.as_deref(), Some("main"));

        let map_cron = serde_json::from_value::<CronCreateParams>(json!({
            "name": "sync",
            "scheduleKind": "every",
            "scheduleExpr": "60",
            "sessionTarget": "main",
            "deliveryMode": "none"
        }))
        .expect("map-style cron params should parse");
        assert_eq!(map_cron.schedule_kind.as_deref(), Some("every"));
        assert_eq!(map_cron.schedule_expr.as_deref(), Some("60"));
        assert_eq!(map_cron.session_target.as_deref(), Some("main"));
        assert_eq!(map_cron.delivery_mode.as_deref(), Some("none"));

        let openclaw_cron = serde_json::from_value::<CronCreateParams>(json!({
            "name": "sync",
            "schedule_kind": "every",
            "schedule_expr": "60",
            "session_target": "main",
            "delivery_mode": "none"
        }))
        .expect("openclaw-style cron params should parse");
        assert_eq!(openclaw_cron.schedule_kind.as_deref(), Some("every"));
        assert_eq!(openclaw_cron.schedule_expr.as_deref(), Some("60"));
        assert_eq!(openclaw_cron.session_target.as_deref(), Some("main"));
        assert_eq!(openclaw_cron.delivery_mode.as_deref(), Some("none"));

        let map_resolve = serde_json::from_value::<ChannelsResolveSessionParams>(json!({
            "provider": "telegram",
            "peerKind": "dm",
            "peerId": "alice",
            "accountKey": "acc",
            "threadId": "thread",
            "dmScope": "main",
            "identityKey": "identity",
            "agentId": "main",
            "mainKey": "main"
        }))
        .expect("map-style channels.resolveSession params should parse");
        assert_eq!(map_resolve.peer_kind, "dm");
        assert_eq!(map_resolve.peer_id, "alice");
        assert_eq!(map_resolve.account_key.as_deref(), Some("acc"));
        assert_eq!(map_resolve.thread_id.as_deref(), Some("thread"));
        assert_eq!(map_resolve.dm_scope.as_deref(), Some("main"));
        assert_eq!(map_resolve.identity_key.as_deref(), Some("identity"));
        assert_eq!(map_resolve.agent_id.as_deref(), Some("main"));
        assert_eq!(map_resolve.main_key.as_deref(), Some("main"));

        let openclaw_resolve = serde_json::from_value::<ChannelsResolveSessionParams>(json!({
            "provider": "telegram",
            "peer_kind": "dm",
            "peer_id": "alice",
            "account_key": "acc",
            "thread_id": "thread",
            "dm_scope": "main",
            "identity_key": "identity",
            "agent_id": "main",
            "main_key": "main"
        }))
        .expect("openclaw-style channels.resolveSession params should parse");
        assert_eq!(openclaw_resolve.peer_kind, "dm");
        assert_eq!(openclaw_resolve.peer_id, "alice");
        assert_eq!(openclaw_resolve.account_key.as_deref(), Some("acc"));
        assert_eq!(openclaw_resolve.thread_id.as_deref(), Some("thread"));
        assert_eq!(openclaw_resolve.dm_scope.as_deref(), Some("main"));
        assert_eq!(openclaw_resolve.identity_key.as_deref(), Some("identity"));
        assert_eq!(openclaw_resolve.agent_id.as_deref(), Some("main"));
        assert_eq!(openclaw_resolve.main_key.as_deref(), Some("main"));

        let map_inbound = serde_json::from_value::<ChannelsInboundParams>(json!({
            "provider": "telegram",
            "peerKind": "dm",
            "peerId": "alice",
            "text": "hello",
            "dmPolicy": "open",
            "fallbackModels": ["openai:gpt-4o-mini"]
        }))
        .expect("map-style channels.inbound params should parse");
        assert_eq!(map_inbound.dm_policy.as_deref(), Some("open"));
        assert_eq!(
            map_inbound.fallback_models,
            Some(vec!["openai:gpt-4o-mini".to_string()])
        );

        let openclaw_inbound = serde_json::from_value::<ChannelsInboundParams>(json!({
            "provider": "telegram",
            "peer_kind": "dm",
            "peer_id": "alice",
            "text": "hello",
            "dm_policy": "open",
            "fallback_models": ["openai:gpt-4o-mini"]
        }))
        .expect("openclaw-style channels.inbound params should parse");
        assert_eq!(openclaw_inbound.dm_policy.as_deref(), Some("open"));
        assert_eq!(
            openclaw_inbound.fallback_models,
            Some(vec!["openai:gpt-4o-mini".to_string()])
        );

        let map_node_pair = serde_json::from_value::<NodePairRequestParams>(json!({
            "nodeKey": "node-map",
            "displayName": "Map Node"
        }))
        .expect("map-style nodes.pair.request params should parse");
        assert_eq!(map_node_pair.node_key.as_deref(), Some("node-map"));
        assert_eq!(map_node_pair.display_name.as_deref(), Some("Map Node"));

        let openclaw_node_pair = serde_json::from_value::<NodePairRequestParams>(json!({
            "node_id": "node-openclaw",
            "display_name": "OpenClaw Node"
        }))
        .expect("openclaw-style nodes.pair.request params should parse");
        assert_eq!(openclaw_node_pair.node_id.as_deref(), Some("node-openclaw"));
        assert_eq!(
            openclaw_node_pair.display_name.as_deref(),
            Some("OpenClaw Node")
        );

        let map_node_verify = serde_json::from_value::<NodeVerifyParams>(json!({
            "nodeKey": "node-map",
            "token": "token-map"
        }))
        .expect("map-style nodes.verify params should parse");
        assert_eq!(map_node_verify.node_key.as_deref(), Some("node-map"));
        assert_eq!(map_node_verify.token, "token-map");

        let openclaw_node_verify = serde_json::from_value::<NodeVerifyParams>(json!({
            "node_key": "node-openclaw",
            "token": "token-openclaw"
        }))
        .expect("openclaw-style nodes.verify params should parse");
        assert_eq!(
            openclaw_node_verify.node_key.as_deref(),
            Some("node-openclaw")
        );
        assert_eq!(openclaw_node_verify.token, "token-openclaw");

        let map_uuid_id = serde_json::from_value::<UuidIdParams>(json!({
            "requestId": request_id
        }))
        .expect("map-style uuid id params should parse");
        assert_eq!(map_uuid_id.request_id, Some(request_id));

        let openclaw_uuid_id = serde_json::from_value::<UuidIdParams>(json!({
            "request_id": request_id
        }))
        .expect("openclaw-style uuid id params should parse");
        assert_eq!(openclaw_uuid_id.request_id, Some(request_id));
    }
}
