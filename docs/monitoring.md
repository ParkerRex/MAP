# Monitoring & Alerting Setup

## Overview

This document outlines the monitoring, logging, and alerting strategy for the Convex-powered Map application.

---

## 1. Convex Dashboard Monitoring

### Built-in Metrics
Convex provides built-in monitoring at `dashboard.convex.dev`:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Function Calls | Total queries/mutations/actions | Spike >200% baseline |
| Function Errors | Failed function executions | >1% error rate |
| Function Latency | P50/P95/P99 latencies | P95 >1s |
| Storage Usage | Database size | >80% quota |
| Bandwidth | Data transfer | >80% quota |
| Scheduler | Scheduled function executions | Failures >0 |

### Key Functions to Monitor
- `tasks:list` - High frequency, should be <50ms
- `chat:createRun` - AI operations, expect higher latency
- `googleCalendar:syncEvents` - External API, expect variability
- `whoop:fullSync` - Long-running, may timeout

---

## 2. Custom Logging

### Sync Log Table
The `syncLogs` table captures integration sync operations:

```typescript
// Logged automatically by integration sync functions
{
  userId: Id<"users">,
  provider: "google" | "whoop",
  status: "success" | "error" | "partial",
  message: string,
  createdAt: number
}
```

### Query for Recent Errors
```typescript
// Dashboard query to find sync errors
db.query("syncLogs")
  .withIndex("by_provider")
  .filter(q => q.eq(q.field("status"), "error"))
  .order("desc")
  .take(50)
```

---

## 3. Health Check Endpoints

### API Health Check
Add to `convex/http.ts`:

```typescript
http.route({
  path: "/health",
  method: "GET",
  handler: async () => {
    return new Response(JSON.stringify({
      status: "healthy",
      timestamp: Date.now(),
      version: process.env.CONVEX_CLOUD_URL
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }
});
```

### External Monitoring
Configure uptime monitoring (e.g., Pingdom, UptimeRobot):
- Endpoint: `https://map.convex.site/health`
- Interval: 1 minute
- Alert: 2 consecutive failures

---

## 4. Error Tracking

### Recommended: Sentry Integration
Add client-side error tracking:

```typescript
// Web client
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

```swift
// iOS client
import Sentry

SentrySDK.start { options in
    options.dsn = "YOUR_SENTRY_DSN"
    options.environment = "production"
    options.tracesSampleRate = 0.1
}
```

### Error Categories to Track
- Authentication failures
- Network errors
- Convex function failures
- Integration sync failures
- HealthKit permission errors

---

## 5. Alerting Rules

### Critical Alerts (Page immediately)
| Condition | Threshold | Action |
|-----------|-----------|--------|
| Error rate | >5% for 5 min | PagerDuty |
| Auth failures | >10/min | PagerDuty |
| Chat streaming errors | >3/min | PagerDuty |
| Database unavailable | Any | PagerDuty |

### Warning Alerts (Slack notification)
| Condition | Threshold | Action |
|-----------|-----------|--------|
| Function latency | P95 >2s | Slack #alerts |
| Sync failures | >5/hour | Slack #alerts |
| Storage usage | >70% | Slack #alerts |
| Rate limit hits | >100/hour | Slack #alerts |

### Info Alerts (Dashboard only)
| Condition | Threshold | Action |
|-----------|-----------|--------|
| New user signup | Any | Log |
| Integration connected | Any | Log |
| Sync completed | Any | Log |

---

## 6. Dashboard Queries

### Active Users (Last 24h)
```typescript
const yesterday = Date.now() - 24 * 60 * 60 * 1000;
db.query("users")
  .filter(q => q.gte(q.field("updatedAt"), yesterday))
  .collect();
```

### Sync Success Rate
```typescript
const hour = Date.now() - 60 * 60 * 1000;
const logs = await db.query("syncLogs")
  .filter(q => q.gte(q.field("createdAt"), hour))
  .collect();

const successRate = logs.filter(l => l.status === "success").length / logs.length;
```

### Chat Activity
```typescript
const today = Date.now() - 24 * 60 * 60 * 1000;
const runs = await db.query("chatRuns")
  .filter(q => q.gte(q.field("createdAt"), today))
  .collect();

const stats = {
  total: runs.length,
  streaming: runs.filter(r => r.status === "streaming").length,
  completed: runs.filter(r => r.status === "done").length,
  errors: runs.filter(r => r.status === "error").length,
};
```

---

## 7. Performance Baselines

### Establish Before Launch
Run load tests to establish baselines:

| Operation | Expected P50 | Expected P95 | Alert at |
|-----------|-------------|--------------|----------|
| tasks:list | 20ms | 50ms | >200ms |
| tasks:create | 30ms | 80ms | >300ms |
| notes:list | 25ms | 60ms | >250ms |
| calendar:listEvents | 40ms | 100ms | >400ms |
| chat:createRun | 100ms | 300ms | >1s |
| health:upsert | 20ms | 50ms | >200ms |

### Load Test Commands
```bash
# Install k6 for load testing
brew install k6

# Run load test
k6 run scripts/load-test.js
```

---

## 8. Incident Response

### Severity Levels
- **P1 (Critical)**: Service down, data loss risk
- **P2 (High)**: Major feature broken, degraded experience
- **P3 (Medium)**: Minor feature issues, workaround exists
- **P4 (Low)**: Cosmetic issues, no user impact

### Response Times
| Severity | Acknowledge | Update | Resolve |
|----------|-------------|--------|---------|
| P1 | 5 min | 15 min | 4 hours |
| P2 | 15 min | 1 hour | 24 hours |
| P3 | 4 hours | 1 day | 1 week |
| P4 | 1 day | 1 week | Best effort |

### Runbook Links
- [Authentication Issues](/docs/runbooks/auth.md)
- [Integration Sync Failures](/docs/runbooks/sync.md)
- [Chat Service Degradation](/docs/runbooks/chat.md)
- [Database Performance](/docs/runbooks/database.md)

---

## 9. Retention Policies

### Sync Logs
- Keep: 30 days
- Action: Auto-delete via scheduled function

```typescript
// convex/maintenance.ts
export const cleanupOldLogs = internalMutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const oldLogs = await ctx.db.query("syncLogs")
      .filter(q => q.lt(q.field("createdAt"), thirtyDaysAgo))
      .take(1000);

    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
  }
});
```

### Chat Messages
- Keep: Indefinitely (user data)
- Archived threads: 90 days after archive

### Health Data
- Keep: Indefinitely (user data)
- Consider: User-initiated export/delete

---

## 10. Pre-Launch Checklist

- [ ] Convex dashboard access for on-call team
- [ ] Sentry project created and integrated
- [ ] PagerDuty escalation policy configured
- [ ] Slack alerting channel created (#map-alerts)
- [ ] Health check endpoint deployed
- [ ] External uptime monitoring configured
- [ ] Performance baselines documented
- [ ] Runbooks written and reviewed
- [ ] On-call rotation scheduled
