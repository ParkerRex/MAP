use std::collections::HashMap;
use std::env;
use std::path::PathBuf;

#[derive(Clone, Debug)]
pub struct AuthTokenConfig {
    pub token: String,
    pub subject: String,
    pub scopes: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct ProviderConfig {
    pub provider: String,
    pub base_url: String,
    pub env_api_key: Option<String>,
}

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub host: String,
    pub port: u16,
    pub database_url: String,
    pub agent_id: String,
    pub main_key: String,
    pub dm_scope: String,
    pub openclaw_ref_commit: String,
    #[allow(dead_code)]
    pub auth_token: Option<String>,
    pub auth_tokens: Vec<AuthTokenConfig>,
    pub primary_model: String,
    pub fallback_models: Vec<String>,
    pub providers: HashMap<String, ProviderConfig>,
    pub skills_workspace_dir: PathBuf,
    pub skills_managed_dir: PathBuf,
    pub skills_bundled_dir: PathBuf,
    pub cron_poll_interval_secs: u64,
    pub http_rate_limit_per_minute: u32,
    pub ws_rate_limit_per_minute: u32,
    pub ws_resume_max_events: i64,
    pub idempotency_ttl_secs: i64,
}

fn parse_csv(value: Option<String>) -> Vec<String> {
    value
        .unwrap_or_default()
        .split(',')
        .map(|item| item.trim().to_string())
        .filter(|item| !item.is_empty())
        .collect()
}

fn normalize_base_url(url: &str) -> String {
    if url.ends_with('/') {
        url.trim_end_matches('/').to_string()
    } else {
        url.to_string()
    }
}

fn parse_scoped_tokens(value: Option<String>) -> Vec<AuthTokenConfig> {
    let Some(value) = value else {
        return Vec::new();
    };

    value
        .split(';')
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .filter_map(|entry| {
            let mut parts = entry.split('|').map(str::trim);
            let token = parts.next().unwrap_or_default().to_string();
            if token.is_empty() {
                return None;
            }

            let scopes = parts
                .next()
                .map(|scope_csv| {
                    scope_csv
                        .split(',')
                        .map(|scope| scope.trim().to_string())
                        .filter(|scope| !scope.is_empty())
                        .collect::<Vec<_>>()
                })
                .filter(|scopes| !scopes.is_empty())
                .unwrap_or_else(|| vec!["*".to_string()]);

            let subject = parts
                .next()
                .map(|subject| subject.trim().to_string())
                .filter(|subject| !subject.is_empty())
                .unwrap_or_else(|| {
                    use sha2::{Digest, Sha256};
                    let mut hasher = Sha256::new();
                    hasher.update(token.as_bytes());
                    let digest = hex::encode(hasher.finalize());
                    format!("token:{}", &digest[..16])
                });

            Some(AuthTokenConfig {
                token,
                subject,
                scopes,
            })
        })
        .collect()
}

impl AppConfig {
    pub fn from_env() -> anyhow::Result<Self> {
        let host = env::var("RUST_GATEWAY_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let port = env::var("RUST_GATEWAY_PORT")
            .ok()
            .and_then(|value| value.parse::<u16>().ok())
            .unwrap_or(18_789);

        let database_url = env::var("RUST_GATEWAY_DATABASE_URL")
            .or_else(|_| env::var("DATABASE_URL"))
            .map_err(|_| {
                anyhow::anyhow!("RUST_GATEWAY_DATABASE_URL or DATABASE_URL is required")
            })?;

        let agent_id = env::var("RUST_GATEWAY_AGENT_ID")
            .map(|value| value.trim().to_string())
            .ok()
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "main".to_string());

        let main_key = env::var("RUST_GATEWAY_MAIN_KEY")
            .map(|value| value.trim().to_string())
            .ok()
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "main".to_string());

        let dm_scope = env::var("RUST_GATEWAY_DM_SCOPE")
            .map(|value| value.trim().to_lowercase())
            .ok()
            .filter(|value| !value.is_empty())
            .unwrap_or_else(|| "main".to_string());

        let openclaw_ref_commit = env::var("OPENCLAW_REF_COMMIT")
            .unwrap_or_else(|_| "8c963dc5a680f74cd7a7143263e9ec7d047404c0".to_string());

