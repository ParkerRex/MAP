use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::State;
use axum::http::Request;
use axum::middleware::Next;
use axum::response::Response;

pub async fn require_gateway_auth(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, ApiError> {
    if let Some(token) = state.config.auth_token.as_ref() {
        let mut authorized = false;

        if let Some(header) = request.headers().get(axum::http::header::AUTHORIZATION) {
            if let Ok(value) = header.to_str() {
                authorized = value.trim() == format!("Bearer {token}");
            }
        }

        if !authorized {
            if let Some(header) = request.headers().get("x-gateway-token") {
                if let Ok(value) = header.to_str() {
                    authorized = value.trim() == token;
                }
            }
        }

        if !authorized {
            if let Some(query) = request.uri().query() {
                for pair in query.split('&') {
                    let mut parts = pair.splitn(2, '=');
                    let key = parts.next().unwrap_or_default();
                    let value = parts.next().unwrap_or_default();
                    if key == "token" && value == token {
                        authorized = true;
                        break;
                    }
                }
            }
        }

        if !authorized {
            return Err(ApiError::Unauthorized);
        }
    }

    Ok(next.run(request).await)
}
