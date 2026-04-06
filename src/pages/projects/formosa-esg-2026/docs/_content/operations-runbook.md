# Formosa ESG 2026: Operations Runbook v1.0
**Date:** 2026-04-04  
**Event Period:** April 12–20, 2026  
**Audience:** Paul (owner), volunteer operators  
**Purpose:** Live pilgrimage incident response manual

---

## Overview

This runbook covers critical incident scenarios for the Formosa ESG 2026 live tracking platform during the pilgrimage event. Each scenario provides a structured if-then response: trigger condition → diagnosis steps → fix → verification.

### Infrastructure Summary
- **Frontend:** Astro on Cloudflare Pages (paulkuo.tw / mazu.today), auto-deploys on git push
- **API:** Cloudflare Worker at api.paulkuo.tw, deployed via `wrangler deploy --config worker/wrangler.toml`
- **Database:** D1 (SQLite, paulkuo-auth)
- **Cache/Buffer:** KV (TICKER_KV), R2 (FORMOSA_OG)
- **Integration:** LINE Bot (channel 2009576607), webhook at api.paulkuo.tw/api/formosa/webhook
- **Monitoring:** /health endpoint + RFC #100 A1 alert system

---

## Scenario 1: D1 Database Down

**Trigger:**  
- `/health` endpoint returns `d1: error`
- Health alert system pushes LINE message to Paul
- Workers logs show "D1 query timeout" or "database unavailable"

**Impact:**  
- No new data written to persistent D1 storage
- GPS data still captured in KV buffer (5-min flush cycle absorbs the delay)
- User-facing check-in/survey submissions queued in KV

**Diagnosis Steps:**
1. Check `/health` endpoint: `curl https://api.paulkuo.tw/health`
2. If `d1: error`, open Cloudflare Dashboard → D1 → paulkuo-auth → check status page
3. Review Workers logs (Cloudflare Dashboard → Workers → formosa-worker → Logs tab)
4. Verify D1 binding exists in `worker/wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB"
   database_name = "paulkuo-auth"
   database_id = "xxxxx"
   ```

**Fix Steps:**
1. **Most cases:** D1 recovers automatically within 5–10 minutes. Monitor /health endpoint.
2. **If prolonged (>15 min):**
   - Check Cloudflare Status page for D1 service incidents
   - Verify database binding: redeploy Worker with correct wrangler.toml
     ```bash
     wrangler deploy --config worker/wrangler.toml
     ```
   - Contact Cloudflare Support if issue persists

**Verification:**
- `/health` endpoint returns `d1: ok`
- New GPS data appears in D1 after next 5-min flush
- No further LINE alerts for D1 failure

---

## Scenario 2: KV → D1 Flush Stalled

**Trigger:**  
- KV key `formosa:last_flush` timestamp is >30 minutes old
- RFC #100 A1 health alert pushed to LINE
- `/health` shows `last_flush: <timestamp>` significantly in the past

**Impact:**  
- GPS data accumulates in KV (3-day TTL prevents loss, but defeats real-time persistence)
- D1 does not receive new records
- If flush resumes within 3 days, no data loss

**Diagnosis Steps:**
1. Check `/health` for `last_flush` timestamp
2. Check if flush lock is stuck:
   - Open Cloudflare Dashboard → Workers KV → view namespace → search for `formosa:lock:gps_flush`
   - If key exists, flush process is hung
3. Check Workers logs for flush errors:
   - Look for "flush lock acquired" or "flush timeout" messages
4. Verify cron trigger is enabled in wrangler.toml:
   ```toml
   [triggers]
   crons = ["*/5 * * * *"]
   ```

**Fix Steps:**
1. **Delete the stuck lock key:**
   - Cloudflare Dashboard → Workers KV → select namespace → find `formosa:lock:gps_flush`
   - Click the key and **Delete**
   - Flush will resume on next cron cycle (max 5 min)
   
2. **Alternative (via API):**
   ```bash
   curl -X DELETE https://api.example.com/kv/formosa:lock:gps_flush \
     -H "Authorization: Bearer $CF_API_TOKEN"
   ```

3. If D1 is also down, fix Scenario 1 first, then clear the lock

**Verification:**
- `formosa:last_flush` KV key updates within 5 minutes
- `/health` shows recent `last_flush` timestamp
- GPS records start appearing in D1 again

