use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("not found")]
    NotFound,
    #[error("unauthorized")]
    Unauthorized,
    #[error("forbidden: {0}")]
    Forbidden(String),
    #[error("bad request: {0}")]
    BadRequest(String),
    #[error("rate limited")]
    RateLimited { retry_after_secs: u64 },
    #[error(transparent)]
    Database(#[from] sqlx::Error),
    #[error(transparent)]
    Anyhow(#[from] anyhow::Error),
}

#[derive(Serialize)]
struct ErrorBody {
    error: String,
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        match self {
            Self::RateLimited { retry_after_secs } => {
                let mut response = (
                    StatusCode::TOO_MANY_REQUESTS,
                    Json(ErrorBody {
                        error: format!("rate limited; retry after {retry_after_secs}s"),
                    }),
                )
                    .into_response();
                if let Ok(value) = retry_after_secs.to_string().parse() {
                    response
                        .headers_mut()
                        .insert(axum::http::header::RETRY_AFTER, value);
                }
                response
            }
            Self::NotFound => (
                StatusCode::NOT_FOUND,
                Json(ErrorBody {
                    error: "not found".to_string(),
                }),
            )
                .into_response(),
            Self::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorBody {
                    error: "unauthorized".to_string(),
                }),
            )
                .into_response(),
            Self::Forbidden(message) => {
                (StatusCode::FORBIDDEN, Json(ErrorBody { error: message })).into_response()
            }
            Self::BadRequest(message) => {
                (StatusCode::BAD_REQUEST, Json(ErrorBody { error: message })).into_response()
            }
            Self::Database(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorBody {
                    error: error.to_string(),
                }),
            )
                .into_response(),
            Self::Anyhow(error) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorBody {
                    error: error.to_string(),
                }),
            )
                .into_response(),
        }
    }
}
