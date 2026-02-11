use crate::state::AppState;
use axum::extract::State;
use axum::Json;
use chrono::Utc;
use serde::Serialize;

#[derive(Serialize)]
pub struct HealthResponse {
    pub ok: bool,
    pub service: &'static str,
    pub utc: String,
    pub openclaw_ref_commit: String,
}

pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(HealthResponse {
        ok: true,
        service: "map-gateway",
        utc: Utc::now().to_rfc3339(),
        openclaw_ref_commit: state.config.openclaw_ref_commit,
    })
}
