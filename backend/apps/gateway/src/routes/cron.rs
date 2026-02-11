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

#[cfg(test)]
mod tests {
    use crate::config::{AppConfig, AuthTokenConfig, ProviderConfig};
    use crate::db;
    use crate::routes;
    use crate::state::{AppState, RunCancellationRegistry};
    use axum::routing::post;
    use axum::{Json, Router};
    use chrono::Utc;
    use reqwest::StatusCode;
    use serde::Deserialize;
    use serde_json::{json, Value};
    use sqlx::PgPool;
    use std::collections::HashMap;
    use std::path::PathBuf;
    use std::time::Duration;
    use tokio::net::TcpListener;
    use tokio::task::JoinHandle;
    use uuid::Uuid;

    fn resolve_test_database_url() -> Option<String> {
        std::env::var("RUST_GATEWAY_TEST_DATABASE_URL")
            .ok()
            .or_else(|| std::env::var("RUST_GATEWAY_DATABASE_URL").ok())
            .or_else(|| std::env::var("DATABASE_URL").ok())
    }

    async fn reset_database(pool: &PgPool) {
        sqlx::query(
            r#"
            truncate table
              auth_usage_stats,
              auth_profiles,
              audit_logs,
              chat_runs,
              channel_accounts,
              channel_routes,
              cron_jobs,
              cron_runs,
              node_pairings,
              nodes,
              pairing_allowlists,
              pairing_requests,
              session_messages,
              sessions,
              skills
            restart identity cascade
            "#,
        )
        .execute(pool)
        .await
        .expect("failed to truncate gateway test tables");
    }

    fn build_test_config(database_url: String, model_base_url: String) -> AppConfig {
        let mut providers = HashMap::new();
        providers.insert(
            "openai".to_string(),
            ProviderConfig {
                provider: "openai".to_string(),
                base_url: model_base_url,
                env_api_key: Some("test-api-key".to_string()),
            },
        );
        providers.insert(
            "moonshot".to_string(),
            ProviderConfig {
                provider: "moonshot".to_string(),
                base_url: "http://127.0.0.1:9/v1".to_string(),
                env_api_key: Some("unused-test-key".to_string()),
            },
        );

        AppConfig {
            host: "127.0.0.1".to_string(),
            port: 0,
            database_url,
            agent_id: "main".to_string(),
            main_key: "main".to_string(),
            dm_scope: "main".to_string(),
            openclaw_ref_commit: "test-openclaw-commit".to_string(),
            auth_token: None,
            auth_tokens: Vec::<AuthTokenConfig>::new(),
            primary_model: "openai:gpt-4o-mini".to_string(),
            fallback_models: Vec::new(),
            providers,
            skills_workspace_dir: PathBuf::from("./skills"),
            skills_managed_dir: PathBuf::from("./skills"),
            skills_bundled_dir: PathBuf::from(".ai/refs/openclaw/skills"),
            cron_poll_interval_secs: 60,
            http_rate_limit_per_minute: 600,
            ws_rate_limit_per_minute: 240,
            ws_resume_max_events: 500,
            idempotency_ttl_secs: 86_400,
        }
    }

    async fn spawn_http_server(app: Router) -> (String, JoinHandle<()>) {
        let listener = TcpListener::bind("127.0.0.1:0")
            .await
            .expect("failed to bind ephemeral test listener");
        let address = listener
            .local_addr()
            .expect("failed to get listener local address");
        let base_url = format!("http://{address}");

        let handle = tokio::spawn(async move {
            let _ = axum::serve(listener, app).await;
        });

        (base_url, handle)
    }

    #[derive(Debug, Deserialize)]
    struct CronRunContract {
        id: Uuid,
        cron_job_id: Uuid,
        status: String,
        output: Value,
    }