---

## Scenario 3: Rate Limit Complaints

**Trigger:**  
- Users report "429 Too Many Requests" errors
- Check-in or survey endpoints return HTTP 429
- Multiple users unable to participate simultaneously

**Impact:**  
- Users cannot check in or submit survey responses during high-traffic periods
- Participation data incomplete
- Event day degraded experience

**Diagnosis Steps:**
1. Check the endpoint that's being rate-limited:
   - `/api/formosa/checkin` (limit: 5 req/min per user)
   - `/api/formosa/survey` (limit: 2 req/10 min per user)
   - `/api/formosa/track/sync` (limit: 10 req/min per user)
2. Review Workers analytics (Cloudflare Dashboard → Workers → Analytics):
   - Look for high 429 response rate
   - Identify if traffic is legitimate (volunteers) or bot/script attack
3. Check KV rate limit keys:
   - Cloudflare Dashboard → KV → search for `ratelimit:*` keys
   - If many keys exist for single IP, likely bot

**Fix Steps:**
1. **If legitimate high load (event day):**
   - Increase rate limits in `formosa.js`, function `checkRateLimitKV`:
     ```javascript
     const LIMITS = {
       checkin: { calls: 10, window: 60 },      // increased from 5
       survey: { calls: 4, window: 600 },       // increased from 2
       track: { calls: 20, window: 60 }         // increased from 10
     };
     ```
   - Redeploy Worker:
     ```bash
     wrangler deploy --config worker/wrangler.toml
     ```

2. **If bot/attack (suspicious IPs):**
   - Use Cloudflare WAF rules to block offending IPs
   - Dashboard → Security → WAF → Create rule: IP/User Agent blocklist
   - Redeploy (no code change needed)

**Verification:**
- Users report successful check-ins
- `/api/formosa/checkin` returns 200 OK responses
- /health shows normal request latency

---

## Scenario 4: LINE Bot Not Responding

**Trigger:**  
- Messages to @539fkwjd get no response
- Users complain bot features unavailable
- Webhook delivery failures in LINE Developers console

**Impact:**  
- Bot features unavailable (query, registration, alerts)
- Users cannot interact with LINE integration
- Event communication disrupted

**Diagnosis Steps:**
1. Check webhook URL in LINE Developers console:
   - Dashboard → Message API → Webhook settings
   - **Must be:** `https://api.paulkuo.tw/api/formosa/webhook`
   - **NOT:** `*.workers.dev` URL (workers.dev became invalid as of 2026-03-31)
2. Check if auto-response is enabled:
   - Dashboard → Settings → Auto-reply messages
   - If ON, webhook will NOT trigger (mutual exclusion)
3. Check Workers logs for webhook errors:
   - Cloudflare Dashboard → Workers → formosa-worker → Logs
   - Look for POST /api/formosa/webhook requests
4. Verify LINE Bot channel ID matches (should be 2009576607):
   - In wrangler.toml or environment config

**Fix Steps:**
1. **Fix webhook URL:**
   - Go to LINE Developers → Message API → Webhook settings
   - Update URL to `https://api.paulkuo.tw/api/formosa/webhook`
   - Click "Verify" to test connection
   - Expect green checkmark

2. **Disable auto-response if enabled:**
   - Settings → Auto-reply messages → Toggle OFF
   - Wait 1–2 minutes for change to propagate

3. **Redeploy Worker if code was changed:**
   ```bash
   wrangler deploy --config worker/wrangler.toml
   ```

**Verification:**
- Send test message to bot via LINE
- Bot replies within 2–3 seconds
- Webhook shows green delivery status in LINE Developers console
- Workers logs show successful POST requests

---

## Scenario 5: Frontend Not Updating After Deploy

**Trigger:**  
- `git push` to main succeeded
- Cloudflare Pages build succeeded (green checkmark)
- But users see old content after manual refresh

**Impact:**  
- New features/bug fixes not visible to users
- Mismatch between deployed code and user experience

**Diagnosis Steps:**
1. Check Cloudflare Pages build status:
   - Dashboard → Pages → formosa-site → Deployments tab
   - Look for recent "Success" deployment
