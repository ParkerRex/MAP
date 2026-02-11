use crate::error::ApiError;
use crate::state::AppState;
use axum::extract::State;
use axum::http::{HeaderMap, Method, Request, Uri};
use axum::middleware::Next;
use axum::response::Response;
use std::collections::HashSet;

#[derive(Clone, Debug)]
pub struct GatewayAuthContext {
    pub subject: String,
    scopes: HashSet<String>,
}

impl GatewayAuthContext {
    pub fn has_scope(&self, scope: &str) -> bool {
        self.scopes.contains("*") || self.scopes.contains(scope)
    }

    pub fn scopes(&self) -> Vec<String> {
        let mut scopes = self.scopes.iter().cloned().collect::<Vec<_>>();
        scopes.sort();
        scopes
    }
}

pub fn required_ws_scope(method: &str) -> &'static str {
    match method {
        "health"
        | "status"
        | "logs.tail"
        | "config.get"
        | "config.schema"
        | "wizard.status"
        | "agents.list"
        | "agents.files.list"
        | "agents.files.get"
        | "agent.wait"
        | "sessions.list"
        | "sessions.resolve"
        | "chat.history"
        | "events.resume"
        | "models.list"
        | "models.get"
        | "models"
        | "models.profiles.list"
        | "skills.list"
        | "skills.status"
        | "security.audit"
        | "cron.jobs.list"
        | "cron.list"
        | "cron.runs.list"
        | "cron.runs"
        | "channels.summary"
        | "channels.status"
        | "channels.accounts.list"
        | "channels.routes.list"
        | "channels.pairing.list"
        | "nodes.list"
        | "node.describe"
        | "exec.approvals.get"
        | "exec.approvals.node.get" => "gateway.read",
        _ => "gateway.write",
    }
}

fn required_http_scope(method: &Method, path: &str) -> &'static str {
    if path.ends_with("/ws") {
        return "gateway.ws";
    }

    if method == Method::GET || method == Method::HEAD || method == Method::OPTIONS {
        "gateway.read"
    } else {
        "gateway.write"
    }
}

fn authenticate_with_token(
    state: &AppState,
    token: Option<&str>,
) -> Result<GatewayAuthContext, ApiError> {
    if state.config.auth_tokens.is_empty() {
        return Ok(GatewayAuthContext {
            subject: "anonymous".to_string(),
            scopes: HashSet::from(["*".to_string()]),
        });
    }

    let Some(provided) = token.map(str::trim).filter(|token| !token.is_empty()) else {
        return Err(ApiError::Unauthorized);
    };

    let Some(matched) = state
        .config
        .auth_tokens
        .iter()
        .find(|candidate| candidate.token == provided)
    else {
        return Err(ApiError::Unauthorized);
    };

    Ok(GatewayAuthContext {
        subject: matched.subject.clone(),
        scopes: matched.scopes.iter().cloned().collect(),
    })
}

pub fn authenticate_socket_connect(
    state: &AppState,
    preauthenticated: &GatewayAuthContext,
    connect_token: Option<&str>,
) -> Result<GatewayAuthContext, ApiError> {
    if state.config.auth_tokens.is_empty() {
        return Ok(preauthenticated.clone());
    }

    let Some(connect_token) = connect_token
        .map(str::trim)
        .filter(|token| !token.is_empty())
    else {
        return Ok(preauthenticated.clone());
    };

    let connect_context = authenticate_with_token(state, Some(connect_token))?;
    if connect_context.subject != preauthenticated.subject {
        return Err(ApiError::Unauthorized);
    }

    Ok(connect_context)
}

pub fn extract_gateway_token(headers: &HeaderMap, uri: &Uri) -> Option<String> {
    if let Some(header) = headers.get(axum::http::header::AUTHORIZATION) {
        if let Ok(value) = header.to_str() {
            let trimmed = value.trim();
            if let Some(stripped) = trimmed.strip_prefix("Bearer ") {
                if !stripped.trim().is_empty() {
                    return Some(stripped.trim().to_string());
                }
            }
        }
    }

    if let Some(header) = headers.get("x-gateway-token") {
        if let Ok(value) = header.to_str() {
            let trimmed = value.trim();
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }

    if let Some(query) = uri.query() {
        for pair in query.split('&') {
            let mut parts = pair.splitn(2, '=');
            let key = parts.next().unwrap_or_default();
            let value = parts.next().unwrap_or_default();
            if key == "token" && !value.trim().is_empty() {
                return Some(value.trim().to_string());
            }
        }
    }

    None
}

pub async fn require_gateway_auth(
    State(state): State<AppState>,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> Result<Response, ApiError> {
    let token = extract_gateway_token(request.headers(), request.uri());
    let auth_context = authenticate_with_token(&state, token.as_deref())?;

    let required_scope = required_http_scope(request.method(), request.uri().path());
    if !auth_context.has_scope(required_scope) {
        return Err(ApiError::Forbidden(format!(
            "missing required scope `{required_scope}`"
        )));
    }

    let decision = state.rate_limiter.check(
        &format!("http:{}:{required_scope}", auth_context.subject),
        state.config.http_rate_limit_per_minute,
    );
    if !decision.allowed {
        state.metrics.inc_rate_limited();
        return Err(ApiError::RateLimited {
            retry_after_secs: decision.retry_after_secs,
        });
    }

    state
        .metrics
        .inc_http_request(request.method().as_str(), request.uri().path());

    request.extensions_mut().insert(auth_context.clone());
    let response = next.run(request).await;

    if response.status().is_client_error() || response.status().is_server_error() {
        state.metrics.inc_http_error();
    }

    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::required_ws_scope;

    #[test]
    fn ws_scope_matrix_includes_openclaw_surface() {
        let read_methods = [
            "logs.tail",
            "config.get",
            "config.schema",
            "agents.list",
            "agent.wait",
            "exec.approvals.get",
            "exec.approvals.node.get",
            "node.describe",
        ];
        for method in read_methods {
            assert_eq!(
                required_ws_scope(method),
                "gateway.read",
                "expected `{method}` to require gateway.read"
            );
        }

        let write_methods = [
            "agent",
            "send",
            "poll",
            "wake",
            "channels.logout",
            "exec.approvals.set",
            "exec.approvals.node.set",
            "node.invoke",
            "node.event",
        ];
        for method in write_methods {
            assert_eq!(
                required_ws_scope(method),
                "gateway.write",
                "expected `{method}` to require gateway.write"
            );
        }
    }
}
