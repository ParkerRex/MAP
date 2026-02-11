mod auth;
mod config;
mod cron_runtime;
mod db;
mod error;
mod model_runtime;
mod provider;
mod rate_limit;
mod routes;
mod safety;
mod skills_runtime;
mod state;
mod telemetry;

use crate::config::AppConfig;
use crate::state::{AppState, RunCancellationRegistry};
use chrono::Utc;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let log_format = std::env::var("RUST_GATEWAY_LOG_FORMAT")
        .unwrap_or_else(|_| "pretty".to_string())
        .to_lowercase();
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into());
    if log_format == "json" {
        tracing_subscriber::fmt()
            .json()
            .with_env_filter(env_filter)
            .init();
    } else {
        tracing_subscriber::fmt().with_env_filter(env_filter).init();
    }

    let config = AppConfig::from_env()?;
    let pool = db::connect_and_migrate(&config.database_url).await?;
    let bind_addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(45))
        .build()?;

    let state = AppState {
        pool,
        config,
        http,
        run_cancellations: RunCancellationRegistry::default(),
        metrics: crate::telemetry::GatewayMetrics::default(),
        rate_limiter: crate::rate_limit::RateLimiter::default(),
        started_at: Utc::now(),
    };
    let scheduler_state = state.clone();
    tokio::spawn(async move {
        cron_runtime::scheduler_loop(scheduler_state).await;
    });

    let app = routes::router(state)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http());

    let listener = TcpListener::bind(bind_addr).await?;
    tracing::info!("map-gateway listening on {}", bind_addr);
    axum::serve(listener, app).await?;

    Ok(())
}
