use crate::state::AppState;
use serde_json::Value;

#[derive(Debug, Clone)]
pub(crate) struct WebLoginError {
    pub(crate) code: &'static str,
    pub(crate) message: String,
}

fn unavailable(method: &str) -> WebLoginError {
    WebLoginError {
        code: "unavailable",
        message: format!("`{method}` is recognized but not implemented in MAP Rust gateway yet"),
    }
}

pub(crate) async fn start(
    _state: &AppState,
    _auth_subject: &str,
    _params: Value,
) -> Result<Value, WebLoginError> {
    Err(unavailable("web.login.start"))
}

pub(crate) async fn wait(
    _state: &AppState,
    _auth_subject: &str,
    _params: Value,
) -> Result<Value, WebLoginError> {
    Err(unavailable("web.login.wait"))
}
