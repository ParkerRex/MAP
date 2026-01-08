# End-to-End Test Plan

## Overview

This test plan covers the Convex migration for both web and iOS platforms. All tests should pass before hard cutover.

## Test Environments

- **Dev**: `map-dev.convex.cloud` - Active development
- **Staging**: `map-staging.convex.cloud` - Pre-production testing
- **Production**: `map.convex.cloud` - Live environment

---

## 1. Authentication Tests

### 1.1 Web OAuth Flow
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Google sign-in | Click Sign In → Select Google account | Redirected to dashboard, session created |
| Session persistence | Sign in → Close browser → Reopen | Session still valid |
| Sign out | Click Sign Out | Session cleared, redirected to login |
| Token refresh | Wait for token to near expiry | Token automatically refreshed |
| Invalid session | Use expired token | Redirected to login |

### 1.2 iOS OAuth Flow
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Google sign-in | Tap Sign In → ASWebAuthenticationSession | Returns to app authenticated |
| Token storage | Sign in → Close app → Reopen | Session restored from Keychain |
| Sign out | Tap Sign Out | Token cleared, shows login |
| Background auth | App backgrounded with expired token | Token refreshed on foreground |

---

## 2. Task Module Tests

### 2.1 Web Tasks
| Test | Steps | Expected Result |
|------|-------|-----------------|
| List tasks | Navigate to Tasks | All user tasks displayed |
| Create task | Click Add → Enter title → Save | Task appears in list |
| Update task | Click task → Edit → Save | Changes reflected |
| Toggle complete | Click checkbox | Status toggles, completedAt updated |
| Delete task | Click Delete → Confirm | Task removed (soft delete) |
| Realtime update | Create task in another tab | Both tabs show new task |

### 2.2 iOS Tasks
| Test | Steps | Expected Result |
|------|-------|-----------------|
| List tasks | Open Tasks tab | All tasks displayed |
| Create task | Tap + → Enter title → Save | Task appears in list |
| Toggle complete | Tap checkbox | Status updates |
| Offline create | Airplane mode → Create task → Restore | Task synced when online |
| Subscription | Edit task in web | iOS reflects change |

---

## 3. Notes Module Tests

### 3.1 Web Notes
| Test | Steps | Expected Result |
|------|-------|-----------------|
| List notes | Navigate to Notes | All notes displayed |
| Create note | Click New → Enter content → Save | Note created |
| Search notes | Type in search bar | Matching notes shown |
| Full-text search | Search content substring | Matches in title and content |
| Folder organization | Create folder → Move note | Note in folder |

### 3.2 iOS Notes
| Test | Steps | Expected Result |
|------|-------|-----------------|
| List notes | Open Notes tab | Notes displayed |
| Create note | Tap + → Write → Save | Note created |
| Search | Type in search | Real-time filtering |
| Edit note | Tap note → Edit → Save | Changes saved |

---

## 4. Calendar Module Tests

### 4.1 Calendar Sync
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Initial sync | Connect Google Calendar | All calendars/events imported |
| Incremental sync | Add event in Google | Event appears in app |
| Event CRUD | Create/edit/delete local event | Changes persisted |
| Multi-calendar | Select multiple calendars | Events from all shown |
| Sync token | Trigger sync twice | Second sync uses syncToken |

### 4.2 Event Display
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Day view | Navigate to specific date | Events for that day shown |
| Week view | Select week view | Week events displayed |
| All-day events | Create all-day event | Displayed correctly |
| Recurring events | View recurring event | All instances shown |

---

## 5. Health Module Tests

### 5.1 Apple Health Sync (iOS)
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Initial sync | Grant HealthKit permissions | Last 14 days synced |
| Daily sync | Wait for background sync | Today's data updated |
| Metric coverage | Check each metric | All 20+ metrics synced |
| Sleep stages | View sleep data | Stages (REM, Deep, Core) shown |

### 5.2 WHOOP Integration
| Test | Steps | Expected Result |
|------|-------|-----------------|
| OAuth connect | Click Connect WHOOP | OAuth flow completes |
| Profile sync | After connection | Profile data imported |
| Recovery sync | Trigger sync | Recovery scores imported |
| Sleep sync | Trigger sync | Sleep metrics imported |
| Workout sync | Trigger sync | Workouts imported |
| Disconnect | Click Disconnect | Integration removed, data cleared |

### 5.3 Health Dashboard
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Summary view | Open Health tab | 7-day averages shown |
| Trend charts | View trends | Charts display correctly |
| Metric detail | Tap metric | Detailed history shown |

---

## 6. AI Chat Tests

### 6.1 Chat Functionality
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Create thread | Click New Chat | Thread created |
| Send message | Type message → Send | Message appears |
| Streaming response | Send message | Response streams in real-time |
| Thread history | View previous threads | History preserved |
| Message search | Search messages | Matches found |

### 6.2 File Attachments
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Upload file | Attach file to message | File uploaded |
| File size limit | Attach >8MB file | Error shown |
| File types | Attach PDF, image, text | All supported |

### 6.3 Rate Limiting
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Message rate limit | Send 13 messages/min | Rate limited after 12 |
| Thread rate limit | Create 31 threads/min | Rate limited after 30 |

---

## 7. Goals Module Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| List goals | Navigate to Goals | Goals by category |
| Create goal | Add goal in category | Goal created |
| Toggle complete | Mark goal complete | Status updated |
| Filter by status | Filter pending/completed | Correct filtering |
| Filter by category | Select category | Only that category shown |

---

## 8. Integration Tests

### 8.1 Google Integration
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Status check | Query integration status | Connected status returned |
| Token refresh | Wait for expiry | Token auto-refreshes |
| Disconnect | Disconnect Google | Integration removed |
| Reconnect | Reconnect after disconnect | Full functionality restored |

### 8.2 Cross-Platform Sync
| Test | Steps | Expected Result |
|------|-------|-----------------|
| Web to iOS | Create task on web | Appears on iOS |
| iOS to web | Create note on iOS | Appears on web |
| Concurrent edit | Edit same item on both | Last write wins, no data loss |

---

## 9. Performance Tests

| Test | Target | Method |
|------|--------|--------|
| Query latency | <100ms | Measure task list query |
| Mutation latency | <200ms | Measure task create |
| Chat streaming | First token <500ms | Measure time to first token |
| Bulk sync | <5s for 30 days | Measure WHOOP full sync |
| Subscription update | <100ms | Measure realtime propagation |

---

## 10. Security Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Data isolation | Query other user's data | Access denied |
| Token validation | Use invalid token | 401 returned |
| SQL injection | Inject in search | Safely handled |
| XSS in notes | Add script tag | Sanitized output |
| Rate limiting | Flood requests | Rate limited |

---

## 11. Error Handling Tests

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Network failure | Disconnect network | Graceful error shown |
| Server error | Trigger 500 | Error message displayed |
| Invalid input | Submit malformed data | Validation error |
| Session expired | Wait for expiry | Re-auth prompt |

---

## Test Execution Checklist

### Pre-Launch
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Performance benchmarks met
- [ ] Security scan completed
- [ ] Manual QA sign-off (web)
- [ ] Manual QA sign-off (iOS)
- [ ] Load testing completed

### Launch Day
- [ ] Staging environment verified
- [ ] Production deployment ready
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured
- [ ] Support team briefed
