use chrono::Utc;
use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex};

#[derive(Clone, Debug, Default)]
pub struct RateLimiter {
    inner: Arc<Mutex<HashMap<String, VecDeque<i64>>>>,
}

#[derive(Clone, Debug)]
pub struct RateLimitDecision {
    pub allowed: bool,
    pub retry_after_secs: u64,
}

impl RateLimiter {
    pub fn check(&self, key: &str, limit_per_minute: u32) -> RateLimitDecision {
        if limit_per_minute == 0 {
            return RateLimitDecision {
                allowed: true,
                retry_after_secs: 0,
            };
        }

        let now_ms = Utc::now().timestamp_millis();
        let window_ms = 60_000_i64;
        let cutoff = now_ms - window_ms;

        let mut guard = match self.inner.lock() {
            Ok(guard) => guard,
            Err(poisoned) => poisoned.into_inner(),
        };

        let bucket = guard.entry(key.to_string()).or_default();
        while let Some(front) = bucket.front() {
            if *front < cutoff {
                bucket.pop_front();
            } else {
                break;
            }
        }

        if bucket.len() >= limit_per_minute as usize {
            let retry_after_secs = bucket
                .front()
                .map(|oldest| ((oldest + window_ms - now_ms).max(1) as u64 + 999) / 1000)
                .unwrap_or(1);
            return RateLimitDecision {
                allowed: false,
                retry_after_secs,
            };
        }

        bucket.push_back(now_ms);

        RateLimitDecision {
            allowed: true,
            retry_after_secs: 0,
        }
    }
}
