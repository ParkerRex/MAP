mod auth;
mod config;
mod cron_runtime;
mod db;
mod error;
mod model_runtime;
mod routes;
mod skills_runtime;
mod state;

use crate::config::AppConfig;
use crate::state::AppState;
use std::net::SocketAddr;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let config = AppConfig::from_env()?;
    let pool = db::connect_and_migrate(&config.database_url).await?;
    let bind_addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(45))
        .build()?;

    let state = AppState { pool, config, http };
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