2. Hard refresh the frontend (not browser cache):
   - **Chrome/Edge:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - **Firefox:** `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - **Safari:** Develop menu → Empty Caches, then refresh
3. Open browser DevTools (F12) → Network tab:
   - Check if `Cache-Control: max-age=3600` header is present
   - Response code should be 200 (fresh) not 304 (cached)
4. Check mazu.today if paulkuo.tw shows old content:
   - mazu.today reverse-proxies to paulkuo.tw
   - Purging paulkuo.tw cache also purges mazu.today

**Fix Steps:**
1. **Wait for natural cache expiry:**
   - CDN max-age=3600 means 1 hour expiry
   - Users on fresh connections see new content after 1 hour

2. **Force cache purge (faster):**
   - Cloudflare Dashboard → paulkuo.tw (zone) → Caching → Configuration → Purge Cache
   - Select "Purge Everything" (will purge all cached assets)
   - Wait 30 seconds for purge to complete

3. **Verify with curl:**
   ```bash
   curl -I https://paulkuo.tw/ | grep Cache-Control
   curl -I https://mazu.today/ | grep Cache-Control
   ```

**Verification:**
- Hard refresh shows new content
- DevTools → Network shows HTTP 200 (not 304)
- Cloudflare Analytics shows cache hit ratio normalized

---

## Scenario 6: Worker Deploy Failed

**Trigger:**  
- `wrangler deploy --config worker/wrangler.toml` returns error
- Error messages: "binding not found", "database_id mismatch", "config parsing failed"
- API endpoints return 502 Bad Gateway

**Impact:**  
- API changes not live or partially live
- Users cannot access modified endpoints

**Diagnosis Steps:**
1. Check command syntax:
   - **Correct:** `wrangler deploy --config worker/wrangler.toml`
   - **Wrong:** `wrangler deploy` (uses root wrangler.jsonc, may have wrong bindings)
2. Review error message:
   - If mentions `D1` or `KV`, check binding in worker/wrangler.toml
   - If mentions `parse error`, validate TOML syntax
3. Check Cloudflare Dashboard → Workers → formosa-worker → Deployments:
   - Look for recent failed deployment
   - Click deployment to see error logs
4. Verify wrangler version:
   ```bash
   wrangler --version
   ```

**Fix Steps:**
1. **Most common: root wrangler.jsonc interference**
   - Always use: `wrangler deploy --config worker/wrangler.toml`
   - Verify worker/wrangler.toml contains all required bindings:
     ```toml
     [env.production]
     vars = { ... }
     kv_namespaces = [
       { binding = "TICKER_KV", id = "xxxxx" }
     ]
     r2_buckets = [
       { binding = "FORMOSA_OG", bucket_name = "formosa-og" }
     ]
     [[d1_databases]]
     binding = "DB"
     database_name = "paulkuo-auth"
     database_id = "xxxxx"
     ```

2. **If binding IDs are wrong:**
   - Get correct IDs from Cloudflare Dashboard
   - Update worker/wrangler.toml
   - Redeploy

3. **If TOML syntax error:**
   - Use online TOML validator: https://www.toml-lint.com/
   - Fix syntax, try deploy again

**Verification:**
- `wrangler deploy --config worker/wrangler.toml` returns "Uploaded" message
- Cloudflare Dashboard shows successful deployment
- `/health` endpoint responds with 200 OK

---

## Scenario 7: Capacity Overload (Event Day)

**Trigger:**  
- Slow API responses (>1 sec latency)
- Timeouts on check-in or GPS sync
- D1 write contention observed in logs
- Workers CPU time spikes

**Impact:**  
- Users experience lag, timeouts
- Some submissions may fail
- User frustration during peak event times

**Diagnosis Steps:**
1. Check Workers Analytics (Cloudflare Dashboard → Workers):
   - Look for request count spikes
   - Check CPU time percentiles (p95, p99)
   - Review error rates
2. Check KV buffer size estimate:
   - Large number of `formosa:gps:*` keys indicates backlog
   - Compare to baseline (typical ~100–500 keys during steady state)
3. Check D1 queue depth:
   - Review last flush timestamp in `/health`
   - If flush is delayed, D1 is backing up
4. Review /health endpoint metrics:
   - KV buffer size
   - Last flush age
   - Response time of KV and D1 reads

**Fix Steps:**
1. **KV buffer is designed to absorb spikes:**
   - Monitor for 5–10 minutes; system typically self-recovers
   - KV buffer will flush during next 5-min cycle

2. **If extreme overload persists (>5 min sustained):**
   - Enable activity pause via admin endpoint:
     ```bash
     curl -X PUT https://api.paulkuo.tw/api/formosa/admin/status \
       -H "X-Admin-Token: $ADMIN_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"status":"paused"}'
     ```
   - This stops GPS tracking acceptance, reduces load
   - Notify volunteers via LINE

3. **Scale KV buffer retention (if needed):**
   - Increase flush frequency from 5 min to 2 min (edit cron in wrangler.toml)
   - Requires redeploy: `wrangler deploy --config worker/wrangler.toml`

4. **Last resort: pause activity completely:**
   - Wait for situation to stabilize
   - Coordinate with Paul before pausing

**Verification:**
- Response times return to <500 ms
- D1 flush resumes on schedule
- KV buffer size normalizes
- `/health` shows healthy metrics

---

## Scenario 8: Activity Pause/End Operations

**Workflow for admin-level event control**

### Pause Activity (Temporary)
**Use case:** Overload, urgent security issue, etc.

```bash
curl -X PUT https://api.paulkuo.tw/api/formosa/admin/status \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"paused"}'
```

**Effect:**
- KV key `formosa_status` set to `"paused"`
- GPS tracking endpoints return 403 (paused)
- Volunteers notified via LINE message
- Data already in KV still flushes to D1

**Resume Activity:**
```bash
curl -X PUT https://api.paulkuo.tw/api/formosa/admin/status \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

