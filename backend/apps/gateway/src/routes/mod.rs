pub mod channels;
pub mod chat;
pub mod cron;
pub mod health;
pub mod metrics;
pub mod models;
pub mod nodes;
pub mod security;
pub mod sessions;
pub mod skills;
pub mod ws;

use crate::auth;
use crate::state::AppState;
use axum::middleware;
use axum::routing::{delete, get, post};
use axum::Router;

pub fn router(state: AppState) -> Router {
    let protected = Router::new()
        .route(
            "/sessions",
            get(sessions::list_sessions).post(sessions::create_session),
        )
        .route("/sessions/:id/reset", post(sessions::reset_session))
        .route(
            "/sessions/:id/messages",
            get(sessions::list_session_messages),
        )
        .route("/sessions/:id/runs", get(sessions::list_session_runs))
        .route("/chat/runs", post(chat::create_run))
        .route("/chat/runs/:id", get(chat::get_run))
        .route("/chat/runs/:id/stream", get(chat::stream_run))
        .route("/security/audit", get(security::audit))
        .route("/metrics", get(metrics::metrics))
        .route("/channels", get(channels::list_channels))
        .route(
            "/channels/accounts",
            get(channels::list_accounts).post(channels::upsert_account),
        )
        .route("/channels/accounts/:id", delete(channels::delete_account))
        .route(
            "/channels/routes",
            get(channels::list_routes).post(channels::upsert_route),
        )
        .route("/channels/routes/:id", delete(channels::delete_route))
        .route("/channels/resolve-session", post(channels::resolve_session))
        .route("/channels/inbound", post(channels::inbound_message))
        .route("/channels/pairing", get(channels::list_pairing_requests))
        .route(
            "/channels/pairing/:id/approve",
            post(channels::approve_pairing_request),
        )
        .route(
            "/channels/pairing/:id/reject",
            post(channels::reject_pairing_request),
        )
        .route("/models", get(models::list_models))
        .route(
            "/models/profiles",
            get(models::list_profiles).post(models::upsert_profile),
        )
        .route("/models/profiles/:id", delete(models::delete_profile))
        .route("/models/generate", post(models::generate_preview))
        .route(
            "/skills",
            get(skills::list_skills).post(skills::rescan_skills),
        )
        .route("/cron/runs", get(cron::list_runs))
        .route("/cron/jobs", get(cron::list_jobs).post(cron::create_job))
        .route("/cron/jobs/:id", delete(cron::delete_job))
        .route("/cron/jobs/:id/run", post(cron::run_job_now))
        .route("/nodes", get(nodes::list_nodes))
        .route("/nodes/pair/request", post(nodes::request_pairing))
        .route("/nodes/pair/approve/:id", post(nodes::approve_pairing))
        .route("/nodes/pair/reject/:id", post(nodes::reject_pairing))
        .route("/nodes/verify", post(nodes::verify_node))
        .route("/ws", get(ws::gateway_ws))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth::require_gateway_auth,
        ));

    Router::new()
        .route("/v1/health", get(health::health))
        .nest("/v1", protected)
        .with_state(state)
}
