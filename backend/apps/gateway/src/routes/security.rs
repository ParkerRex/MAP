use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::State;
use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct SecurityAuditResponse {
    pub status: &'static str,
    pub checks: Vec<SecurityCheck>,
}

#[derive(Serialize)]
pub struct SecurityCheck {
    pub name: String,
    pub ok: bool,
    pub detail: String,
}

pub async fn audit(State(state): State<AppState>) -> Result<Json<SecurityAuditResponse>, ApiError> {
    let db_ok = sqlx::query_scalar::<_, i64>("select 1")
        .fetch_one(&state.pool)
        .await
        .is_ok();

    let pending_pairing_count = sqlx::query_scalar::<_, i64>(
        "select count(*) from pairing_requests where status = 'pending' and expires_at > now()",
    )
    .fetch_one(&state.pool)
    .await
    .unwrap_or(0);

    let auth_enabled = !state.config.auth_tokens.is_empty();
    let bundled_skills_exists = state.config.skills_bundled_dir.exists();

    let checks = vec![
        SecurityCheck {
            name: "database_connectivity".to_string(),
            ok: db_ok,
            detail: if db_ok {
                "postgres connection healthy".to_string()
            } else {
                "postgres connection failed".to_string()
            },
        },
        SecurityCheck {
            name: "gateway_auth_token".to_string(),
            ok: auth_enabled,
            detail: if auth_enabled {
                format!(
                    "gateway auth configured with {} scoped token(s)",
                    state.config.auth_tokens.len()
                )
            } else {
                "RUST_GATEWAY_AUTH_TOKEN or RUST_GATEWAY_AUTH_SCOPED_TOKENS not configured"
                    .to_string()
            },
        },
        SecurityCheck {
            name: "openclaw_baseline_commit".to_string(),
            ok: true,
            detail: state.config.openclaw_ref_commit.clone(),
        },
        SecurityCheck {
            name: "bundled_skills_reference".to_string(),
            ok: bundled_skills_exists,
            detail: state
                .config
                .skills_bundled_dir
                .to_string_lossy()
                .to_string(),
        },
        SecurityCheck {
            name: "pending_pairing_requests".to_string(),
            ok: pending_pairing_count == 0,
            detail: format!("{pending_pairing_count} pending request(s)"),
        },
    ];

    let status = if checks.iter().all(|check| check.ok) {
        "ok"
    } else {
        "warning"
    };

    Ok(Json(SecurityAuditResponse { status, checks }))
}
