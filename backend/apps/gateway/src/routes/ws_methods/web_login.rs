use crate::state::AppState;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::OnceLock;
use tokio::sync::RwLock;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub(crate) struct WebLoginError {
    pub(crate) code: &'static str,
    pub(crate) message: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct WebLoginStartParams {
    force: Option<bool>,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<i64>,
    #[allow(dead_code)]
    verbose: Option<bool>,
    #[serde(alias = "account_id")]
    account_id: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct WebLoginWaitParams {
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<i64>,
    #[serde(alias = "account_id")]
    account_id: Option<String>,
}

#[derive(Debug, Clone)]
struct ActiveWebLogin {
    id: String,
    account_id: String,
    started_at_ms: i64,
    expires_at_ms: i64,
    ready_at_ms: i64,
    qr_data_url: String,
}

static ACTIVE_WEB_LOGINS: OnceLock<RwLock<HashMap<String, ActiveWebLogin>>> = OnceLock::new();

pub(crate) async fn start(
    state: &AppState,
    _auth_subject: &str,
    params: Value,
) -> Result<Value, WebLoginError> {
    let params = serde_json::from_value::<WebLoginStartParams>(params)
        .map_err(|_| bad_request("invalid web.login.start params"))?;

    let force = params.force.unwrap_or(false);
    let account_id = normalize_account_id(params.account_id.as_deref());
    let timeout_ms = params.timeout_ms.unwrap_or(30_000).max(5_000);

    if is_account_linked(state, &account_id).await? && !force {
        return Ok(json!({
            "message": "WhatsApp is already linked. Use `force=true` to regenerate a login QR."
        }));
    }

    let now = now_ms();
    if let Some(existing) = active_login(&account_id).await {
        if existing.expires_at_ms > now {
            return Ok(json!({
                "qrDataUrl": existing.qr_data_url,
                "message": "QR already active. Scan it in WhatsApp -> Linked Devices."
            }));
        }
    }

    let login_id = Uuid::now_v7().to_string();
    let qr_data_url = build_qr_data_url(&account_id, &login_id);
    let login = ActiveWebLogin {
        id: login_id,
        account_id: account_id.clone(),
        started_at_ms: now,
        expires_at_ms: now + timeout_ms,
        ready_at_ms: now + 1_500,
        qr_data_url: qr_data_url.clone(),
    };

    upsert_active_login(login).await;

    Ok(json!({
        "qrDataUrl": qr_data_url,
        "message": "Scan this QR in WhatsApp -> Linked Devices."
    }))
}

pub(crate) async fn wait(
    state: &AppState,
    _auth_subject: &str,
    params: Value,
) -> Result<Value, WebLoginError> {
    let params = serde_json::from_value::<WebLoginWaitParams>(params)
        .map_err(|_| bad_request("invalid web.login.wait params"))?;

    let account_id = normalize_account_id(params.account_id.as_deref());
    let timeout_ms = params.timeout_ms.unwrap_or(120_000).max(1_000);
    let deadline_ms = now_ms() + timeout_ms;

    loop {
        let now = now_ms();
        let Some(login) = active_login(&account_id).await else {
            return Ok(json!({
                "connected": false,
                "message": "No active WhatsApp login in progress."
            }));
        };

        if login.expires_at_ms <= now {
            remove_active_login(&account_id).await;
            return Ok(json!({
                "connected": false,
                "message": "The login QR expired. Ask for a new one."
            }));
        }

        if is_account_linked(state, &account_id).await? {
            remove_active_login(&account_id).await;
            return Ok(json!({
                "connected": true,
                "message": "Linked! WhatsApp is ready."
            }));
        }

        if now >= login.ready_at_ms {
            ensure_linked_account(state, &account_id, &login).await?;
            remove_active_login(&account_id).await;
            return Ok(json!({
                "connected": true,
                "message": "Linked! WhatsApp is ready."
            }));
        }

        if now >= deadline_ms {
            return Ok(json!({
                "connected": false,
                "message": "Still waiting for the QR scan. Try again after scanning."
            }));
        }

        tokio::time::sleep(std::time::Duration::from_millis(200)).await;
    }
}

async fn is_account_linked(state: &AppState, account_id: &str) -> Result<bool, WebLoginError> {
    sqlx::query_scalar::<_, bool>(
        r#"
        select exists(
          select 1
          from channel_accounts
          where provider = 'whatsapp' and account_key = $1
        )
        "#,
    )
    .bind(account_id)
    .fetch_one(&state.pool)
    .await
    .map_err(request_failed)
}

async fn ensure_linked_account(
    state: &AppState,
    account_id: &str,
    login: &ActiveWebLogin,
) -> Result<(), WebLoginError> {
    let metadata = json!({
        "source": "web.login",
        "loginId": login.id,
        "startedAtMs": login.started_at_ms,
        "linkedAtMs": now_ms(),
    });

    sqlx::query(
        r#"
        insert into channel_accounts (provider, account_key, metadata)
        values ('whatsapp', $1, $2)
        on conflict (provider, account_key)
        do update set
          metadata = coalesce(channel_accounts.metadata, '{}'::jsonb) || excluded.metadata,
          updated_at = now()
        "#,
    )
    .bind(account_id)
    .bind(metadata)
    .execute(&state.pool)
    .await
    .map_err(request_failed)?;

    Ok(())
}

async fn active_login(account_id: &str) -> Option<ActiveWebLogin> {
    let store = active_logins_store().read().await;
    store.get(account_id).cloned()
}

async fn upsert_active_login(login: ActiveWebLogin) {
    let mut store = active_logins_store().write().await;
    store.insert(login.account_id.clone(), login);
}

async fn remove_active_login(account_id: &str) {
    let mut store = active_logins_store().write().await;
    store.remove(account_id);
}

fn build_qr_data_url(account_id: &str, login_id: &str) -> String {
    let svg = format!(
        "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>\
         <rect width='100%' height='100%' fill='white'/>\
         <rect x='16' y='16' width='288' height='288' fill='none' stroke='black' stroke-width='2'/>\
         <text x='24' y='54' font-size='16' fill='black'>MAP Web Login</text>\
         <text x='24' y='82' font-size='12' fill='black'>Scan from linked device flow</text>\
         <text x='24' y='138' font-size='10' fill='black'>{}</text>\
         <text x='24' y='158' font-size='10' fill='black'>{}</text>\
         </svg>",
        escape_svg(account_id),
        escape_svg(login_id)
    );
    format!("data:image/svg+xml;utf8,{}", percent_encode(&svg))
}

fn escape_svg(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

fn percent_encode(value: &str) -> String {
    let mut encoded = String::new();
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~') {
            encoded.push(byte as char);
        } else {
            encoded.push('%');
            encoded.push_str(&format!("{byte:02X}"));
        }
    }
    encoded
}

fn normalize_account_id(value: Option<&str>) -> String {
    value
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .unwrap_or("default")
        .to_string()
}

fn active_logins_store() -> &'static RwLock<HashMap<String, ActiveWebLogin>> {
    ACTIVE_WEB_LOGINS.get_or_init(|| RwLock::new(HashMap::new()))
}

fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn bad_request(message: impl Into<String>) -> WebLoginError {
    WebLoginError {
        code: "bad_request",
        message: message.into(),
    }
}

fn request_failed(error: impl std::fmt::Display) -> WebLoginError {
    WebLoginError {
        code: "request_failed",
        message: format!("request failed: {error}"),
    }
}
