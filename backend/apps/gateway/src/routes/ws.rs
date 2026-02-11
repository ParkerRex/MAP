use crate::cron_runtime::{CronCreateRequest, CronJobPayload};
use crate::error::ApiError;
use crate::model_runtime;
use crate::routes;
use crate::routes::sessions::{SessionMessageRow, SessionRow, SessionRunRow};
use crate::safety::confirmation_required;
use crate::state::AppState;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, State};
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use futures::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use uuid::Uuid;

pub async fn gateway_ws(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_gateway_socket(socket, state))
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
    attempts: Value,
    requires_confirmation: bool,
}

async fn handle_gateway_socket(mut socket: WebSocket, state: AppState) {
    let mut connected = false;
    let mut idempotency_cache: HashMap<String, Value> = HashMap::new();

    while let Some(frame) = socket.next().await {
        let message = match frame {
            Ok(Message::Text(text)) => text.to_string(),
            Ok(Message::Close(_)) => break,
            Ok(_) => continue,
            Err(_) => break,
        };

        let request = match serde_json::from_str::<WsRequest>(&message) {
            Ok(request) => request,
            Err(_) => {
                if send_error(
                    &mut socket,
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
            if send_error(
                &mut socket,
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
                    &mut socket,
                    &request.id,
                    "protocol_error",
                    "first request must be `connect`",
                )
                .await;
                let _ = socket.close().await;
                break;
            }

            let params = match serde_json::from_value::<ConnectParams>(request.params) {
                Ok(params) => params,
                Err(_) => {
                    let _ = send_error(
                        &mut socket,
                        &request.id,
                        "bad_request",
                        "invalid connect params",
                    )
                    .await;
                    let _ = socket.close().await;
                    break;
                }
            };

            if let Some(expected) = state.config.auth_token.as_ref() {
                let provided = params
                    .auth
                    .as_ref()
                    .and_then(|auth| auth.token.as_ref())
                    .map(|token| token.trim().to_string())
                    .unwrap_or_default();
                if provided != *expected {
                    let _ =
                        send_error(&mut socket, &request.id, "unauthorized", "invalid token").await;
                    let _ = socket.close().await;
                    break;
                }
            }

            connected = true;
            let payload = json!({
                "status": "ok",
                "protocol": "map-gateway-ws.v1",
                "openclawRefCommit": state.config.openclaw_ref_commit,
                "client": {
                    "role": params.client.as_ref().and_then(|client| client.role.clone()).unwrap_or_else(|| "operator".to_string()),
                    "name": params.client.as_ref().and_then(|client| client.name.clone())
                }
            });
            if send_ok(&mut socket, &request.id, payload).await.is_err() {
                break;
            }
            continue;
        }

        let result = dispatch_request(&state, &request, &mut socket, &mut idempotency_cache).await;

        if result.is_err() {
            break;
        }
    }
}

async fn dispatch_request(
    state: &AppState,
    request: &WsRequest,
    socket: &mut WebSocket,
    idempotency_cache: &mut HashMap<String, Value>,
) -> Result<(), ()> {
    match request.method.as_str() {
        "health" => {
            let payload = json!({
                "status": "ok",
                "openclawRefCommit": state.config.openclaw_ref_commit,
                "timestamp": Utc::now().to_rfc3339(),
            });
            send_ok(socket, &request.id, payload).await
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

            if let Some(key) = params.idempotency_key.as_ref() {
                if let Some(cached) = idempotency_cache.get(key) {
                    return send_ok(socket, &request.id, cached.clone()).await;
                }
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

            let run = match execute_chat_run(
                state,
                session.id,
                prompt,
                params.model,
                params.fallback_models,
                params.confirmed,
                params.idempotency_key.clone(),
            )
            .await
            {
                Ok(run) => run,
                Err(error) => {
                    tracing::error!("chat.send failed: {error}");
                    return send_error(
                        socket,
                        &request.id,
                        "request_failed",
                        "failed to execute chat run",
                    )
                    .await;
                }
            };

            let session_key = lookup_session_key(state, run.session_id)
                .await
                .ok()
                .flatten()
                .unwrap_or_else(|| run.session_id.to_string());

            let accepted = json!({
                "runId": run.run_id,
                "sessionId": run.session_id,
                "sessionKey": session_key,
                "status": "accepted"
            });

            if let Some(key) = run
                .attempts
                .get("idempotency_key")
                .and_then(Value::as_str)
                .map(ToString::to_string)
            {
                idempotency_cache.insert(key, accepted.clone());
            }

            send_ok(socket, &request.id, accepted).await?;

            let mut seq = 0_i64;
            send_event(
                socket,
                "chat",
                json!({
                    "kind": "run.started",
                    "runId": run.run_id,
                    "sessionId": run.session_id,
                    "sessionKey": session_key,
                    "seq": seq,
                }),
            )
            .await?;

            for token in run.output.split_whitespace() {
                seq += 1;
                send_event(
                    socket,
                    "chat",
                    json!({
                        "kind": "delta",
                        "runId": run.run_id,
                        "sessionId": run.session_id,
                        "sessionKey": session_key,
                        "text": format!("{token} "),
                        "state": "delta",
                        "seq": seq,
                    }),
                )
                .await?;
                tokio::time::sleep(std::time::Duration::from_millis(18)).await;
            }

            seq += 1;
            send_event(
                socket,
                "chat",
                json!({
                    "kind": "run.finished",
                    "runId": run.run_id,
                    "sessionId": run.session_id,
                    "sessionKey": session_key,
                    "status": run.status,
                    "modelUsed": run.model_used,
                    "requiresConfirmation": run.requires_confirmation,
                    "output": run.output,
                    "state": if run.requires_confirmation { "error" } else { "final" },
                    "seq": seq,
                    "message": {
                        "role": "assistant",
                        "content": [{"type": "text", "text": run.output}],
                    }
                }),
            )
            .await
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
                socket,
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
                let session_key = lookup_session_key(state, session_id)
                    .await
                    .ok()
                    .flatten()
                    .unwrap_or_else(|| session_id.to_string());
                send_event(
                    socket,
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

        "models.list" | "models.get" | "models" => {
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

        "skills.list" | "skills.status" => {
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

        "security.audit" => {
            send_api_result(
                socket,
                &request.id,
                routes::security::audit(State(state.clone())).await,
            )
            .await
        }

        "cron.jobs.list" | "cron.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::cron::list_jobs(State(state.clone())).await,
            )
            .await
        }

        "cron.runs.list" | "cron.runs" => {
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

        "cron.jobs.create" | "cron.add" => {
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

        "cron.jobs.run" | "cron.run" => {
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

        "cron.jobs.delete" | "cron.remove" => {
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

        "channels.resolveSession" | "channels.resolve-session" | "channels.resolve_session" => {
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

        "nodes.list" | "node.list" => {
            send_api_result(
                socket,
                &request.id,
                routes::nodes::list_nodes(State(state.clone())).await,
            )
            .await
        }

        "nodes.pair.request" | "node.pair.request" => {
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

        "nodes.pair.approve" | "node.pair.approve" => {
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

        "nodes.pair.reject" | "node.pair.reject" => {
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

        "nodes.verify" | "node.pair.verify" => {
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

async fn execute_chat_run(
    state: &AppState,
    session_id: Uuid,
    prompt: String,
    model: Option<String>,
    fallback_models: Option<Vec<String>>,
    confirmed: Option<bool>,
    idempotency_key: Option<String>,
) -> Result<ChatRunResult, ApiError> {
    let prompt = prompt.trim().to_string();

    let run_id = sqlx::query_as::<_, (Uuid,)>(
        r#"
        insert into chat_runs (session_id, prompt, status, output, metadata)
        values ($1, $2, 'running', '', '{}'::jsonb)
        returning id
        "#,
    )
    .bind(session_id)
    .bind(&prompt)
    .fetch_one(&state.pool)
    .await?
    .0;

    let needs_confirmation = confirmation_required(&prompt, confirmed);
    if needs_confirmation {
        let output = "Confirmation required: this request appears to include destructive or high-impact operations. Re-send with `confirmed: true` to continue.";
        let status = "needs_confirmation".to_string();
        let model_used = "none".to_string();

        sqlx::query(
            r#"
            update chat_runs
            set status = $2, output = $3, metadata = $4, updated_at = now()
            where id = $1
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
            attempts: json!({
                "attempts": [],
                "idempotency_key": idempotency_key
            }),
            requires_confirmation: true,
        });
    }

    let generation =
        model_runtime::generate_with_failover(state, &prompt, model, fallback_models).await;

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
    .bind(&status)
    .bind(&output)
    .bind(json!({
        "model_used": model_used,
        "attempts": attempts,
        "idempotency_key": idempotency_key
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
    .bind(&prompt)
    .bind(&output)
    .execute(&state.pool)
    .await?;

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
        attempts: json!({
            "attempts": attempts,
            "idempotency_key": idempotency_key
        }),
        requires_confirmation: false,
    })
}

fn api_error_to_wire(error: &ApiError) -> (&'static str, String) {
    match error {
        ApiError::NotFound => ("not_found", "not found".to_string()),
        ApiError::Unauthorized => ("unauthorized", "unauthorized".to_string()),
        ApiError::BadRequest(message) => ("bad_request", message.clone()),
        ApiError::Database(db) => ("request_failed", db.to_string()),
        ApiError::Anyhow(anyhow) => ("request_failed", anyhow.to_string()),
    }
}

async fn send_api_error(socket: &mut WebSocket, id: &str, error: ApiError) -> Result<(), ()> {
    let (code, message) = api_error_to_wire(&error);
    send_error(socket, id, code, &message).await
}

async fn send_api_result<T: Serialize>(
    socket: &mut WebSocket,
    id: &str,
    result: Result<Json<T>, ApiError>,
) -> Result<(), ()> {
    match result {
        Ok(Json(payload)) => send_ok(socket, id, json!(payload)).await,
        Err(error) => send_api_error(socket, id, error).await,
    }
}

async fn send_ok(socket: &mut WebSocket, id: &str, payload: Value) -> Result<(), ()> {
    let envelope = json!({
        "type": "res",
        "id": id,
        "ok": true,
        "payload": payload
    });
    socket
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}

async fn send_error(socket: &mut WebSocket, id: &str, code: &str, message: &str) -> Result<(), ()> {
    let envelope = json!({
        "type": "res",
        "id": id,
        "ok": false,
        "error": {
            "code": code,
            "message": message
        }
    });
    socket
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}

async fn send_event(socket: &mut WebSocket, event: &str, payload: Value) -> Result<(), ()> {
    let envelope = json!({
        "type": "event",
        "event": event,
        "payload": payload
    });
    socket
        .send(Message::Text(envelope.to_string().into()))
        .await
        .map_err(|_| ())
}