### End Activity (Final)
**Use case:** Event day finished, finalize all data

```bash
curl -X POST https://api.paulkuo.tw/api/formosa/admin/end-activity \
  -H "X-Admin-Token: $ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Effect:**
- KV key `formosa_status` set to `"ended"`
- Final GPS flush to D1
- Achievement card generation triggered (RFC #100)
- No new submissions accepted
- Final summary pushed to LINE

**Verification:**
- /health returns `status: ended`
- D1 shows final GPS records
- Achievement cards generated and distributed
- Volunteers can no longer check in

---

## Scenario 9: OG Share Card Not Generating

**Trigger:**  
- User shares to social media, preview image is missing or broken
- Share card shows generic thumbnail instead of custom image
- R2 bucket access errors in logs

**Impact:**  
- Social sharing appears unprofessional
- Low click-through on shared links

**Diagnosis Steps:**
1. Share a test link and inspect preview:
   - WhatsApp, Facebook, or LINE share card preview
   - Check if image loads or shows placeholder
2. Check R2 bucket status (Cloudflare Dashboard):
   - Navigate to R2 → FORMOSA_OG bucket
   - Verify bucket is NOT empty
   - Verify bucket permissions allow public read
3. Check og-image endpoint logs:
   - Workers logs for POST `/api/formosa/og-image`
   - Look for R2 upload errors
4. Test endpoint directly:
   ```bash
   curl -X POST https://api.paulkuo.tw/api/formosa/og-image \
     -H "X-Admin-Token: $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"test_user"}'
   ```

**Fix Steps:**
1. **Clear R2 cache for specific user:**
   - Cloudflare Dashboard → R2 → FORMOSA_OG
   - Search for and delete objects matching user ID
   - Next share will regenerate fresh card

2. **Force regeneration via API:**
   ```bash
   curl -X POST https://api.paulkuo.tw/api/formosa/og-image \
     -H "X-Admin-Token: $ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"USER_ID_HERE"}'
   ```

3. **If R2 bucket is full or disabled:**
   - Check R2 storage quota (Cloudflare Dashboard)
   - Verify R2 binding in wrangler.toml:
     ```toml
     [[r2_buckets]]
     binding = "FORMOSA_OG"
     bucket_name = "formosa-og"
     ```
   - Redeploy if binding was fixed

**Verification:**
- Reshare link shows updated preview image
- Image loads in social media share preview
- R2 bucket contains updated object

---

## Scenario 10: Data Recovery

**Trigger:**  
- Accidental deletion or data corruption discovered
- Need to recover state after system failure

### Recovery Options

**1. KV Buffer Recovery (GPS Data)**
- **Timeframe:** Last 3 days (KV auto-expiry TTL)
- **Action:** Check `formosa:gps:*` keys in KV namespace
  - Cloudflare Dashboard → KV → browse keys
  - If keys still exist, data not lost
  - Manually re-run flush if needed:
    ```javascript
    // Trigger flush cron job (if not waiting for next cycle)
    // In Worker, call flushGPSToD1() function directly
    ```
- **Limit:** Only recoverable if D1 flush resumes within 3 days

**2. D1 Database Recovery (Persistent Data)**
- **Timeframe:** Depends on Cloudflare backup retention
- **Action:**
  - Cloudflare Dashboard → D1 → paulkuo-auth → Database Details
  - Look for "Restore from backup" option (if available)
  - Contact Cloudflare Support for point-in-time recovery (PITR)
  - Provide timestamp of desired recovery point
- **Limit:** PITR availability depends on support tier

**3. R2 Object Recovery (Share Cards)**
- **Timeframe:** Objects are not auto-deleted
- **Action:**
  - R2 objects deleted can sometimes be recovered via Cloudflare Support
  - Request recovery with exact object name and deletion timestamp
  - Regenerate cards using `/api/formosa/og-image` endpoint
- **Limit:** Best effort by Cloudflare Support

### Prevention Measures
- **Automate backups:** Export D1 daily to cold storage (R2 or external)
- **Monitor KV expiry:** Set up alerts if `formosa:gps:*` key count suddenly drops
- **Test recovery:** Monthly restore drill from backup to staging environment

---

## Scenario 11: DNS / Custom Domain Issues

**Trigger:**  
- Users report mazu.today unreachable
- DNS resolution fails (`nslookup mazu.today`)
- Cloudflare Pages shows SSL error

**Impact:**  
- Users cannot access via custom domain
- paulkuo.tw still accessible (if separate)

**Diagnosis Steps:**
1. Test DNS resolution:
   ```bash
   nslookup mazu.today
   dig mazu.today
   ```
2. Check custom domain status:
   - Cloudflare Dashboard → Pages → formosa-site → Custom domains
   - Verify mazu.today shows "Active" status
   - Check SSL certificate (should be auto-provisioned)
3. Test direct paulkuo.tw:
   ```bash
   curl -I https://paulkuo.tw/
   ```

**Fix Steps:**
1. **If DNS record missing:**
   - Cloudflare Dashboard → Domains → DNS Records
   - Verify CNAME or A record points to Pages deployment
   - Typical: `mazu.today CNAME paulkuo.tw.cdn.cloudflare.net`

2. **If SSL certificate not provisioning:**
   - Remove and re-add domain in Pages → Custom domains
   - Wait 5–10 minutes for certificate to issue
   - Retry HTTPS connection

**Verification:**
- `curl -I https://mazu.today/` returns 200 OK with valid SSL
- mazu.today and paulkuo.tw both load same content

