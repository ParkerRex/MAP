use crate::config::AppConfig;
use crate::rate_limit::RateLimiter;
use crate::telemetry::GatewayMetrics;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use tokio::sync::Notify;
use uuid::Uuid;

#[derive(Debug, Default)]
struct RunCancellationState {
    cancelled: AtomicBool,
    notify: Notify,
}

#[derive(Debug, Clone)]
pub struct RunCancellationToken {
    inner: Arc<RunCancellationState>,
}

impl RunCancellationToken {
    fn new() -> Self {
        Self {
            inner: Arc::new(RunCancellationState::default()),
        }
    }

    pub fn cancel(&self) {
        if !self.inner.cancelled.swap(true, Ordering::SeqCst) {
            self.inner.notify.notify_waiters();
        }
    }

    pub fn is_cancelled(&self) -> bool {
        self.inner.cancelled.load(Ordering::SeqCst)
    }

    pub async fn cancelled(&self) {
        if self.is_cancelled() {
            return;
        }

        let notified = self.inner.notify.notified();
        if self.is_cancelled() {
            return;
        }
        notified.await;
    }
}

#[derive(Debug, Clone, Default)]
pub struct RunCancellationRegistry {
    inner: Arc<Mutex<HashMap<Uuid, RunCancellationToken>>>,
}

impl RunCancellationRegistry {
    pub fn register(&self, run_id: Uuid) -> RunCancellationGuard {
        let token = RunCancellationToken::new();
        let mut guard = self.inner.lock().expect("run cancellation mutex poisoned");
        guard.insert(run_id, token.clone());
        drop(guard);

        RunCancellationGuard {
            run_id,
            registry: self.clone(),
            token,
        }
    }

    pub fn cancel(&self, run_id: Uuid) -> bool {
        let token = {
            let guard = self.inner.lock().expect("run cancellation mutex poisoned");
            guard.get(&run_id).cloned()
        };
        if let Some(token) = token {
            token.cancel();
            return true;
        }
        false
    }

    fn unregister(&self, run_id: Uuid) {
        let mut guard = self.inner.lock().expect("run cancellation mutex poisoned");
        guard.remove(&run_id);
    }
}

#[derive(Debug)]
pub struct RunCancellationGuard {
    run_id: Uuid,
    registry: RunCancellationRegistry,
    token: RunCancellationToken,
}

impl RunCancellationGuard {
    pub fn token(&self) -> RunCancellationToken {
        self.token.clone()
    }
}

impl Drop for RunCancellationGuard {
    fn drop(&mut self) {
        self.registry.unregister(self.run_id);
    }
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    pub config: AppConfig,
    pub http: reqwest::Client,
    pub run_cancellations: RunCancellationRegistry,
    pub metrics: GatewayMetrics,
    pub rate_limiter: RateLimiter,
    pub started_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::RunCancellationRegistry;
    use std::time::Duration;
    use tokio::time::timeout;
    use uuid::Uuid;

    #[tokio::test]
    async fn cancellation_token_notifies_waiters() {
        let registry = RunCancellationRegistry::default();
        let run_id = Uuid::now_v7();
        let guard = registry.register(run_id);
        let token = guard.token();

        let waiter = tokio::spawn(async move {
            token.cancelled().await;
        });

        registry.cancel(run_id);
        timeout(Duration::from_secs(1), waiter)
            .await
            .expect("waiter timed out")
            .expect("waiter task failed");
    }

    #[test]
    fn registry_unregisters_on_guard_drop() {
        let registry = RunCancellationRegistry::default();
        let run_id = Uuid::now_v7();

        let guard = registry.register(run_id);
        assert!(registry.cancel(run_id));

        drop(guard);
        assert!(!registry.cancel(run_id));
    }
}
