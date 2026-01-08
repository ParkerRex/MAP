# Hard Cutover Checklist

## Overview

This checklist covers the hard cutover from the legacy backend to the new Convex-powered system. No dual-write or phased migration - this is a clean cut.

---

## Pre-Cutover (T-7 Days)

### Code Freeze
- [ ] Feature freeze on legacy system
- [ ] Only critical bug fixes allowed
- [ ] All Convex features code complete
- [ ] All tests passing

### Environment Preparation
- [ ] Production Convex project created
- [ ] Environment variables configured
- [ ] Secrets rotated and stored securely
- [ ] DNS/CDN configuration ready

### Data Preparation
- [ ] Data export scripts tested
- [ ] Data import scripts tested
- [ ] Data validation scripts ready
- [ ] Rollback scripts prepared

### Team Readiness
- [ ] Cutover runbook reviewed by all
- [ ] On-call schedule confirmed
- [ ] Communication plan finalized
- [ ] Support team briefed

---

## Pre-Cutover (T-2 Days)

### Final Testing
- [ ] Full E2E test suite passing
- [ ] Load test completed successfully
- [ ] Security scan completed
- [ ] iOS TestFlight build validated
- [ ] Web staging fully tested

### Staging Validation
- [ ] Staging environment mirrors production
- [ ] Sample data imported to staging
- [ ] Full user journey tested
- [ ] Integration syncs working

### External Dependencies
- [ ] Google OAuth redirect URIs updated
- [ ] WHOOP OAuth redirect URIs updated
- [ ] DNS TTL lowered to 5 minutes
- [ ] CDN cache rules configured

---

## Cutover Day (T-0)

### Pre-Cutover (Morning)
**Owner: Tech Lead**

- [ ] Send internal "cutover starting" notification
- [ ] Verify all team members available
- [ ] Confirm monitoring dashboards ready
- [ ] Open incident bridge (Slack channel)

### Phase 1: Legacy Shutdown (T+0)
**Owner: Backend Lead**
**Duration: 15 minutes**

- [ ] Enable maintenance mode on legacy system
- [ ] Stop background workers
- [ ] Capture final database snapshot
- [ ] Verify no active sessions/requests

### Phase 2: Data Export (T+15min)
**Owner: Backend Lead**
**Duration: 30 minutes**

- [ ] Export users table
- [ ] Export tasks table
- [ ] Export notes table
- [ ] Export goals table
- [ ] Export calendar data
- [ ] Export health data
- [ ] Export chat history
- [ ] Export integration tokens
- [ ] Verify export completeness

### Phase 3: Data Import (T+45min)
**Owner: Backend Lead**
**Duration: 45 minutes**

- [ ] Run Convex data import script
- [ ] Import users
- [ ] Import tasks
- [ ] Import notes
- [ ] Import goals
- [ ] Import calendar events
- [ ] Import health data
- [ ] Import chat threads/messages
- [ ] Import integrations (re-encrypt tokens)
- [ ] Verify import completeness
- [ ] Run data validation checks

### Phase 4: DNS Switch (T+1h30min)
**Owner: DevOps**
**Duration: 15 minutes**

- [ ] Update DNS records for web
- [ ] Update API endpoint (if changed)
- [ ] Verify DNS propagation
- [ ] Clear CDN cache

### Phase 5: Web Deployment (T+1h45min)
**Owner: Web Lead**
**Duration: 15 minutes**

- [ ] Deploy TanStack Start app
- [ ] Verify health check endpoint
- [ ] Test authentication flow
- [ ] Test core functionality

### Phase 6: iOS Release (T+2h)
**Owner: iOS Lead**
**Duration: Variable (App Store review)**

- [ ] Submit iOS build to App Store
- [ ] Request expedited review if needed
- [ ] Monitor review status
- [ ] Release when approved

### Phase 7: Validation (T+2h15min)
**Owner: QA Lead**
**Duration: 30 minutes**

- [ ] Test user login (web)
- [ ] Test user login (iOS)
- [ ] Verify data migrated correctly
- [ ] Test task CRUD
- [ ] Test notes CRUD
- [ ] Test calendar sync
- [ ] Test health data display
- [ ] Test AI chat
- [ ] Verify integrations reconnect

### Phase 8: Go Live (T+2h45min)
**Owner: Tech Lead**

- [ ] Disable maintenance mode
- [ ] Send "cutover complete" notification
- [ ] Monitor for errors
- [ ] Respond to user reports

---

## Post-Cutover (T+1 Day)

### Monitoring
- [ ] Review error rates
- [ ] Review performance metrics
- [ ] Check integration sync status
- [ ] Review user feedback

### Cleanup
- [ ] Archive legacy database
- [ ] Remove legacy API endpoints
- [ ] Update documentation
- [ ] Close cutover incident

### Communication
- [ ] Send user notification (if needed)
- [ ] Update status page
- [ ] Post internal retrospective

---

## Rollback Plan

### Decision Criteria
Rollback if ANY of these occur:
- Data loss detected
- >10% users unable to authenticate
- Core functionality broken for >1 hour
- Critical security issue discovered

### Rollback Steps
**Duration: 30 minutes**

1. **Announce Rollback**
   - [ ] Notify team on incident bridge
   - [ ] Enable maintenance mode on new system

2. **DNS Revert**
   - [ ] Point DNS back to legacy
   - [ ] Clear CDN cache

3. **Restore Legacy**
   - [ ] Restore from pre-cutover snapshot
   - [ ] Start legacy workers
   - [ ] Disable maintenance mode

4. **Validate**
   - [ ] Test authentication
   - [ ] Test core functionality
   - [ ] Verify data intact

5. **Post-Mortem**
   - [ ] Document what failed
   - [ ] Plan fixes
   - [ ] Schedule retry

---

## Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| Tech Lead | TBD | xxx-xxx-xxxx | @techlead |
| Backend Lead | TBD | xxx-xxx-xxxx | @backend |
| iOS Lead | TBD | xxx-xxx-xxxx | @ios |
| Web Lead | TBD | xxx-xxx-xxxx | @web |
| DevOps | TBD | xxx-xxx-xxxx | @devops |
| QA Lead | TBD | xxx-xxx-xxxx | @qa |

---

## Communication Templates

### Maintenance Mode Message
```
Map is undergoing scheduled maintenance to improve your experience.
We expect to be back online within 3 hours.
Thank you for your patience.
```

### Cutover Complete Message (Internal)
```
🎉 Convex Migration Complete!

The hard cutover is complete. All systems are running on the new Convex backend.

Monitoring dashboard: [link]
Incident channel: #map-cutover

Please report any issues immediately.
```

### User Communication (If Needed)
```
We've upgraded Map to a new, faster backend!

What's new:
- Faster sync across all devices
- Improved real-time updates
- Better reliability

If you experience any issues, please contact support@map.ai

Thank you for using Map!
```

---

## Success Metrics

### Cutover Success Criteria
- [ ] Zero data loss
- [ ] <5 minutes unplanned downtime
- [ ] <1% increase in error rate post-cutover
- [ ] All integrations reconnected within 1 hour
- [ ] No P1 incidents within 24 hours

### Post-Cutover KPIs (7-Day)
- Error rate: <0.5%
- P95 latency: <100ms for reads
- User retention: No significant drop
- Support tickets: <10 cutover-related
