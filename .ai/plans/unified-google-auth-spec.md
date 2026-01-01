# Unified Google Sign-In + iOS Authentication Spec

## Overview

Google Sign-In is the **only** authentication method for both web and iOS platforms. A single OAuth flow handles user login AND Google Calendar permissions. iOS stores a session token in Keychain for authenticated API calls to the Map backend.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth method | Google-only | Simplifies codebase, no password management |
| Account matching | By Google ID + email | Store googleId for reliable matching |
| Profile sync | On every login | Always fresh from Google, read-only |
| Session lifetime | 30-day sliding | Extends on activity |
| Multi-device | Independent sessions | Both stay logged in |
| Calendar scopes | All upfront | Read + write during initial auth |
| Claude routing | Backend proxy | Unified, reliable, all calls through /api/claude/* |
| iOS OAuth session | Shared cookies | Faster re-auth using Safari cookies |

---

## Architecture

### Authentication Flow

```
┌──────────────┐         ┌──────────────────┐         ┌─────────────┐
│   iOS App    │         │   Map Backend    │         │   Google    │
└──────┬───────┘         └────────┬─────────┘         └──────┬──────┘
       │                          │                          │
       │ 1. Open OAuth            │                          │
       │ ─────────────────────────>                          │
       │    /api/auth/google?platform=ios                    │
       │                          │                          │
       │                          │ 2. Redirect to Google    │
       │                          │ ─────────────────────────>
       │                          │                          │
       │                          │                          │ 3. User signs in
       │                          │                          │
       │                          │ 4. Callback with code    │
       │                          │ <─────────────────────────
       │                          │                          │
       │                          │ 5. Exchange code         │
       │                          │ ─────────────────────────>
       │                          │                          │
       │                          │ 6. Tokens + user info    │
       │                          │ <─────────────────────────
       │                          │                          │
       │                          │ 7. Find/create user      │
       │                          │    (by googleId)         │
       │                          │    Store calendar tokens │
       │                          │    Sync profile info     │
       │                          │    Create session        │
       │                          │                          │
       │ 8. Redirect with token   │                          │
       │ <─────────────────────────                          │
       │    maphealth://auth/callback?token=<session>        │
       │                          │                          │
       │ 9. Store in Keychain     │                          │
       │                          │                          │
       │ 10. API calls with Bearer│                          │
       │ ─────────────────────────>                          │
       │    Authorization: Bearer <session>                  │
```

### Dual Authentication Support

| Platform | Auth Method | How it Works |
|----------|-------------|--------------|
| Web | Cookie | Session ID stored in HTTP-only cookie |
| iOS | Bearer Token | Session ID in `Authorization: Bearer <token>` header |

Both methods use the same `sessions` table - the session ID is the same, just delivered differently.

---

## iOS Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Welcome                                                 │
│     - Existing screen, no changes                           │
├─────────────────────────────────────────────────────────────┤
│  2. Google Sign-In (NEW)                                    │
│     - "Sign in with Google" button (Google branded)         │
│     - Opens ASWebAuthenticationSession → web OAuth          │
│     - prefersEphemeralWebBrowserSession = false             │
│     - Returns session token → stored in Keychain            │
│     - Cancel → stay on this screen                          │
├─────────────────────────────────────────────────────────────┤
│  3. Disclaimer (CONDENSED)                                  │
│     - Single scrollable screen with all 4 warnings          │
│     - "I Understand" button always enabled                  │
├─────────────────────────────────────────────────────────────┤
│  4. LLM Source Selection                                    │
│     - Keep all options: OpenAI, Claude, Fog, Local          │
│     - If Claude selected → immediately trigger Claude OAuth │
│     - Claude OAuth must complete before proceeding          │
├─────────────────────────────────────────────────────────────┤
│  5. HealthKit Permissions                                   │
│     - Existing screen                                       │
│     - REQUIRED - cannot skip                                │
└─────────────────────────────────────────────────────────────┘

Returning users: If token exists in Keychain → skip straight to main app
```

---

## Web Routes & UX

### Public Routes
- `/` - Landing page (shows dashboard if authenticated)
- `/login` - Google Sign-In button only (minimal: logo, tagline, button)
- `/signup` - Same as /login (keep for SEO/links)
- `/auth/error` - Generic OAuth error page with retry button

### Protected Routes
- All other routes redirect to `/login` if unauthenticated

### UI Elements
- **Login page**: Minimal - logo, tagline, Google branded button
- **OAuth redirect**: Immediate (no loading state)
- **Profile**: Header avatar dropdown with sign-out
- **Settings**: Full page showing connected Google account + sign-out

---

## Error Handling

### OAuth Errors
| Error | Response |
|-------|----------|
| State mismatch (CSRF) | Redirect to /auth/error with generic message |
| Google error | Redirect to /auth/error with "Unable to sign in. Please try again." |
| Network failure (iOS) | Show retry button |

### Session Errors (iOS)
| Error | Response |
|-------|----------|
| 401 from API | Immediate inline re-auth (ASWebAuthenticationSession) |
| Token missing | Navigate to Google Sign-In screen |

### Calendar Access Revoked
- Detect 401 from Google Calendar API
- Show reconnect prompt (calendar-specific, not full re-auth)

---

## Database Schema Changes

### Users Table
```sql
-- Add
googleId TEXT NOT NULL UNIQUE  -- Google's 'sub' claim

-- Remove
passwordHash                    -- No longer needed (Google-only)
```

### Integrations Table
No changes - continue using existing structure for calendar tokens.

### Sessions Table
No changes - works for both cookie and Bearer token auth.

---

## Session Management

| Aspect | Behavior |
|--------|----------|
| Lifetime | 30 days |
| Expiration | Sliding - resets on each authenticated request |
| Multi-device | Independent sessions, both stay logged in |
| Sign-out | Clears auth token only, preserves local cache (iOS) |
| Sign-out all | Not implemented for MVP |

---

## Profile Handling

| Aspect | Behavior |
|--------|----------|
| Profile source | Always Google |
| Sync timing | On every login |
| Fields synced | email, displayName, firstName, lastName, profilePhotoUrl |
| User editing | Not allowed - profile is read-only from Google |

---

## Settings Page

### Web
- Located in header avatar dropdown menu
- Shows connected Google account (email, name, photo)
- Sign out button

### iOS
- Dedicated settings screen (include in this work)
- Shows connected Google account (email, name, photo)
- Sign out button
- Sign out preserves local cached data

---

## Code Cleanup

### Files to Delete
- `src/lib/auth/password.ts` - No longer needed

### Routes to Remove
- `/api/google/auth` - Old calendar-only OAuth (replaced by unified auth)
- `/api/google/callback` - Old calendar-only callback

---

## Implementation Notes

### Local Development
- Use ngrok or similar tunnel for OAuth callback
- Google OAuth requires real URL (localhost works if configured in Google Console)

### Testing
- Integration tests with mocked Google responses
- Comprehensive auth logging for debugging

### Deployment
- Environment variables already configured in production
- Deploy fully enabled (no feature flag)
- All platforms can be implemented in parallel

---

## Security

1. **CSRF Protection** - State parameter validated in callback
2. **Secure Cookies** - HTTP-only, Secure flag in production
3. **Keychain Storage** - iOS tokens stored securely
4. **Token Expiry** - 30-day sessions with sliding expiration
5. **Comprehensive Logging** - All auth events logged for monitoring

---

## Out of Scope

- Rate limiting (defer to security hardening pass)
- Analytics/metrics (defer)
- WHOOP integration changes
- Sign out all devices feature
- Profile editing

---

## Testing Checklist

### Backend
- [ ] Google OAuth creates new user (by googleId)
- [ ] Google OAuth logs in existing user (matches googleId)
- [ ] Profile synced on every login
- [ ] Bearer token authentication works
- [ ] Cookie authentication works
- [ ] Calendar tokens stored in integrations table
- [ ] 401 returned for invalid/expired sessions

### iOS
- [ ] Google Sign-In opens OAuth with shared Safari cookies
- [ ] Successful auth stores token in Keychain
- [ ] Token persists across app restarts
- [ ] Returning user skips to main app
- [ ] Cancel on Google Sign-In stays on same screen
- [ ] 401 triggers inline re-auth flow
- [ ] Sign out clears token but preserves local data
- [ ] Claude OAuth inline during onboarding
- [ ] Cannot proceed with Claude selected until OAuth complete
- [ ] HealthKit permissions required

### Web
- [ ] /login shows Google branded button
- [ ] /signup shows same Google button
- [ ] Immediate redirect to Google (no loading state)
- [ ] Redirect to / after successful login
- [ ] / shows dashboard if authenticated
- [ ] / shows landing page if not authenticated
- [ ] Protected routes redirect to /login
- [ ] Header avatar dropdown with profile and sign-out
- [ ] Settings page shows connected account
- [ ] /auth/error page shows generic error with retry