---

## Scenario 12: Third-Party Integration Failure (LINE, etc.)

**Trigger:**  
- LINE webhook fails (JSON parsing, authentication)
- External API timeouts or 5xx errors

**Impact:**  
- Bot features unavailable
- Manual followup required

**Diagnosis Steps:**
1. Check LINE Developers webhook logs:
   - Dashboard → Message API → Webhook → Recent deliveries
   - Look for failed (red X) requests
2. Review error response:
   - Click failed delivery to see response body
   - Common: 401 (invalid token), 400 (malformed JSON)
3. Check Worker logs for LINE API calls:
   - Cloudflare Dashboard → Workers → Logs
   - Search for LINE push/reply calls

**Fix Steps:**
1. **If authentication fails:**
   - Verify LINE channel access token in environment
   - Check token hasn't expired (LINE tokens can expire)
   - Regenerate token in LINE Developers console if needed

2. **If JSON parsing fails:**
   - Validate webhook payload structure matches LINE spec
   - Check Worker code for JSON handling bugs

3. **If external API timeout:**
   - Increase timeout threshold in Worker code (if applicable)
   - Add retry logic with backoff

**Verification:**
- Send test message to bot
- Webhook delivery shows green checkmark
- Bot responds normally

---

## Quick Reference

### Health Check
```bash
curl https://api.paulkuo.tw/health
```