        let auth_token = env::var("RUST_GATEWAY_AUTH_TOKEN")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let mut auth_tokens = parse_scoped_tokens(env::var("RUST_GATEWAY_AUTH_SCOPED_TOKENS").ok());
        if auth_tokens.is_empty() {
            if let Some(token) = auth_token.as_ref() {
                auth_tokens.push(AuthTokenConfig {
                    token: token.clone(),
                    subject: "gateway-legacy-token".to_string(),
                    scopes: vec!["*".to_string()],
                });
            }
        }

        let moonshot_key = env::var("KIMI_API_KEY")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let openai_key = env::var("OPENAI_API_KEY")
            .ok()
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());

        let default_primary = if moonshot_key.is_some() {
            env::var("KIMI_MODEL")
                .ok()
                .filter(|value| !value.trim().is_empty())
                .map(|value| format!("moonshot:{}", value.trim()))
                .unwrap_or_else(|| "moonshot:kimi-k2-0711-preview".to_string())
        } else {
            "openai:gpt-4o-mini".to_string()
        };

        let primary_model = env::var("RUST_GATEWAY_PRIMARY_MODEL").unwrap_or(default_primary);

        let fallback_models = {
            let configured = parse_csv(env::var("RUST_GATEWAY_FALLBACK_MODELS").ok());
            if !configured.is_empty() {
                configured
            } else if primary_model.starts_with("moonshot:") {
                vec!["openai:gpt-4o-mini".to_string()]
            } else {
                vec!["moonshot:kimi-k2-0711-preview".to_string()]
            }
        };

        let moonshot_base = normalize_base_url(
            &env::var("KIMI_BASE_URL").unwrap_or_else(|_| "https://api.moonshot.ai/v1".to_string()),
        );
        let openai_base = normalize_base_url(
            &env::var("OPENAI_BASE_URL")
                .unwrap_or_else(|_| "https://api.openai.com/v1".to_string()),
        );

        let mut providers = HashMap::new();
        providers.insert(
            "moonshot".to_string(),
            ProviderConfig {
                provider: "moonshot".to_string(),
                base_url: moonshot_base,
                env_api_key: moonshot_key,
            },
        );
        providers.insert(
            "openai".to_string(),
            ProviderConfig {
                provider: "openai".to_string(),
                base_url: openai_base,
                env_api_key: openai_key,
            },
        );

        let skills_workspace_dir = env::var("RUST_GATEWAY_SKILLS_WORKSPACE_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("./skills"));
        let skills_managed_dir = env::var("RUST_GATEWAY_SKILLS_MANAGED_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                dirs::home_dir()
                    .unwrap_or_else(|| PathBuf::from("."))
                    .join(".openclaw")
                    .join("skills")
            });
        let skills_bundled_dir = env::var("RUST_GATEWAY_SKILLS_BUNDLED_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(".ai/refs/openclaw/skills"));

        let cron_poll_interval_secs = env::var("RUST_GATEWAY_CRON_POLL_INTERVAL_SECS")
            .ok()
            .and_then(|value| value.parse::<u64>().ok())
            .unwrap_or(10);
        let http_rate_limit_per_minute = env::var("RUST_GATEWAY_HTTP_RATE_LIMIT_PER_MINUTE")
            .ok()
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(600);
        let ws_rate_limit_per_minute = env::var("RUST_GATEWAY_WS_RATE_LIMIT_PER_MINUTE")
            .ok()
            .and_then(|value| value.parse::<u32>().ok())
            .unwrap_or(240);
        let ws_resume_max_events = env::var("RUST_GATEWAY_WS_RESUME_MAX_EVENTS")
            .ok()
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(500)
            .clamp(1, 5_000);
        let idempotency_ttl_secs = env::var("RUST_GATEWAY_IDEMPOTENCY_TTL_SECS")
            .ok()
            .and_then(|value| value.parse::<i64>().ok())
            .unwrap_or(86_400)
            .max(60);

        Ok(Self {
            host,
            port,
            database_url,
            agent_id,
            main_key,
            dm_scope,
            openclaw_ref_commit,
            auth_token,
            auth_tokens,
            primary_model,
            fallback_models,
            providers,
            skills_workspace_dir,
            skills_managed_dir,
            skills_bundled_dir,
            cron_poll_interval_secs,
            http_rate_limit_per_minute,
            ws_rate_limit_per_minute,
            ws_resume_max_events,
            idempotency_ttl_secs,
        })
    }
}