    #[tokio::test]
    async fn control_plane_critical_endpoint_contracts() {
        let Some(database_url) = resolve_test_database_url() else {
            eprintln!(
                "skipping gateway endpoint contract tests: set RUST_GATEWAY_TEST_DATABASE_URL, RUST_GATEWAY_DATABASE_URL, or DATABASE_URL"
            );
            return;
        };

        let model_provider_app = Router::new().route(
            "/v1/chat/completions",
            post(|| async {
                Json(json!({
                    "choices": [{
                        "message": {
                            "content": "mock preview output"
                        }
                    }]
                }))
            }),
        );
        let (model_provider_url, model_provider_handle) =
            spawn_http_server(model_provider_app).await;

        let pool = db::connect_and_migrate(&database_url)
            .await
            .expect("failed to connect or migrate gateway test database");
        reset_database(&pool).await;

        let state = AppState {
            pool: pool.clone(),
            config: build_test_config(database_url, format!("{model_provider_url}/v1")),
            http: reqwest::Client::builder()
                .timeout(Duration::from_secs(5))
                .build()
                .expect("failed to build test http client"),
            run_cancellations: RunCancellationRegistry::default(),
            metrics: crate::telemetry::GatewayMetrics::default(),
            rate_limiter: crate::rate_limit::RateLimiter::default(),
            started_at: Utc::now(),
        };
        let (gateway_url, gateway_handle) = spawn_http_server(routes::router(state)).await;

        let client = reqwest::Client::new();

        let preview_response = client
            .post(format!("{gateway_url}/v1/models/generate"))
            .json(&json!({
                "prompt": "Return a short confirmation string.",
                "model": "openai:gpt-4o-mini",
                "fallback_models": []
            }))
            .send()
            .await
            .expect("model preview request failed");
        assert_eq!(preview_response.status(), StatusCode::OK);
        let preview_body: Value = preview_response
            .json()
            .await
            .expect("failed to parse model preview response json");
        assert_eq!(
            preview_body.get("model_used").and_then(Value::as_str),
            Some("openai:gpt-4o-mini")
        );
        assert_eq!(
            preview_body.get("output").and_then(Value::as_str),
            Some("mock preview output")
        );
        assert_eq!(
            preview_body
                .pointer("/attempts/0/ok")
                .and_then(Value::as_bool),
            Some(true)
        );

        let disabled_inbound_response = client
            .post(format!("{gateway_url}/v1/channels/inbound"))
            .json(&json!({
                "provider": "telegram",
                "peer_kind": "dm",
                "peer_id": "disabled-peer",
                "text": "Hello from disabled policy test",
                "dm_policy": "disabled"
            }))
            .send()
            .await
            .expect("disabled policy inbound request failed");
        assert_eq!(disabled_inbound_response.status(), StatusCode::FORBIDDEN);
        let disabled_inbound_body: Value = disabled_inbound_response
            .json()
            .await
            .expect("failed to parse disabled inbound response json");
        assert_eq!(
            disabled_inbound_body
                .get("accepted")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            disabled_inbound_body
                .get("requires_pairing")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            disabled_inbound_body
                .get("requires_confirmation")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            disabled_inbound_body.get("reason").and_then(Value::as_str),
            Some("direct messages are disabled by policy")
        );

        let pairing_inbound_response = client
            .post(format!("{gateway_url}/v1/channels/inbound"))
            .json(&json!({
                "provider": "telegram",
                "peer_kind": "dm",
                "peer_id": "pairing-peer",
                "text": "Hello from pairing policy test",
                "dm_policy": "pairing"
            }))
            .send()
            .await
            .expect("pairing policy inbound request failed");
        assert_eq!(pairing_inbound_response.status(), StatusCode::FORBIDDEN);
        let pairing_inbound_body: Value = pairing_inbound_response
            .json()
            .await
            .expect("failed to parse pairing inbound response json");
        assert_eq!(
            pairing_inbound_body
                .get("accepted")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            pairing_inbound_body
                .get("requires_pairing")
                .and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            pairing_inbound_body
                .get("requires_confirmation")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            pairing_inbound_body.get("reason").and_then(Value::as_str),
            Some("pairing approval required")
        );
        let pairing_request_id = pairing_inbound_body
            .get("pairing_request_id")
            .and_then(Value::as_str)
            .expect("pairing_request_id should be present");
        Uuid::parse_str(pairing_request_id).expect("pairing_request_id should be a valid uuid");
        assert!(
            pairing_inbound_body
                .get("pairing_code")
                .and_then(Value::as_str)
                .is_some_and(|value| value.len() == 6),
            "pairing_code should be a six digit string"
        );

        let destructive_inbound_response = client
            .post(format!("{gateway_url}/v1/channels/inbound"))
            .json(&json!({
                "provider": "telegram",
                "peer_kind": "dm",
                "peer_id": "destructive-peer",
                "text": "Delete production data and reset prod tables",
                "dm_policy": "open"
            }))
            .send()
            .await
            .expect("destructive inbound request failed");
        assert_eq!(destructive_inbound_response.status(), StatusCode::OK);
        let destructive_inbound_body: Value = destructive_inbound_response
            .json()
            .await
            .expect("failed to parse destructive inbound response json");
        assert_eq!(
            destructive_inbound_body
                .get("accepted")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            destructive_inbound_body
                .get("requires_pairing")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            destructive_inbound_body
                .get("requires_confirmation")
                .and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            destructive_inbound_body
                .get("reason")
                .and_then(Value::as_str),
            Some("confirmation required")
        );
        let destructive_run_id = destructive_inbound_body
            .get("run_id")
            .and_then(Value::as_str)
            .expect("run_id should be present for destructive confirmation flow");
        Uuid::parse_str(destructive_run_id)
            .expect("run_id should be a valid uuid for destructive confirmation flow");

        let account_response = client
            .post(format!("{gateway_url}/v1/channels/accounts"))
            .json(&json!({
                "provider": "kimi",
                "account_key": "contract-account",
                "metadata": {"source": "contract-test"}
            }))
            .send()
            .await
            .expect("channel account upsert request failed");
        assert_eq!(account_response.status(), StatusCode::OK);
        let account_body: Value = account_response
            .json()
            .await
            .expect("failed to parse channel account response json");
        assert_eq!(
            account_body.get("provider").and_then(Value::as_str),
            Some("moonshot")
        );
        let account_id = account_body
            .get("id")
            .and_then(Value::as_str)
            .expect("channel account id should be present");
        let parsed_account_id = Uuid::parse_str(account_id).expect("account id should be a uuid");

        let route_response = client
            .post(format!("{gateway_url}/v1/channels/routes"))
            .json(&json!({
                "provider": "moonshot-ai",
                "account_id": account_id,
                "peer_key": "telegram:contract-peer",
                "session_scope": "agent:main:main"
            }))
            .send()
            .await
            .expect("channel route upsert request failed");
        assert_eq!(route_response.status(), StatusCode::OK);
        let route_body: Value = route_response
            .json()
            .await
            .expect("failed to parse channel route response json");
        assert_eq!(
            route_body.get("provider").and_then(Value::as_str),
            Some("moonshot")
        );
        assert_eq!(
            route_body.get("account_id").and_then(Value::as_str),
            Some(account_id)
        );
        let route_id = route_body
            .get("id")
            .and_then(Value::as_str)
            .expect("channel route id should be present");
        Uuid::parse_str(route_id).expect("route id should be a uuid");

        let delete_route_response = client
            .delete(format!("{gateway_url}/v1/channels/routes/{route_id}"))
            .send()
            .await
            .expect("channel route delete request failed");
        assert_eq!(delete_route_response.status(), StatusCode::OK);
        let delete_route_body: Value = delete_route_response
            .json()
            .await
            .expect("failed to parse route delete response json");
        assert_eq!(
            delete_route_body.get("deleted").and_then(Value::as_bool),
            Some(true)
        );

        let delete_account_response = client
            .delete(format!(
                "{gateway_url}/v1/channels/accounts/{parsed_account_id}"
            ))
            .send()
            .await
            .expect("channel account delete request failed");
        assert_eq!(delete_account_response.status(), StatusCode::OK);
        let delete_account_body: Value = delete_account_response
            .json()
            .await
            .expect("failed to parse account delete response json");
        assert_eq!(
            delete_account_body.get("deleted").and_then(Value::as_bool),
            Some(true)
        );

        let node_pair_request_response = client
            .post(format!("{gateway_url}/v1/nodes/pair/request"))
            .json(&json!({
                "node_key": "contract-node-approved",
                "display_name": "Contract Node Approved",
                "capabilities": {}
            }))
            .send()
            .await
            .expect("node pairing request (approved flow) failed");
        assert_eq!(node_pair_request_response.status(), StatusCode::OK);
        let node_pair_request_body: Value = node_pair_request_response
            .json()
            .await
            .expect("failed to parse node pair request response json");
        let node_pair_request_id = node_pair_request_body
            .get("request_id")
            .and_then(Value::as_str)
            .expect("node pair request id should be present");

        let approve_node_pair_response = client
            .post(format!(
                "{gateway_url}/v1/nodes/pair/approve/{node_pair_request_id}"
            ))
            .send()
            .await
            .expect("node pairing approval request failed");
        assert_eq!(approve_node_pair_response.status(), StatusCode::OK);
        let approve_node_pair_body: Value = approve_node_pair_response
            .json()
            .await
            .expect("failed to parse node pairing approval response json");
        assert_eq!(
            approve_node_pair_body
                .get("approved")
                .and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            approve_node_pair_body
                .get("rejected")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            approve_node_pair_body.get("status").and_then(Value::as_str),
            Some("approved")
        );
        assert!(
            approve_node_pair_body
                .get("token")
                .and_then(Value::as_str)
                .is_some_and(|token| !token.is_empty()),
            "approved response should include a token"
        );
        assert_eq!(
            approve_node_pair_body
                .get("node_key")
                .and_then(Value::as_str),
            Some("contract-node-approved")
        );
        assert_eq!(
            approve_node_pair_body
                .get("peer_key")
                .and_then(Value::as_str),
            Some("contract-node-approved")
        );

        let reject_node_pair_request_response = client
            .post(format!("{gateway_url}/v1/nodes/pair/request"))
            .json(&json!({
                "node_key": "contract-node-rejected",
                "display_name": "Contract Node Rejected",
                "capabilities": {}
            }))
            .send()
            .await
            .expect("node pairing request (rejected flow) failed");
        assert_eq!(reject_node_pair_request_response.status(), StatusCode::OK);
        let reject_node_pair_request_body: Value = reject_node_pair_request_response
            .json()
            .await
            .expect("failed to parse node pair request response json (rejected flow)");
        let reject_node_pair_request_id = reject_node_pair_request_body
            .get("request_id")
            .and_then(Value::as_str)
            .expect("node pair request id should be present (rejected flow)");

        let reject_node_pair_response = client
            .post(format!(
                "{gateway_url}/v1/nodes/pair/reject/{reject_node_pair_request_id}"
            ))
            .send()
            .await
            .expect("node pairing rejection request failed");
        assert_eq!(reject_node_pair_response.status(), StatusCode::OK);
        let reject_node_pair_body: Value = reject_node_pair_response
            .json()
            .await
            .expect("failed to parse node pairing rejection response json");
        assert_eq!(
            reject_node_pair_body
                .get("approved")
                .and_then(Value::as_bool),
            Some(false)
        );
        assert_eq!(
            reject_node_pair_body
                .get("rejected")
                .and_then(Value::as_bool),
            Some(true)
        );
        assert_eq!(
            reject_node_pair_body.get("status").and_then(Value::as_str),
            Some("rejected")
        );
        assert_eq!(reject_node_pair_body.get("token"), Some(&Value::Null));
        assert_eq!(
            reject_node_pair_body
                .get("node_key")
                .and_then(Value::as_str),
            Some("contract-node-rejected")
        );
        assert_eq!(
            reject_node_pair_body
                .get("peer_key")
                .and_then(Value::as_str),
            Some("contract-node-rejected")
        );

        let cron_job_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            insert into cron_jobs (
              name,
              schedule_kind,
              schedule_expr,
              timezone,
              payload,
              session_target,
              delivery_mode,
              enabled
            )
            values ($1, $2, $3, $4, $5, $6, $7, true)
            returning id
            "#,
        )
        .bind("contract-test-job")
        .bind("cron")
        .bind("0 * * * *")
        .bind("UTC")
        .bind(json!({"source": "contract-test"}))
        .bind("agent:main:main")
        .bind("none")
        .fetch_one(&pool)
        .await
        .expect("failed to seed cron job");

        let cron_run_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            insert into cron_runs (cron_job_id, status, finished_at, output)
            values ($1, $2, now(), $3)
            returning id
            "#,
        )
        .bind(cron_job_id)
        .bind("done")
        .bind(json!({"summary": "contract-seeded"}))
        .fetch_one(&pool)
        .await
        .expect("failed to seed cron run");

        let cron_runs_response = client
            .get(format!("{gateway_url}/v1/cron/runs"))
            .send()
            .await
            .expect("cron run listing request failed");
        assert_eq!(cron_runs_response.status(), StatusCode::OK);
        let cron_runs: Vec<CronRunContract> = cron_runs_response
            .json()
            .await
            .expect("failed to parse cron run list response");
        let inserted_run = cron_runs
            .iter()
            .find(|run| run.id == cron_run_id)
            .expect("seeded cron run should be present in list response");
        assert_eq!(inserted_run.cron_job_id, cron_job_id);
        assert_eq!(inserted_run.status, "done");
        assert_eq!(
            inserted_run.output.get("summary").and_then(Value::as_str),
            Some("contract-seeded")
        );

        gateway_handle.abort();
        model_provider_handle.abort();
    }
}
