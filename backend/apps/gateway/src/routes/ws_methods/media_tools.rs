use super::WsMethodError;
use crate::state::AppState;
use reqwest::Method;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::time::Duration;
use tokio::process::Command;
use uuid::Uuid;

type WsMethodResult = Result<Value, WsMethodError>;

const DEFAULT_OPENAI_TTS_MODEL: &str = "gpt-4o-mini-tts";
const DEFAULT_OPENAI_TTS_VOICE: &str = "alloy";
const DEFAULT_ELEVENLABS_BASE_URL: &str = "https://api.elevenlabs.io/v1";
const DEFAULT_ELEVENLABS_MODEL_ID: &str = "eleven_multilingual_v2";
const DEFAULT_ELEVENLABS_VOICE_ID: &str = "EXAVITQu4vr4xnSDxMaL";
const DEFAULT_VOICEWAKE_TRIGGERS: [&str; 3] = ["openclaw", "claude", "computer"];

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct BrowserRequestParams {
    method: Option<String>,
    path: Option<String>,
    query: Option<HashMap<String, Value>>,
    body: Option<Value>,
    #[serde(alias = "timeout_ms")]
    timeout_ms: Option<u64>,
}

#[derive(Debug, Default, Deserialize)]
#[serde(default, deny_unknown_fields)]
struct EmptyParams {}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TtsSetProviderParams {
    provider: String,
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct TtsConvertParams {
    text: Option<String>,
    channel: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct VoiceWakeSetParams {
    triggers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TtsPrefs {
    enabled: bool,
    provider: String,
    updated_at_ms: i64,
}

impl Default for TtsPrefs {
    fn default() -> Self {
        Self {
            enabled: false,
            provider: "edge".to_string(),
            updated_at_ms: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct VoiceWakeConfig {
    triggers: Vec<String>,
    updated_at_ms: i64,
}

impl Default for VoiceWakeConfig {
    fn default() -> Self {
        Self {
            triggers: DEFAULT_VOICEWAKE_TRIGGERS
                .iter()
                .map(|value| (*value).to_string())
                .collect(),
            updated_at_ms: 0,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct TtsConvertPayload {
    audio_path: String,
    provider: String,
    output_format: String,
    voice_compatible: bool,
}

#[cfg_attr(test, allow(dead_code))]
pub(crate) async fn dispatch(
    state: &AppState,
    method: &str,
    params: Value,
) -> Option<WsMethodResult> {
    Some(match method {
        "browser.request" => handle_browser_request(state, params).await,
        "tts.status" => tts_status(state, params).await,
        "tts.providers" => tts_providers(state, params).await,
        "tts.enable" => tts_enable(state, params).await,
        "tts.disable" => tts_disable(state, params).await,
        "tts.setProvider" => tts_set_provider(state, params).await,
        "tts.convert" => tts_convert(state, params).await,
        "voicewake.get" => voicewake_get(params).await,
        "voicewake.set" => voicewake_set(params).await,
        _ => return None,
    })
}

async fn handle_browser_request(state: &AppState, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<BrowserRequestParams>(params)
        .map_err(|_| invalid_request("invalid browser.request params"))?;

    let method = parse_browser_method(params.method.as_deref())?;
    let path = params
        .path
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| invalid_request("method and path are required"))?;
    let url = resolve_browser_url(state, path);

    let mut request = state.http.request(method.clone(), &url);
    if let Some(timeout_ms) = params.timeout_ms {
        request = request.timeout(Duration::from_millis(timeout_ms.max(1)));
    }

    if let Some(query) = params.query.as_ref() {
        let query_pairs = query
            .iter()
            .filter_map(|(key, value)| {
                if value.is_null() {
                    return None;
                }
                let value = match value {
                    Value::String(text) => text.clone(),
                    _ => value.to_string(),
                };
                Some((key.clone(), value))
            })
            .collect::<Vec<_>>();
        if !query_pairs.is_empty() {
            request = request.query(&query_pairs);
        }
    }

    if method != Method::GET {
        if let Some(body) = params.body.as_ref() {
            request = request.json(body);
        }
    }

    let response = request
        .send()
        .await
        .map_err(|error| unavailable(format!("browser request failed: {error}")))?;
    let status = response.status();

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .to_lowercase();

    let payload = if content_type.contains("application/json") {
        response
            .json::<Value>()
            .await
            .map_err(|error| unavailable(format!("browser request failed: {error}")))?
    } else {
        Value::String(
            response
                .text()
                .await
                .map_err(|error| unavailable(format!("browser request failed: {error}")))?,
        )
    };

    if !status.is_success() {
        let message = extract_error_message(&payload)
            .unwrap_or_else(|| format!("browser request failed ({})", status.as_u16()));
        if status.is_server_error() {
            return Err(unavailable(message));
        }
        return Err(invalid_request(message));
    }

    Ok(payload)
}

async fn tts_status(state: &AppState, params: Value) -> WsMethodResult {
    serde_json::from_value::<EmptyParams>(params)
        .map_err(|_| invalid_request("invalid tts.status params"))?;

    let mut prefs = load_tts_prefs().await?;
    let provider = resolve_tts_provider(state, &mut prefs);
    let order = tts_provider_order(&provider);
    let fallback_providers = order
        .into_iter()
        .skip(1)
        .filter(|candidate| is_provider_configured(state, candidate))
        .map(ToString::to_string)
        .collect::<Vec<_>>();

    let has_openai_key = openai_api_key(state).is_some();
    let has_elevenlabs_key = elevenlabs_api_key().is_some();
    let edge_enabled = edge_tts_available();

    Ok(json!({
        "enabled": prefs.enabled,
        "auto": if prefs.enabled { "always" } else { "off" },
        "provider": provider,
        "fallbackProvider": fallback_providers.first().cloned(),
        "fallbackProviders": fallback_providers,
        "prefsPath": tts_prefs_path().to_string_lossy(),
        "hasOpenAIKey": has_openai_key,
        "hasElevenLabsKey": has_elevenlabs_key,
        "edgeEnabled": edge_enabled,
    }))
}

async fn tts_providers(state: &AppState, params: Value) -> WsMethodResult {
    serde_json::from_value::<EmptyParams>(params)
        .map_err(|_| invalid_request("invalid tts.providers params"))?;

    let mut prefs = load_tts_prefs().await?;
    let active = resolve_tts_provider(state, &mut prefs);

    Ok(json!({
        "providers": [
            {
                "id": "openai",
                "name": "OpenAI",
                "configured": openai_api_key(state).is_some(),
                "models": ["gpt-4o-mini-tts", "tts-1", "tts-1-hd"],
                "voices": ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse"],
            },
            {
                "id": "elevenlabs",
                "name": "ElevenLabs",
                "configured": elevenlabs_api_key().is_some(),
                "models": ["eleven_multilingual_v2", "eleven_turbo_v2_5", "eleven_monolingual_v1"],
            },
            {
                "id": "edge",
                "name": "Edge TTS",
                "configured": edge_tts_available(),
                "models": [],
            }
        ],
        "active": active,
    }))
}

async fn tts_enable(_state: &AppState, params: Value) -> WsMethodResult {
    serde_json::from_value::<EmptyParams>(params)
        .map_err(|_| invalid_request("invalid tts.enable params"))?;
    let mut prefs = load_tts_prefs().await?;
    prefs.enabled = true;
    prefs.updated_at_ms = now_ms();
    write_tts_prefs(&prefs).await?;
    Ok(json!({ "enabled": true }))
}

async fn tts_disable(_state: &AppState, params: Value) -> WsMethodResult {
    serde_json::from_value::<EmptyParams>(params)
        .map_err(|_| invalid_request("invalid tts.disable params"))?;
    let mut prefs = load_tts_prefs().await?;
    prefs.enabled = false;
    prefs.updated_at_ms = now_ms();
    write_tts_prefs(&prefs).await?;
    Ok(json!({ "enabled": false }))
}

async fn tts_set_provider(state: &AppState, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<TtsSetProviderParams>(params)
        .map_err(|_| invalid_request("invalid tts.setProvider params"))?;
    let provider = normalize_tts_provider(Some(params.provider.as_str()))
        .ok_or_else(|| invalid_request("Invalid provider. Use openai, elevenlabs, or edge."))?;

    let mut prefs = load_tts_prefs().await?;
    prefs.provider = provider.clone();
    prefs.updated_at_ms = now_ms();
    if !is_provider_configured(state, &provider) {
        write_tts_prefs(&prefs).await?;
        return Ok(json!({
            "provider": provider,
            "warning": format!("provider `{}` is not currently configured; conversion may fall back", provider),
        }));
    }

    write_tts_prefs(&prefs).await?;
    Ok(json!({ "provider": provider }))
}

async fn tts_convert(state: &AppState, params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<TtsConvertParams>(params)
        .map_err(|_| invalid_request("invalid tts.convert params"))?;

    let text = params
        .text
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| invalid_request("tts.convert requires text"))?;
    let _channel = params.channel;

    let mut prefs = load_tts_prefs().await?;
    let primary = resolve_tts_provider(state, &mut prefs);
    let mut errors = Vec::new();

    for provider in tts_provider_order(&primary) {
        let attempt = match provider {
            "openai" => convert_with_openai(state, text).await,
            "elevenlabs" => convert_with_elevenlabs(text).await,
            "edge" => convert_with_edge(text).await,
            _ => Err("unsupported provider".to_string()),
        };

        match attempt {
            Ok(result) => return Ok(json!(result)),
            Err(error) => errors.push(format!("{provider}: {error}")),
        }
    }

    Err(unavailable(format!(
        "TTS conversion failed: {}",
        errors.join("; ")
    )))
}

async fn voicewake_get(params: Value) -> WsMethodResult {
    serde_json::from_value::<EmptyParams>(params)
        .map_err(|_| invalid_request("invalid voicewake.get params"))?;
    let config = load_voicewake_config().await?;
    Ok(json!({ "triggers": config.triggers }))
}

async fn voicewake_set(params: Value) -> WsMethodResult {
    let params = serde_json::from_value::<VoiceWakeSetParams>(params)
        .map_err(|_| invalid_request("voicewake.set requires triggers: string[]"))?;
    let config = set_voicewake_triggers(params.triggers).await?;
    Ok(json!({ "triggers": config.triggers }))
}

async fn convert_with_openai(state: &AppState, text: &str) -> Result<TtsConvertPayload, String> {
    let provider = state
        .config
        .providers
        .get("openai")
        .ok_or_else(|| "openai provider is not configured".to_string())?;
    let api_key = provider
        .env_api_key
        .clone()
        .ok_or_else(|| "OPENAI_API_KEY is not configured".to_string())?;

    let model = std::env::var("OPENAI_TTS_MODEL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_OPENAI_TTS_MODEL.to_string());
    let voice = std::env::var("OPENAI_TTS_VOICE")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_OPENAI_TTS_VOICE.to_string());

    let url = format!("{}/audio/speech", provider.base_url.trim_end_matches('/'));
    let response = state
        .http
        .post(url)
        .bearer_auth(api_key)
        .json(&json!({
            "model": model,
            "voice": voice,
            "input": text,
            "format": "mp3",
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;
    let status = response.status();

    if !status.is_success() {
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "OpenAI request failed".to_string());
        return Err(format!("OpenAI request failed ({status}): {message}"));
    }

    let bytes = response.bytes().await.map_err(|error| error.to_string())?;
    let audio_path = write_audio_bytes("openai", "mp3", bytes.as_ref())
        .await
        .map_err(|error| error.to_string())?;

    Ok(TtsConvertPayload {
        audio_path,
        provider: "openai".to_string(),
        output_format: "mp3".to_string(),
        voice_compatible: true,
    })
}

async fn convert_with_elevenlabs(text: &str) -> Result<TtsConvertPayload, String> {
    let api_key =
        elevenlabs_api_key().ok_or_else(|| "ELEVENLABS_API_KEY is not configured".to_string())?;
    let base_url = std::env::var("ELEVENLABS_BASE_URL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_ELEVENLABS_BASE_URL.to_string());
    let voice_id = std::env::var("ELEVENLABS_VOICE_ID")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_ELEVENLABS_VOICE_ID.to_string());
    let model_id = std::env::var("ELEVENLABS_MODEL_ID")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| DEFAULT_ELEVENLABS_MODEL_ID.to_string());

    let url = format!(
        "{}/text-to-speech/{}",
        base_url.trim_end_matches('/'),
        voice_id
    );
    let client = reqwest::Client::new();
    let response = client
        .post(url)
        .header("xi-api-key", api_key)
        .header(reqwest::header::ACCEPT, "audio/mpeg")
        .json(&json!({
            "text": text,
            "model_id": model_id,
            "output_format": "mp3_44100_128",
        }))
        .send()
        .await
        .map_err(|error| error.to_string())?;
    let status = response.status();

    if !status.is_success() {
        let message = response
            .text()
            .await
            .unwrap_or_else(|_| "ElevenLabs request failed".to_string());
        return Err(format!("ElevenLabs request failed ({status}): {message}"));
    }

    let bytes = response.bytes().await.map_err(|error| error.to_string())?;
    let audio_path = write_audio_bytes("elevenlabs", "mp3", bytes.as_ref())
        .await
        .map_err(|error| error.to_string())?;

    Ok(TtsConvertPayload {
        audio_path,
        provider: "elevenlabs".to_string(),
        output_format: "mp3".to_string(),
        voice_compatible: true,
    })
}

async fn convert_with_edge(text: &str) -> Result<TtsConvertPayload, String> {
    if !edge_tts_available() {
        return Err("edge TTS is not available on this host".to_string());
    }

    let output_path = resolve_media_dir().join(format!("edge-{}.aiff", Uuid::now_v7()));
    ensure_parent_dir(&output_path)
        .await
        .map_err(|error| error.to_string())?;

    let status = Command::new("say")
        .arg("-o")
        .arg(&output_path)
        .arg(text)
        .status()
        .await
        .map_err(|error| error.to_string())?;

    if !status.success() {
        return Err(format!("`say` exited with status {status}"));
    }

    Ok(TtsConvertPayload {
        audio_path: output_path.to_string_lossy().to_string(),
        provider: "edge".to_string(),
        output_format: "aiff".to_string(),
        voice_compatible: true,
    })
}

fn parse_browser_method(raw: Option<&str>) -> Result<Method, WsMethodError> {
    let method = raw
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(|value| value.to_uppercase())
        .ok_or_else(|| invalid_request("method and path are required"))?;

    match method.as_str() {
        "GET" => Ok(Method::GET),
        "POST" => Ok(Method::POST),
        "DELETE" => Ok(Method::DELETE),
        _ => Err(invalid_request("method must be GET, POST, or DELETE")),
    }
}

fn resolve_browser_url(state: &AppState, raw_path: &str) -> String {
    let path = normalize_browser_path(raw_path);
    if path.starts_with("http://") || path.starts_with("https://") {
        return path;
    }

    let base = std::env::var("RUST_GATEWAY_BROWSER_BASE_URL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| format!("http://127.0.0.1:{}", state.config.port));
    join_base_url(&base, &path)
}

fn normalize_browser_path(raw_path: &str) -> String {
    let trimmed = raw_path.trim();
    if trimmed.eq_ignore_ascii_case("health") || trimmed == "/health" {
        return "/v1/health".to_string();
    }
    if trimmed.starts_with("http://") || trimmed.starts_with("https://") {
        return trimmed.to_string();
    }
    if trimmed.starts_with('/') {
        return trimmed.to_string();
    }
    if trimmed.starts_with("v1/") {
        return format!("/{trimmed}");
    }
    format!("/{trimmed}")
}

fn join_base_url(base: &str, path: &str) -> String {
    if base.ends_with('/') {
        format!("{}{}", base.trim_end_matches('/'), path)
    } else {
        format!("{base}{path}")
    }
}

fn extract_error_message(payload: &Value) -> Option<String> {
    payload
        .get("error")
        .and_then(Value::as_str)
        .map(ToString::to_string)
        .or_else(|| {
            payload
                .get("message")
                .and_then(Value::as_str)
                .map(ToString::to_string)
        })
}

fn tts_provider_order(primary: &str) -> Vec<&'static str> {
    match primary {
        "openai" => vec!["openai", "elevenlabs", "edge"],
        "elevenlabs" => vec!["elevenlabs", "openai", "edge"],
        _ => vec!["edge", "openai", "elevenlabs"],
    }
}

fn resolve_tts_provider(state: &AppState, prefs: &mut TtsPrefs) -> String {
    let provider = normalize_tts_provider(Some(prefs.provider.as_str()))
        .unwrap_or_else(|| default_tts_provider(state));
    prefs.provider = provider.clone();
    provider
}

fn default_tts_provider(state: &AppState) -> String {
    if openai_api_key(state).is_some() {
        "openai".to_string()
    } else if elevenlabs_api_key().is_some() {
        "elevenlabs".to_string()
    } else {
        "edge".to_string()
    }
}

fn normalize_tts_provider(value: Option<&str>) -> Option<String> {
    let normalized = value
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .map(|entry| entry.to_lowercase())?;
    match normalized.as_str() {
        "openai" | "elevenlabs" | "edge" => Some(normalized),
        _ => None,
    }
}

fn is_provider_configured(state: &AppState, provider: &str) -> bool {
    match provider {
        "openai" => openai_api_key(state).is_some(),
        "elevenlabs" => elevenlabs_api_key().is_some(),
        "edge" => edge_tts_available(),
        _ => false,
    }
}

fn openai_api_key(state: &AppState) -> Option<String> {
    state
        .config
        .providers
        .get("openai")
        .and_then(|provider| provider.env_api_key.clone())
}

fn elevenlabs_api_key() -> Option<String> {
    std::env::var("ELEVENLABS_API_KEY")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn edge_tts_available() -> bool {
    std::process::Command::new("which")
        .arg("say")
        .output()
        .map(|output| output.status.success())
        .unwrap_or(false)
}

async fn load_tts_prefs() -> Result<TtsPrefs, WsMethodError> {
    let path = tts_prefs_path();
    let loaded = read_json_file::<TtsPrefs>(&path)
        .await
        .map_err(request_failed)?;
    Ok(loaded.unwrap_or_default())
}

async fn write_tts_prefs(prefs: &TtsPrefs) -> Result<(), WsMethodError> {
    write_json_atomic(&tts_prefs_path(), prefs)
        .await
        .map_err(request_failed)
}

async fn load_voicewake_config() -> Result<VoiceWakeConfig, WsMethodError> {
    let path = voicewake_path();
    let loaded = read_json_file::<VoiceWakeConfig>(&path)
        .await
        .map_err(request_failed)?;
    Ok(loaded.unwrap_or_default())
}

async fn set_voicewake_triggers(
    raw_triggers: Vec<String>,
) -> Result<VoiceWakeConfig, WsMethodError> {
    let triggers = normalize_voicewake_triggers(raw_triggers);
    let config = VoiceWakeConfig {
        triggers,
        updated_at_ms: now_ms(),
    };
    write_json_atomic(&voicewake_path(), &config)
        .await
        .map_err(request_failed)?;
    Ok(config)
}

fn normalize_voicewake_triggers(raw: Vec<String>) -> Vec<String> {
    let triggers = raw
        .into_iter()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .map(|value| value.chars().take(64).collect::<String>())
        .take(32)
        .collect::<Vec<_>>();
    if triggers.is_empty() {
        DEFAULT_VOICEWAKE_TRIGGERS
            .iter()
            .map(|value| (*value).to_string())
            .collect()
    } else {
        triggers
    }
}

fn tts_prefs_path() -> PathBuf {
    resolve_state_dir().join("settings").join("tts.json")
}

fn voicewake_path() -> PathBuf {
    resolve_state_dir().join("settings").join("voicewake.json")
}

fn resolve_media_dir() -> PathBuf {
    resolve_state_dir().join("media").join("tts")
}

fn resolve_state_dir() -> PathBuf {
    std::env::var("OPENCLAW_STATE_DIR")
        .ok()
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".openclaw")
        })
}

async fn write_audio_bytes(
    provider: &str,
    extension: &str,
    bytes: &[u8],
) -> Result<String, anyhow::Error> {
    let path = resolve_media_dir().join(format!("{provider}-{}.{}", Uuid::now_v7(), extension));
    ensure_parent_dir(&path).await?;
    tokio::fs::write(&path, bytes).await?;
    Ok(path.to_string_lossy().to_string())
}

async fn ensure_parent_dir(path: &Path) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent).await?;
    }
    Ok(())
}

async fn read_json_file<T>(path: &Path) -> Result<Option<T>, std::io::Error>
where
    T: for<'de> Deserialize<'de>,
{
    match tokio::fs::read(path).await {
        Ok(bytes) => match serde_json::from_slice::<T>(&bytes) {
            Ok(value) => Ok(Some(value)),
            Err(_) => Ok(None),
        },
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(error),
    }
}

async fn write_json_atomic<T>(path: &Path, value: &T) -> Result<(), std::io::Error>
where
    T: Serialize,
{
    ensure_parent_dir(path).await?;
    let bytes = serde_json::to_vec_pretty(value)
        .map_err(|error| std::io::Error::other(error.to_string()))?;
    let tmp_path = path.with_extension(format!("tmp-{}", Uuid::now_v7()));
    tokio::fs::write(&tmp_path, bytes).await?;
    tokio::fs::rename(&tmp_path, path).await?;
    Ok(())
}

fn now_ms() -> i64 {
    chrono::Utc::now().timestamp_millis()
}

fn invalid_request(message: impl Into<String>) -> WsMethodError {
    WsMethodError::InvalidRequest(message.into())
}

fn unavailable(message: impl Into<String>) -> WsMethodError {
    WsMethodError::Unavailable(message.into())
}

fn request_failed(error: impl std::fmt::Display) -> WsMethodError {
    WsMethodError::Unavailable(format!("request failed: {}", error))
}
