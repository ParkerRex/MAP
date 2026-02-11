use crate::state::AppState;
use axum::extract::State;
use axum::Json;

pub async fn metrics(State(state): State<AppState>) -> Json<crate::telemetry::MetricsSnapshot> {
    Json(state.metrics.snapshot(state.started_at))
}
