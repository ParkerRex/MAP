use chrono::{DateTime, Utc};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicI64, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub struct GatewayMetrics {
    inner: Arc<GatewayMetricsInner>,
}

#[derive(Default)]
struct GatewayMetricsInner {
    http_requests_total: AtomicU64,
    http_errors_total: AtomicU64,
    ws_connections_total: AtomicU64,
    ws_active_connections: AtomicI64,
    ws_requests_total: AtomicU64,
    ws_errors_total: AtomicU64,
    ws_events_total: AtomicU64,
    chat_runs_total: AtomicU64,
    chat_resume_requests_total: AtomicU64,
    idempotency_hits_total: AtomicU64,
    idempotency_misses_total: AtomicU64,
    rate_limited_total: AtomicU64,
    method_counts: Mutex<HashMap<String, u64>>,
}

#[derive(Debug, Serialize)]
pub struct MetricsSnapshot {
    pub collected_at: String,
    pub started_at: String,
    pub uptime_secs: i64,
    pub counters: MetricsCounters,
    pub method_counts: HashMap<String, u64>,
}

#[derive(Debug, Serialize)]
pub struct MetricsCounters {
    pub http_requests_total: u64,
    pub http_errors_total: u64,
    pub ws_connections_total: u64,
    pub ws_active_connections: i64,
    pub ws_requests_total: u64,
    pub ws_errors_total: u64,
    pub ws_events_total: u64,
    pub chat_runs_total: u64,
    pub chat_resume_requests_total: u64,
    pub idempotency_hits_total: u64,
    pub idempotency_misses_total: u64,
    pub rate_limited_total: u64,
}

impl GatewayMetrics {
    pub fn inc_http_request(&self, method: &str, path: &str) {
        self.inner
            .http_requests_total
            .fetch_add(1, Ordering::Relaxed);
        self.inc_method_count(&format!("http:{method}:{path}"));
    }

    pub fn inc_http_error(&self) {
        self.inner.http_errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_ws_connection_open(&self) {
        self.inner
            .ws_connections_total
            .fetch_add(1, Ordering::Relaxed);
        self.inner
            .ws_active_connections
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_ws_connection_close(&self) {
        self.inner
            .ws_active_connections
            .fetch_sub(1, Ordering::Relaxed);
    }

    pub fn inc_ws_request(&self, method: &str) {
        self.inner.ws_requests_total.fetch_add(1, Ordering::Relaxed);
        self.inc_method_count(&format!("ws:{method}"));
    }

    pub fn inc_ws_error(&self) {
        self.inner.ws_errors_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_ws_event(&self, event: &str) {
        self.inner.ws_events_total.fetch_add(1, Ordering::Relaxed);
        self.inc_method_count(&format!("event:{event}"));
    }

    pub fn inc_chat_run(&self) {
        self.inner.chat_runs_total.fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_chat_resume_request(&self) {
        self.inner
            .chat_resume_requests_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_idempotency_hit(&self) {
        self.inner
            .idempotency_hits_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_idempotency_miss(&self) {
        self.inner
            .idempotency_misses_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn inc_rate_limited(&self) {
        self.inner
            .rate_limited_total
            .fetch_add(1, Ordering::Relaxed);
    }

    pub fn snapshot(&self, started_at: DateTime<Utc>) -> MetricsSnapshot {
        let now = Utc::now();
        let method_counts = match self.inner.method_counts.lock() {
            Ok(guard) => guard.clone(),
            Err(poisoned) => poisoned.into_inner().clone(),
        };

        MetricsSnapshot {
            collected_at: now.to_rfc3339(),
            started_at: started_at.to_rfc3339(),
            uptime_secs: (now - started_at).num_seconds(),
            counters: MetricsCounters {
                http_requests_total: self.inner.http_requests_total.load(Ordering::Relaxed),
                http_errors_total: self.inner.http_errors_total.load(Ordering::Relaxed),
                ws_connections_total: self.inner.ws_connections_total.load(Ordering::Relaxed),
                ws_active_connections: self.inner.ws_active_connections.load(Ordering::Relaxed),
                ws_requests_total: self.inner.ws_requests_total.load(Ordering::Relaxed),
                ws_errors_total: self.inner.ws_errors_total.load(Ordering::Relaxed),
                ws_events_total: self.inner.ws_events_total.load(Ordering::Relaxed),
                chat_runs_total: self.inner.chat_runs_total.load(Ordering::Relaxed),
                chat_resume_requests_total: self
                    .inner
                    .chat_resume_requests_total
                    .load(Ordering::Relaxed),
                idempotency_hits_total: self.inner.idempotency_hits_total.load(Ordering::Relaxed),
                idempotency_misses_total: self
                    .inner
                    .idempotency_misses_total
                    .load(Ordering::Relaxed),
                rate_limited_total: self.inner.rate_limited_total.load(Ordering::Relaxed),
            },
            method_counts,
        }
    }

    fn inc_method_count(&self, key: &str) {
        let mut guard = match self.inner.method_counts.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };
        *guard.entry(key.to_string()).or_insert(0) += 1;
    }
}