Expected response:
```json
{
  "status": "ok",
  "d1": "ok",
  "kv": "ok",
  "r2": "ok",
  "last_flush": "2026-04-04T12:30:45Z",
  "buffer_size": 123
}
```

### Admin Operations
**Header format:**
```
X-Admin-Token: <token_from_wrangler_secret>
```

**Common endpoints:**
- `PUT /api/formosa/admin/status` — pause/resume activity
- `POST /api/formosa/admin/end-activity` — finalize event
- `POST /api/formosa/og-image` — regenerate share card

### Key KV Keys to Monitor
| Key | Purpose | TTL | Concern |
|-----|---------|-----|---------|
| `formosa:gps:*` | GPS buffer | 3 days | Accumulation if flush fails |
| `formosa:last_flush` | Flush timestamp | — | Should update every 5 min |
| `formosa:lock:gps_flush` | Flush lock | 90 sec | Should not persist >90 sec |
| `formosa_status` | Activity state | — | Should be "active" or "paused" |
| `alert:last_sent` | Last alert timestamp | — | Monitor alert backoff |

### Cloudflare Dashboard URLs
- **Pages:** https://dash.cloudflare.com/?to=/:account/pages
- **Workers:** https://dash.cloudflare.com/?to=/:account/workers/overview
- **D1:** https://dash.cloudflare.com/?to=/:account/d1/databases
- **KV:** https://dash.cloudflare.com/?to=/:account/kv/namespaces
- **R2:** https://dash.cloudflare.com/?to=/:account/r2/buckets
- **Analytics:** https://dash.cloudflare.com/?to=/:account/analytics/workers

### Emergency Contacts & Resources
| Item | Contact/Link | Notes |
|------|--------------|-------|
| Paul (Owner) | — | LINE, direct call |
| Cloudflare Support | https://dash.cloudflare.com/support | Use for D1, KV, infrastructure issues |
| LINE Developers | https://developers.line.biz/ | Webhook, channel settings |
| Formosa Repo | https://github.com/paulkuo-tw/formosa | Source of truth for code |
| Staging Env | https://staging.paulkuo.tw | Test changes before main push |

### Deployment Checklist
Before pushing to production:
- [ ] All changes tested on staging environment
- [ ] Verified against known pitfalls (see below)
- [ ] Database migrations (if any) applied to D1
- [ ] Worker code passes linter (no TypeScript errors)
- [ ] Frontend changes hard-refreshed on test device
- [ ] Coordinated with Paul if >L1 risk (see feedback_risk_levels.md)

### Known Pitfalls & Lessons Learned

1. **Root wrangler.jsonc overrides:** Always use `wrangler deploy --config worker/wrangler.toml`
2. **LINE workers.dev webhook:** Use api.paulkuo.tw, NOT *.workers.dev (deprecated since 2026-03-31)
3. **LINE auto-response conflicts:** Auto-response and webhook cannot both be enabled
4. **CDN cache lag:** New deploys may take up to 1 hour to be fully cached (max-age=3600)
5. **D1 single-writer contention:** KV buffer mitigates, but monitor flush lock TTL
6. **_redirects :splat syntax:** Caused P0 outage (Issue #90); use exact patterns only
7. **querySelector duplication:** Multiple elements with same selector caused 4/03 incident; validate uniqueness
8. **localStorage isolation:** LINE in-app browser and Safari have isolated storage; test on real device
9. **Constants drift:** Always verify constants against source code, not documentation (4/04 incident)

### Escalation Path
1. **Minor (user-facing but containable):**
   - Diagnose and apply fix from this runbook
   - Notify Paul via LINE once resolved

2. **Moderate (data at risk, >5 min downtime):**
   - Apply fix immediately
   - Brief Paul on situation and resolution
   - Consider pause/resume activity if needed

3. **Severe (D1 down, security, data loss risk):**
   - Pause activity immediately: `PUT /api/formosa/admin/status` → "paused"
   - Contact Paul immediately (call, not LINE message)
   - Document timeline and recovery steps
   - Post-incident review with full team

---

## Version History
- **v1.0** (2026-04-04): Initial release, 12 scenarios, quick reference, emergency procedures

**Last Updated:** 2026-04-04  
**Maintained By:** Paul (owner) and volunteer ops team

---

