# Formosa ESG 2026 Worker API — Endpoint Reference

**Version:** v1.0  
**Date:** 2026-04-04  
**Language:** Engineering Documentation (工程語言)  
**Audience:** Developers, QA Testers, Integration Partners  

---

## Table of Contents

1. [Base URL & Access](#base-url--access)
2. [Public Endpoints](#public-endpoints)
3. [Admin Endpoints](#admin-endpoints)
4. [Cron Jobs](#cron-jobs)
5. [Global Endpoints](#global-endpoints)
6. [Authentication](#authentication)
7. [Rate Limits](#rate-limits)
8. [Response Format](#response-format)
9. [Constants Reference](#constants-reference)
10. [Level System](#level-system)
11. [Carbon Coefficients](#carbon-coefficients)
12. [Three-Tier Authorization](#three-tier-authorization)

---

## Base URL & Access

### Production Environment
- **Primary:** `https://api.paulkuo.tw`
- **Alternative:** `https://mazu.today` (reverse proxy)

All API requests must use HTTPS. Requests to HTTP endpoints will fail.

---

## Public Endpoints

No authentication required for these endpoints.

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| POST | `/api/formosa/webhook` | handleFormosaWebhook | LINE Bot webhook (follow, unfollow, message, postback) |
| POST | `/api/formosa/submit` | handleFormosaSubmit | Submit survey response (Q1–Q10) |
| POST | `/api/formosa/checkin` | handleFormosaCheckin | GPS check-in with KV buffer |
| POST | `/api/formosa/track/sync` | handleFormosaTrackSync | Batch GPS track synchronization |
| POST | `/api/formosa/user/sync` | handleFormosaUserSync | Sync user profile data |
| GET | `/api/formosa/photos/count` | handleFormosaPhotoCount | Retrieve photo count per user |
| POST | `/api/formosa/user/phone` | handleFormosaPhoneUpdate | Update user phone number |
| POST | `/api/formosa/og-image` | handleFormosaOgImage | Generate OG share card image |
| GET | `/api/formosa/og/{userId}.png` | handleFormosaOgServe | Serve cached OG image |
| GET | `/api/formosa/data` | handleFormosaData | Fetch latest GPS points for dashboard |
| GET | `/api/formosa/user/{userId}` | handleFormosaUser | Retrieve user profile + activity statistics |
| POST | `/api/formosa/privacy` | handleFormosaPrivacyAgree | Record privacy consent |
| POST | `/api/formosa/participant-status` | handleFormosaParticipantStatus | Update participant status (active/completed/withdrawn) |
| POST | `/api/formosa/feedback` | handleFormosaFeedback | Submit user feedback |
| GET | `/api/formosa/feedback` | handleFormosaFeedbackList | List feedback entries (admin context) |
| POST | `/api/formosa/feedback-upload` | handleFormosaFeedbackUpload | Upload feedback screenshot |
| GET | `/api/formosa/feedback/status` | handleFormosaFeedbackPublicStatus | Retrieve public feedback status |
| PATCH | `/api/formosa/feedback/{id}` | handleFormosaFeedbackUpdate | Update feedback item |
| GET | `/api/formosa/feedback-image/{filename}.png` | handleFormosaFeedbackImageServe | Serve feedback screenshot image |

### Payload Limits
All POST `/api/formosa/*` requests accept a maximum content-length of **102,400 bytes (100 KB)**. Requests exceeding this limit return **HTTP 413 Payload Too Large**.

---

## Admin Endpoints

Require `X-Admin-Token` header with valid admin, manager, or owner token.

| Method | Path | Handler | Purpose |
|--------|------|---------|---------|
| GET | `/api/formosa/auth/role` | handleFormosaAuthRole | Check caller's authorization role |
| GET | `/api/formosa/admin/surveys` | handleFormosaAdminSurveys | List all survey responses |
| GET | `/api/formosa/admin/carbon` | handleFormosaAdminCarbon | Retrieve carbon footprint aggregates |
| GET | `/api/formosa/admin/timeline` | handleFormosaAdminTimeline | Fetch event timeline |
| GET | `/api/formosa/admin/users` | handleFormosaAdminUsers | Retrieve all users with statistics |
| GET | `/api/formosa/admin/clusters` | handleFormosaAdminClusters | Server-side grid clustering data |
| GET | `/api/formosa/admin/status` | handleFormosaAdminStatus | Retrieve activity status |
| PUT | `/api/formosa/admin/status` | handleFormosaAdminStatus | Set activity status |
| GET | `/api/formosa/admin/roles` | handleFormosaAdminRoles | Retrieve all role assignments |
| POST | `/api/formosa/admin/roles` | handleFormosaAdminRoles | Assign or update user roles |
| POST | `/api/formosa/admin/richmenu` | handleFormosaRichMenu | Deploy LINE Rich Menu |
| POST | `/api/formosa/push` | handleFormosaPush | Send LINE push notification |
| POST | `/api/formosa/admin/end-activity` | handleFormosaAdminEndActivity | Terminate activity session |
| GET | `/api/formosa/line-usage` | handleFormosaLineUsage | Retrieve LINE message quota usage |

---

## Cron Jobs

Internal scheduled tasks (no HTTP endpoint exposure).

| Schedule | Handler | Purpose | Source |
|----------|---------|---------|--------|
| Every 5 minutes (`*/5 * * * *`) | handleFormosaFlushBuffer | Batch flush KV buffer → D1 database | formosa.js:528 |
| Hourly | handleFormosaScheduledPush | Dispatch scheduled LINE notifications | formosa.js |

---

## Global Endpoints

### System Health Check
```
GET /health
```

Returns system health status including Formosa subsystem details:
- D1 database status
- KV store status
- Pending KV keys count
- Last flush timestamp

---

## Authentication

### Header Format
```
X-Admin-Token: <token_value>
```

All admin endpoints require this header. Requests without valid authentication return **HTTP 401 Unauthorized**.

### Token Types
Three authorization tiers are supported:

| Tier | Environment Variable | ROLE_LEVEL | Permissions |
|------|----------------------|-----------|------------|
| Owner | `FORMOSA_ADMIN_TOKEN` | 3 | All admin operations + settings management |
| Manager | `FORMOSA_MANAGER_TOKEN` | 2 | Admin read + feedback/push operations |
| Volunteer | `FORMOSA_VOLUNTEER_TOKEN` | 1 | Limited read-only access |

**Source:** formosa.js:19–44

---

## Rate Limits

All rate limits are enforced per `userId` or admin token via KV store.

**Source:** formosa.js:332–340, checkRateLimitKV function

| Endpoint | Limit | Window | Status Code |
|----------|-------|--------|------------|
| `/api/formosa/checkin` | 5 requests | 60 seconds | 429 if exceeded |
| `/api/formosa/submit` | 2 requests | 600 seconds | 429 if exceeded |
| `/api/formosa/track/sync` | 10 requests | 60 seconds | 429 if exceeded |
| Admin endpoints | 30 requests | 60 seconds | 429 if exceeded |

**Line References:**
- Checkin: formosa.js:366
- Survey: formosa.js:257
- Track sync: formosa.js:480
- Admin: formosa.js:68, 632, 979, 1019, 1104, 1135, 1217

---

## Response Format

### Success Response
```json
{
  "ok": true,
  "data": { /* endpoint-specific data */ }
}
```

### Error Response
```json
{
  "error": "Human-readable error message"
}
```

HTTP status codes:
- **200 OK** — Standard successful response
- **202 Accepted** — Asynchronous operation queued (e.g., checkin via KV buffer)
- **204 No Content** — OPTIONS CORS preflight
- **400 Bad Request** — Invalid request payload
- **401 Unauthorized** — Missing or invalid authentication token
- **413 Payload Too Large** — Request body exceeds 100 KB
- **429 Too Many Requests** — Rate limit exceeded

### Asynchronous Operations
Checkin requests return **HTTP 202 Accepted** with an 8-second timeout for async KV writes via `ctx.waitUntil()`. Callers should not wait for completion before responding to the user.

---

## Constants Reference

### KV Store TTLs (Time-to-Live)

All values in seconds. **Source:** formosa.js

| Constant | Value | Duration | Line | Purpose |
|----------|-------|----------|------|---------|
| GPS buffer data | 259200 | 3 days | L402, L416, L497, L584 | Store raw GPS points before batch flush |
| GPS count cache | 2592000 | 30 days | L424, L505, L604 | Cache photo count per user |
| Flush lock | 90 | 1.5 minutes | L528 | Prevent concurrent buffer flush operations |
| Last flush timestamp | 86400 | 1 day | L611 | Track last successful flush to D1 |
| Stats cache | 60 | 1 minute | L838 | Cache user statistics (level, distance, checkins) |
| Deduplication key | 60 | 1 minute | L427 | Prevent duplicate GPS submissions |

### Speed-Based Transport Mode Inference

**Source:** formosa.js:877–886

| Condition | Classification | GWP Factor | Purpose |
|-----------|------------------|-----------|---------|
| ≤ 15 km/h | Zero-emission | 0 kg CO₂e/km | Walking, cycling, stationary |
| > 15 km/h | Motorized | 0.12013 kg CO₂e/km | Unified coefficient (walking + transit weighted average) |

**GPS Noise Filters:**
- Skip if speed > 300 km/h (satellite/noise error)  
- Skip if distance < 10 m or elapsed time < 30 seconds (static/erratic)
- **Source:** formosa.js:919

### Payload Size Constraints

| Endpoint Category | Max Size | HTTP Status |
|------------------|----------|------------|
| All POST `/api/formosa/*` | 102,400 bytes (100 KB) | 413 on exceed |

---

## Level System

### Achievement Titles (TITLES Array)

**Source:** formosa.js:846–856

Users progress through 9 levels based on cumulative distance (km) AND check-in count. Both thresholds must be met simultaneously.

| Level | Chinese Name | Min km | Min Checkins | Icon |
|-------|--------------|--------|--------------|------|
| 1 | 煉氣香客 | 0 | 1 | 🔥 |
| 2 | 築基香客 | 15 | 5 | 🧱 |
| 3 | 金丹香客 | 45 | 10 | 💛 |
| 4 | 元嬰香客 | 90 | 15 | 👶 |
| 5 | 化神香客 | 135 | 20 | ✨ |
| 6 | 煉虛香客 | 180 | 25 | 🌀 |
| 7 | 合體香客 | 225 | 30 | 🤝 |
| 8 | 大乘香客 | 270 | 35 | 🏆 |
| 9 | 飛升香客 | 300 | 40 | 🚀 |

### Rank Computation

```
computeRank(km, checkins)
```

Iterates TITLES array from highest to lowest level. Returns the first level where **both** conditions are true:
- `km >= levelThreshold`
- `checkins >= levelThreshold`

**Source:** formosa.js:858

### Achievement Card Unlock Conditions

Three conditions must ALL be satisfied:

1. **Checkins ≥ 3** — Minimum participation threshold
2. **Survey Completed = 1** — Must have submitted survey (Q1–Q10)
3. **Phone IS NOT NULL** — Phone number on file

If any condition fails, the achievement card remains locked.

---

## Carbon Coefficients

### GWP Factors (Global Warming Potential)

**Source:** formosa.js:1907–1911

Standard emission coefficients for transportation modes, measured in **kg CO₂ equivalent per km** (except noted).

| Mode | Coefficient | Unit | Notes |
|------|-------------|------|-------|
| walk | 0 | kg CO₂e/km | Baseline, zero emissions |
| car | 0.30479 | kg CO₂e/km | Ecoinvent 3.10 LCA database |
| scooter | 0.13734 | kg CO₂e/km | E-scooter/personal mobility |
| bike | 0.01220 | kg CO₂e/km | Pedal or e-bike |
| bus | 0.12013 | kg CO₂e/km | Unified coefficient |
| mrt | 0.07575 | kg CO₂e/km | Mass rapid transit (subway) |
| train | 0.07575 | kg CO₂e/km | Conventional rail |
| hsr | 0.07487 | kg CO₂e/km | High-speed rail (lower emissions) |
| water | 0.10974 | kg CO₂e/bottle | Per 500ml water bottle |
| recycle | -0.00265 | kg CO₂e/bottle | Recycling credit (negative = offset) |
| hotel | 8.85 | kg CO₂e/night | Accommodation per night |

**Inference:** Unknown modes default to unified coefficient (0.12013 kg CO₂e/km) for conservative estimation.

---

## Three-Tier Authorization

### Role Levels & Permissions

**Source:** formosa.js:19–44

Three-tier role system controls API access:

```javascript
ROLE_LEVEL = {
  owner: 3,
  manager: 2,
  volunteer: 1
}
```

### Role Definitions

| Role | Level | Token Env Var | Can Read Admin Data | Can Modify Data | Can Push Notifications | Can End Activity |
|------|-------|---------------|-------------------|-----------------|----------------------|------------------|
| Owner | 3 | `FORMOSA_ADMIN_TOKEN` | ✓ | ✓ | ✓ | ✓ |
| Manager | 2 | `FORMOSA_MANAGER_TOKEN` | ✓ | ✓ (feedback) | ✓ | ✓ |
| Volunteer | 1 | `FORMOSA_VOLUNTEER_TOKEN` | ✓ (limited) | — | — | — |

### Authorization Functions

**`requireAdmin()`**  
Requires role level ≥ 2 (owner or manager). Used for sensitive operations like survey list, carbon aggregates, user list, status changes, role management.

**`requireAnyRole()`**  
Requires any valid token (level ≥ 1). Used for read-only volunteer access.

---

## Appendix: Source Code References

All constants, line numbers, and behavioral specifications in this document are derived from:

- **index.js** — Route handler definitions (commit 99e8fcc, main branch)
- **formosa.js** — Business logic, constants, rate limiting (commit 99e8fcc, main branch)

For verification of any value or implementation detail, consult the source files directly.

---

**Last Updated:** 2026-04-04 by Formosa Engineering Team  
**Next Review:** 2026-05-04
