/**
 * Formosa ESG 2026 — LINE Webhook + Survey/GPS API + Push Notifications
 * 白沙屯媽祖繞境數據系統
 */
import { corsHeaders, jsonResponse } from './utils.js';
import { mapLineLanguageToLocale, localizeUrl, botMsg, BOT_MESSAGES } from './formosa-i18n.js';

// ── Activity Status Helper ──
const FORMOSA_STATUS_KEY = 'formosa_status';
async function getFormosaStatus(kv) {
  const raw = await kv.get(FORMOSA_STATUS_KEY);
  if (!raw) return { status: 'active', message: '' };
  try { return JSON.parse(raw); } catch { return { status: 'active', message: '' }; }
}

// ── Three-Tier Auth Helper ──
// Roles: owner > manager > volunteer
const ROLE_LEVEL = { owner: 3, manager: 2, volunteer: 1, sedan_volunteer: 1 };

async function getAuthRole(request, env) {
  const token = request.headers.get('X-Admin-Token');
  if (!token) return null;
  // Check Worker secrets first (fast path)
  if (token === env.FORMOSA_ADMIN_TOKEN) return 'owner';
  if (token === env.FORMOSA_MANAGER_TOKEN) return 'manager';
  if (token === env.FORMOSA_VOLUNTEER_TOKEN) return 'volunteer';
  if (token === env.FORMOSA_SEDAN_TOKEN) return 'sedan_volunteer';
  // Fallback: check KV invite codes (Dashboard sends invite code as X-Admin-Token)
  try {
    const raw = await env.TICKER_KV.get('invite_codes');
    if (raw) {
      const codes = JSON.parse(raw);
      const info = codes[token.trim().toLowerCase()];
      if (info && info.role === 'admin') return 'owner';
    }
  } catch (e) {
    console.error('getAuthRole invite code error:', e.message || e);
  }
  return null;
}

// Check if a token is the sedan volunteer token
function isSedanToken(request, env) {
  const token = request.headers.get('X-Admin-Token');
  return token && token === env.FORMOSA_SEDAN_TOKEN;
}

// Backward-compatible: requireAdmin still works for owner+manager endpoints
async function requireAdmin(request, env) {
  const role = await getAuthRole(request, env);
  if (!role || ROLE_LEVEL[role] < ROLE_LEVEL['manager']) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request);
  }
  return null; // authorized (owner or manager)
}

// New: require any valid role (owner, manager, or volunteer)
async function requireAnyRole(request, env) {
  const role = await getAuthRole(request, env);
  if (!role) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request);
  }
  return null;
}

// ── Auth Role Endpoint ──
export async function handleFormosaAuthRole(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const role = await getAuthRole(request, env);
  if (!role) return jsonResponse({ error: 'Unauthorized' }, 401, request);
  return jsonResponse({ role }, 200, request);
}

// ── Admin: Get/Set Activity Status ──
export async function handleFormosaAdminStatus(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });

  if (request.method === 'GET') {
    const data = await getFormosaStatus(env.TICKER_KV);
    return jsonResponse(data, 200, request);
  }

  // POST — set status (requires admin)
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    const body = await request.json();
    const status = body.status || 'active'; // active | paused | ended
    const message = body.message || '';
    await env.TICKER_KV.put(FORMOSA_STATUS_KEY, JSON.stringify({ status, message, updated: new Date().toISOString() }));
    return jsonResponse({ ok: true, status, message }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── D1 Schema Migration ──
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS formosa_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT UNIQUE,
  display_name TEXT,
  picture_url TEXT,
  phone TEXT DEFAULT NULL,
  photo_count INTEGER DEFAULT 0,
  role TEXT DEFAULT 'participant',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS formosa_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  q1_good_deeds TEXT,
  q2_moved_by TEXT,
  q2_1_story TEXT,
  q3_善行value TEXT,
  q4_continue TEXT,
  q5_future_actions TEXT,
  q6_csr TEXT,
  role_type TEXT,
  transport_walk REAL DEFAULT 0,
  transport_car REAL DEFAULT 0,
  transport_carpool INTEGER DEFAULT 1,
  transport_scooter REAL DEFAULT 0,
  transport_bus REAL DEFAULT 0,
  transport_mrt REAL DEFAULT 0,
  transport_train REAL DEFAULT 0,
  transport_hsr REAL DEFAULT 0,
  water_bottles INTEGER DEFAULT 0,
  hotel_nights INTEGER DEFAULT 0,
  carbon_total_kg REAL DEFAULT 0,
  carbon_breakdown TEXT,
  q3_transport TEXT,
  q4_eco TEXT,
  q5_stay TEXT,
  q6_meal TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS formosa_daily_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  report_date TEXT NOT NULL,
  transport_walk REAL DEFAULT 0,
  transport_car REAL DEFAULT 0,
  transport_carpool INTEGER DEFAULT 1,
  transport_scooter REAL DEFAULT 0,
  transport_bike REAL DEFAULT 0,
  transport_bus REAL DEFAULT 0,
  transport_mrt REAL DEFAULT 0,
  transport_train REAL DEFAULT 0,
  transport_hsr REAL DEFAULT 0,
  water_bottles INTEGER DEFAULT 0,
  recycle_bottles INTEGER DEFAULT 0,
  hotel INTEGER DEFAULT 0,
  carbon_gwp REAL DEFAULT 0,
  carbon_wu REAL DEFAULT 0,
  carbon_breakdown TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, report_date)
);

CREATE TABLE IF NOT EXISTS formosa_gps_points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  altitude REAL,
  accuracy REAL,
  source TEXT DEFAULT 'checkin',
  timestamp TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`;

// ── Column migrations for existing tables ──
const COLUMN_MIGRATIONS = [
  `ALTER TABLE formosa_users ADD COLUMN phone TEXT DEFAULT NULL`,
  `ALTER TABLE formosa_users ADD COLUMN photo_count INTEGER DEFAULT 0`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_gps_user_ts ON formosa_gps_points(user_id, timestamp)`,
  `ALTER TABLE formosa_users ADD COLUMN privacy_agreed_at TEXT DEFAULT NULL`,
  `ALTER TABLE formosa_users ADD COLUMN participant_status TEXT DEFAULT 'active'`,
  `ALTER TABLE formosa_users ADD COLUMN completed_at TEXT DEFAULT NULL`,
  `ALTER TABLE formosa_users ADD COLUMN language TEXT DEFAULT NULL`,
  `ALTER TABLE formosa_surveys ADD COLUMN q3_transport TEXT`,
  `ALTER TABLE formosa_surveys ADD COLUMN q4_eco TEXT`,
  `ALTER TABLE formosa_surveys ADD COLUMN q5_stay TEXT`,
  `ALTER TABLE formosa_surveys ADD COLUMN q6_meal TEXT`,
  `ALTER TABLE formosa_users ADD COLUMN is_sedan INTEGER DEFAULT 0`
];

// ── Run migration (once per Worker instance) ──
let _migrated = false;
export async function migrateFormosa(db) {
  if (_migrated) return;
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  for (const sql of statements) {
    try { await db.prepare(sql).run(); } catch (e) { /* table exists */ }
  }
  // Add new columns to existing tables (idempotent)
  for (const sql of COLUMN_MIGRATIONS) {
    try { await db.prepare(sql).run(); } catch (e) { /* column already exists */ }
  }
  _migrated = true;
}

// ── LINE Webhook Handler ──
export async function handleFormosaWebhook(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      try {
        const userId = event.source?.userId;

        // Upsert user for any event type
        if (userId) {
          const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
          const userLang = profile?.language || null;
          await env.AUTH_DB.prepare(
            `INSERT INTO formosa_users (line_user_id, display_name, picture_url, language, updated_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(line_user_id) DO UPDATE SET display_name=excluded.display_name, picture_url=excluded.picture_url, language=excluded.language, updated_at=datetime('now')`
          ).bind(userId, profile?.displayName || '', profile?.pictureUrl || '', userLang).run();
        }

        // ── Follow: Welcome Flex Message ──
        if (event.type === 'follow' && userId) {
          const locale = await getUserLocale(userId, env);
          await sendLineMessage(userId, env.FORMOSA_LINE_TOKEN, [buildWelcomeMessage(locale)]);
        }

        // ── Message: Keyword Router ──
        if (event.type === 'message' && event.message?.type === 'text') {
          const text = (event.message.text || '').trim();
          const replyToken = event.replyToken;
          if (!replyToken) continue;

          const reply = await routeKeyword(text, userId, env);
          await replyLineMessage(replyToken, env.FORMOSA_LINE_TOKEN, reply);
        }
      } catch (e) {
        console.error(`Event processing error: ${e.message}`, JSON.stringify(event?.type));
      }
    }

    return jsonResponse({ ok: true }, 200, request);
  } catch (e) {
    console.error('Webhook error:', e.message);
    return jsonResponse({ ok: true }, 200, request); // Always return 200 to LINE
  }
}

// ── Survey + GPS Submit Handler ──
export async function handleFormosaSubmit(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const data = await request.json();
    // Use LINE user ID if available, otherwise fallback
    const userId = data.line_user_id || data.user_id || 'anonymous_' + Date.now();

    // Rate limit: max 2 survey submissions per 10 minutes (KV-based)
    const surveyRateLimited = await checkRateLimitKV(env.TICKER_KV, `survey:${userId}`, 600, 2);
    if (surveyRateLimited) {
      return jsonResponse({ error: '提交太頻繁，請稍後再試', rate_limited: true }, 429, request);
    }

    // Save survey (optimized v2: Q1-Q10)
    if (data.survey) {
      const s = data.survey;
      const p = data.profile || {};
      await env.AUTH_DB.prepare(`
        INSERT INTO formosa_surveys
        (user_id, q1_good_deeds, q2_moved_by, q3_transport, q4_eco, q5_stay, q6_meal, role_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        JSON.stringify(s.q1 || []),
        JSON.stringify(s.q2 || []),
        s.q3_transport || '',
        JSON.stringify(s.q4_eco || []),
        s.q5_stay || '',
        s.q6_meal || '',
        p.role || 'participant'
      ).run();
    }

    // Upsert user if LINE identity available
    if (data.line_user_id) {
      const phoneVal = data.phone || null;
      if (phoneVal) {
        await env.AUTH_DB.prepare(`
          INSERT INTO formosa_users (line_user_id, display_name, phone, updated_at)
          VALUES (?, ?, ?, datetime('now'))
          ON CONFLICT(line_user_id) DO UPDATE SET
            display_name = excluded.display_name, phone = COALESCE(excluded.phone, formosa_users.phone), updated_at = datetime('now')
        `).bind(data.line_user_id, data.line_display_name || '', phoneVal).run();
      } else {
        await env.AUTH_DB.prepare(`
          INSERT INTO formosa_users (line_user_id, display_name, updated_at)
          VALUES (?, ?, datetime('now'))
          ON CONFLICT(line_user_id) DO UPDATE SET
            display_name = excluded.display_name, updated_at = datetime('now')
        `).bind(data.line_user_id, data.line_display_name || '').run();
      }
    }

    // Save GPS points (with coordinate validation + length cap)
    if (data.gps_points && data.gps_points.length > 0) {
      const raw = Array.isArray(data.gps_points) ? data.gps_points : [];
      const capped = raw.length > 1000 ? raw.slice(-1000) : raw;
      const validPts = capped.filter(pt => validateGPS(pt.lat, pt.lng));
      if (validPts.length > 0) {
        const stmts = validPts.map(pt =>
          env.AUTH_DB.prepare(
            `INSERT INTO formosa_gps_points (user_id, lat, lng, altitude, accuracy, source, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`
          ).bind(userId, pt.lat, pt.lng, pt.altitude || null, pt.accuracy || null, pt.source || 'checkin', pt.timestamp || new Date().toISOString())
        );
        await env.AUTH_DB.batch(stmts);
      }
    }

    return jsonResponse({ ok: true, user_id: userId, message: '資料已儲存' }, 200, request);
  } catch (e) {
    console.error('Submit error:', e.message);
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── GPS Coordinate Validation ──
function validateGPS(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

// ── KV-based Rate Limit (no D1 dependency) ──
async function checkRateLimitKV(kv, userId, windowSec, maxRequests) {
  const window = Math.floor(Date.now() / (windowSec * 1000));
  const key = `rl:${userId}:${window}`;
  const raw = await kv.get(key);
  const count = raw ? parseInt(raw, 10) : 0;
  if (count >= maxRequests) return true;
  await kv.put(key, String(count + 1), { expirationTtl: windowSec * 2 });
  return false;
}

// ── GPS Check-in Handler (KV Buffer — zero D1 writes) ──
export async function handleFormosaCheckin(request, env, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    // Check activity status (KV only, no D1)
    const actStatus = await getFormosaStatus(env.TICKER_KV);
    if (actStatus.status === 'paused') {
      return jsonResponse({ error: actStatus.message || '活動目前暫停中', paused: true }, 403, request);
    }
    if (actStatus.status === 'ended') {
      return jsonResponse({ error: actStatus.message || '活動已結束', ended: true }, 403, request);
    }

    const data = await request.json();
    const userId = data.user_id || 'anonymous_' + Date.now();

    // Rate limit via KV (no D1 query)
    const rateLimited = await checkRateLimitKV(env.TICKER_KV, userId, 60, 5);
    if (rateLimited) {
      return jsonResponse({ error: '打卡太頻繁，請稍後再試', rate_limited: true }, 429, request);
    }

    // Mark sedan volunteer in DB if using sedan token
    if (isSedanToken(request, env) && userId !== 'anonymous_' + Date.now()) {
      try {
        await migrateFormosa(env.AUTH_DB);
        await env.AUTH_DB.prepare(
          `INSERT INTO formosa_users (line_user_id, is_sedan, updated_at) VALUES (?, 1, datetime('now'))
           ON CONFLICT(line_user_id) DO UPDATE SET is_sedan = 1, updated_at = datetime('now')`
        ).bind(userId).run();
      } catch (e) {
        console.error('handleFormosaCheckin sedan write error:', e.message || e);
      }
    }

    const lat = data.lat;
    const lng = data.lng;
    if (!validateGPS(lat, lng)) {
      return jsonResponse({ error: 'Invalid GPS coordinates' }, 400, request);
    }

    // Geofence: 白沙屯↔北港路線範圍（含緩衝）
    const inRange = lat >= 23.4 && lat <= 24.9 && lng >= 120.1 && lng <= 121.0;
    const source = inRange ? (data.source || 'checkin') : 'remote';

    const ts = data.timestamp || new Date().toISOString();

    // Idempotency: dedup by userId + timestamp (rounded to 10s) to prevent retry double-counting
    const tsRounded = ts.slice(0, 18); // "2026-04-03T12:34:5" — ~10s granularity
    const dedupKey = `checkin_dedup:${userId}:${tsRounded}`;
    const existingDedup = await env.TICKER_KV.get(dedupKey);
    if (existingDedup) {
      const cached = JSON.parse(existingDedup);
      return jsonResponse({ ok: true, total_points: cached.approxCount, in_range: inRange, buffered: true, batch: cached.batchWritten, deduplicated: true }, 200, request);
    }

    const bufferKey = `gps:${ts}:${userId}:${crypto.randomUUID().slice(0, 8)}`;

    // KV write work — wrapped in a promise so we can race against timeout
    async function doKVWrites() {
      await env.TICKER_KV.put(bufferKey, JSON.stringify({
        user_id: userId, lat, lng,
        altitude: data.altitude || null,
        accuracy: data.accuracy || null,
        source, timestamp: ts,
        blessing_id: data.blessing_id || null
      }), { expirationTtl: 604800 }); // #R4-Fix-B: 7 days (was 3)

      let batchWritten = 0;
      if (data.track_points && Array.isArray(data.track_points)) {
        const raw = data.track_points;
        const capped = raw.length > 1000 ? raw.slice(-1000) : raw;
        const validPts = capped.filter(pt => validateGPS(pt.lat, pt.lng));
        for (const pt of validPts) {
          const ptTs = pt.datetime || new Date().toISOString();
          const ptKey = `gps:${ptTs}:${userId}:${crypto.randomUUID().slice(0, 8)}`;
          // #168: Apply geofence to batch track_points too
          const ptInRange = pt.lat >= 23.4 && pt.lat <= 24.9 && pt.lng >= 120.1 && pt.lng <= 121.0;
          const ptSource = ptInRange ? (VALID_SOURCES.has(pt.source) ? pt.source : 'auto') : 'remote';
          await env.TICKER_KV.put(ptKey, JSON.stringify({
            user_id: userId, lat: pt.lat, lng: pt.lng,
            altitude: null, accuracy: null,
            source: ptSource, timestamp: ptTs
          }), { expirationTtl: 604800 }); // #R4-Fix-B: 7 days (was 3)
          batchWritten++;
        }
      }

      const countKey = `gps_count:${userId}`;
      const cachedCount = await env.TICKER_KV.get(countKey);
      const approxCount = cachedCount ? parseInt(cachedCount, 10) + 1 + batchWritten : 1 + batchWritten;
      await env.TICKER_KV.put(countKey, String(approxCount), { expirationTtl: 86400 * 30 });

      // Write dedup key (TTL 60s — covers retry window)
      await env.TICKER_KV.put(dedupKey, JSON.stringify({ approxCount, batchWritten }), { expirationTtl: 60 });

      return { approxCount, batchWritten };
    }

    // Race KV writes against 8s timeout; if slow, respond 202 and finish in background
    const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 8000));
    const work = doKVWrites();
    const result = await Promise.race([work, timeout]);

    if (result === 'timeout') {
      if (ctx) ctx.waitUntil(work);
      return jsonResponse({ ok: true, in_range: inRange, buffered: true, accepted: true }, 202, request);
    }

    return jsonResponse({ ok: true, total_points: result.approxCount, in_range: inRange, buffered: true, batch: result.batchWritten }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── GP-4: Track Sync Endpoint (batch GPS point upload) ──
export async function handleFormosaTrackSync(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const actStatus = await getFormosaStatus(env.TICKER_KV);
    if (actStatus.status === 'paused' || actStatus.status === 'ended') {
      return jsonResponse({ error: actStatus.message || '活動暫停或已結束' }, 403, request);
    }

    // Support both JSON and sendBeacon (which sends as text)
    let data;
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('application/json') || ct.includes('text/plain')) {
      data = await request.json();
    } else {
      const text = await request.text();
      data = JSON.parse(text);
    }

    const headerUserId = request.headers.get('X-Line-User-Id');
    const userId = data.user_id || headerUserId;
    if (!userId) {
      return jsonResponse({ error: 'Missing user_id' }, 400, request);
    }

    // Rate limit: 10 sync requests per minute per user
    const rateLimited = await checkRateLimitKV(env.TICKER_KV, `sync:${userId}`, 60, 10);
    if (rateLimited) {
      return jsonResponse({ error: '同步太頻繁', rate_limited: true }, 429, request);
    }

    const points = Array.isArray(data.points) ? data.points : [];
    const capped = points.length > 1000 ? points.slice(-1000) : points;
    const validPts = capped.filter(pt => validateGPS(pt.lat, pt.lng));

    let synced = 0;
    for (const pt of validPts) {
      const ptTs = pt.datetime || new Date().toISOString();
      const ptKey = `gps:${ptTs}:${userId}:${crypto.randomUUID().slice(0, 8)}`;
      // #168: Apply geofence — points outside 白沙屯↔北港 range → 'remote'
      const ptInRange = pt.lat >= 23.4 && pt.lat <= 24.9 && pt.lng >= 120.1 && pt.lng <= 121.0;
      const ptSource = ptInRange ? (VALID_SOURCES.has(pt.source) ? pt.source : 'auto') : 'remote';
      await env.TICKER_KV.put(ptKey, JSON.stringify({
        user_id: userId, lat: pt.lat, lng: pt.lng,
        altitude: null, accuracy: null,
        source: ptSource, timestamp: ptTs
      }), { expirationTtl: 604800 }); // #R4-Fix-B: 7 days (was 3)
      synced++;
    }

    // Update approximate count
    const countKey = `gps_count:${userId}`;
    const cachedCount = await env.TICKER_KV.get(countKey);
    const approxCount = cachedCount ? parseInt(cachedCount, 10) + synced : synced;
    await env.TICKER_KV.put(countKey, String(approxCount), { expirationTtl: 86400 * 30 });

    return jsonResponse({ ok: true, synced }, 200, request);
  } catch (e) {
    console.error('Track sync error:', e);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Cron: Flush KV GPS Buffer → D1 (batch INSERT OR IGNORE) ──
export async function handleFormosaFlushBuffer(env) {
  const kv = env.TICKER_KV;
  const startTime = Date.now();
  let flushed = 0, skipped = 0, errors = 0;

  // ── 分散式鎖（TTL 90 秒，cover 一次 flush 的最長時間）──
  const lockKey = 'formosa:flush_lock';
  const existingLock = await kv.get(lockKey);
  if (existingLock) {
    console.log('Flush skipped: lock held by', existingLock);
    return { skipped: true, reason: 'lock_held' };
  }
  const lockId = crypto.randomUUID();
  await kv.put(lockKey, lockId, { expirationTtl: 90 });

  try {
    await migrateFormosa(env.AUTH_DB);

    // List all buffered GPS points from KV
    let cursor = undefined;
    const allKeys = [];
    do {
      const list = await env.TICKER_KV.list({ prefix: 'gps:', limit: 1000, cursor });
      allKeys.push(...list.keys);
      cursor = list.list_complete ? undefined : list.cursor;
    } while (cursor);

    if (allKeys.length === 0) {
      return { flushed: 0, duration_ms: Date.now() - startTime };
    }

    // Process in batches of 50
    const BATCH = 50;
    for (let i = 0; i < allKeys.length; i += BATCH) {
      const batch = allKeys.slice(i, i + BATCH);

      // Read values in parallel
      const entries = await Promise.all(
        batch.map(async (k) => {
          try {
            const val = await env.TICKER_KV.get(k.name);
            return val ? { key: k.name, data: JSON.parse(val) } : { key: k.name, data: null };
          } catch { return { key: k.name, data: null }; }
        })
      );

      const valid = entries.filter(e => e.data && e.data.user_id && e.data.lat && e.data.lng);
      const invalid = entries.filter(e => !e.data);

      // Batch INSERT OR IGNORE into D1 (max 100 per batch call)
      if (valid.length > 0) {
        try {
          const stmts = valid.map(e =>
            env.AUTH_DB.prepare(
              `INSERT OR IGNORE INTO formosa_gps_points (user_id, lat, lng, altitude, accuracy, source, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`
            ).bind(e.data.user_id, e.data.lat, e.data.lng, e.data.altitude, e.data.accuracy, e.data.source || 'checkin', e.data.timestamp)
          );
          for (let j = 0; j < stmts.length; j += 100) {
            await env.AUTH_DB.batch(stmts.slice(j, j + 100));
          }
          flushed += valid.length;
        } catch (e) {
          console.error('Flush batch error:', e.message);
          errors += valid.length;
          // D1 write failed — extend KV TTL to prevent data loss (7 days, #R4-Fix-B)
          await Promise.all(valid.map(async (entry) => {
            try {
              await env.TICKER_KV.put(entry.key, JSON.stringify(entry.data), { expirationTtl: 604800 });
            } catch (e) {
              console.error('handleFormosaFlushBuffer KV re-put error:', e.message || e);
            }
          }));
          continue;
        }
      }

      if (invalid.length > 0) {
        skipped += invalid.length;
      }
    }

    // Update accurate user point counts from D1
    try {
      const counts = await env.AUTH_DB.prepare(
        `SELECT user_id, COUNT(*) as cnt FROM formosa_gps_points GROUP BY user_id`
      ).all();
      for (const row of (counts?.results || [])) {
        await env.TICKER_KV.put(`gps_count:${row.user_id}`, String(row.cnt), { expirationTtl: 86400 * 30 });
      }
    } catch (e) {
      console.error('Flush: count sync error:', e.message);
    }

    // Record last successful flush time for /health monitoring
    await env.TICKER_KV.put('formosa:last_flush', new Date().toISOString(), { expirationTtl: 86400 });

    return { flushed, skipped, errors, total_buffered: allKeys.length, duration_ms: Date.now() - startTime };
  } catch (e) {
    console.error('Flush fatal:', e.message);
    return { flushed, skipped, errors: errors + 1, error: e.message, duration_ms: Date.now() - startTime };
  } finally {
    // Lock 自動由 TTL 90s 過期清理，不再手動 delete
  }
}

// ── Admin: Role Management ──
export async function handleFormosaAdminRoles(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);

    if (request.method === 'GET') {
      const users = await env.AUTH_DB.prepare(
        `SELECT line_user_id, display_name, picture_url, role, created_at FROM formosa_users ORDER BY role DESC, created_at ASC`
      ).all();
      return jsonResponse({ users: users?.results || [] }, 200, request);
    }

    // POST — update user role
    const body = await request.json();
    if (!body.user_id || !body.role) {
      return jsonResponse({ error: 'user_id and role required' }, 400, request);
    }
    const validRoles = ['participant', 'volunteer', 'admin'];
    if (!validRoles.includes(body.role)) {
      return jsonResponse({ error: 'Invalid role. Use: participant, volunteer, admin' }, 400, request);
    }
    await env.AUTH_DB.prepare(
      'UPDATE formosa_users SET role = ?, updated_at = datetime(\'now\') WHERE line_user_id = ?'
    ).bind(body.role, body.user_id).run();
    return jsonResponse({ ok: true, user_id: body.user_id, role: body.role }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Push Notification: Send to users by role ──
export async function handleFormosaPush(request, env) {
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetRole = body.role || 'all'; // all | participant | volunteer | admin
    const customText = body.text || '媽祖保佑 🙏\n記錄您的進香足跡吧！';
    const customTitle = body.title || '📍 進香打卡提醒';
    const mode = body.mode || 'template'; // 'text' | 'image' | 'image+text' | 'template'
    const dryRun = body.dry_run || false;
    const imageUrl = body.image_url || '';
    const PUSH_PREVIEW_FALLBACK = 'https://mazu.today/images/formosa-esg-2026-og.png';
    const previewUrl = body.preview_url || PUSH_PREVIEW_FALLBACK;

    const behaviorFilter = ['active', 'inactive'].includes(body.behavior_filter) ? body.behavior_filter : 'all';
    const behaviorHours = Math.min(Math.max(parseInt(body.behavior_hours) || 24, 1), 168);

    // Get users filtered by role (exclude paused/completed from push)
    // Admin pushes bypass participant_status filter — admins should always receive
    const isAdminTarget = targetRole === 'admin';
    let query = isAdminTarget
      ? "SELECT line_user_id FROM formosa_users WHERE line_user_id IS NOT NULL AND role = 'admin'"
      : "SELECT line_user_id FROM formosa_users WHERE line_user_id IS NOT NULL AND (participant_status IS NULL OR participant_status = 'active')";
    const queryParams = [];
    if (!isAdminTarget && targetRole !== 'all') {
      query += ' AND role = ?';
      queryParams.push(targetRole);
    }
    if (behaviorFilter !== 'all') {
      // Compute cutoff as ISO string to use as parameterized value
      const cutoff = new Date(Date.now() - behaviorHours * 3600 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      if (behaviorFilter === 'active') {
        query += ' AND line_user_id IN (SELECT DISTINCT user_id FROM formosa_gps_points WHERE timestamp > ?)';
      } else {
        query += ' AND line_user_id NOT IN (SELECT DISTINCT user_id FROM formosa_gps_points WHERE timestamp > ?)';
      }
      queryParams.push(cutoff);
    }
    const users = queryParams.length > 0
      ? await env.AUTH_DB.prepare(query).bind(...queryParams).all()
      : await env.AUTH_DB.prepare(query).all();

    if (!users.results?.length) {
      return jsonResponse({ ok: true, sent: 0, message: 'No users to notify' }, 200, request);
    }

    const userIds = users.results.map(u => u.line_user_id);
    const validIds = userIds.filter(id => id && /^U[0-9a-f]{32}$/.test(id));
    const skipped = userIds.length - validIds.length;

    // Dry run: return count only without sending
    if (dryRun) {
      return jsonResponse({ ok: true, count: validIds.length, skipped, role: targetRole, behavior_filter: behaviorFilter, behavior_hours: behaviorHours }, 200, request);
    }

    if (!validIds.length) {
      return jsonResponse({ ok: true, sent: 0, skipped, message: 'No valid LINE IDs after format validation' }, 200, request);
    }

    let messages;
    if (mode === 'image') {
      if (!imageUrl) return jsonResponse({ error: 'image_url is required for image mode' }, 400, request);
      messages = [{
        type: 'image',
        originalContentUrl: imageUrl,
        previewImageUrl: previewUrl
      }];
    } else if (mode === 'image+text') {
      if (!imageUrl) return jsonResponse({ error: 'image_url is required for image+text mode' }, 400, request);
      messages = [
        { type: 'text', text: customText },
        { type: 'image', originalContentUrl: imageUrl, previewImageUrl: previewUrl }
      ];
    } else if (mode === 'text') {
      // Plain text message — URLs auto-render as clickable links in LINE
      messages = [{ type: 'text', text: customText }];
    } else {
      // Template with button (legacy behavior)
      messages = [{
        type: 'template',
        altText: `📍 ${customTitle}`,
        template: {
          type: 'buttons',
          title: customTitle,
          text: customText,
          actions: [
            {
              type: 'uri',
              label: '立即打卡 📍',
              uri: TRACKER_URL
            }
          ]
        }
      }];
    }

    const lineResults = await multicastLineMessage(validIds, env.FORMOSA_LINE_TOKEN, messages);

    return jsonResponse({ ok: true, sent: validIds.length, skipped, role: targetRole, behavior_filter: behaviorFilter, behavior_hours: behaviorHours, mode, line_results: lineResults }, 200, request);
  } catch (e) {
    console.error('Push error:', e.message);
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Scheduled Push (called from cron) ──
const PUSH_MESSAGES = [
  { title: '📍 早安打卡', text: '媽祖保佑 🙏 新的一天，記錄您的進香足跡！' },
  { title: '📍 午間打卡', text: '走了好多路！打個卡記錄一下 🚶' },
  { title: '📍 下午打卡', text: '繼續前進！打卡累積您的香客等級 ✨' },
  { title: '📍 傍晚打卡', text: '今天辛苦了 🙏 打卡記錄今日行程' },
];

export async function handleFormosaScheduledPush(env) {
  // Only push during pilgrimage: 4/12 - 4/20, every 3 hours (6am, 9am, 12pm, 3pm, 6pm)
  const now = new Date(Date.now() + 8 * 3600 * 1000); // UTC+8
  const month = now.getUTCMonth() + 1; // 1-indexed
  const day = now.getUTCDate();
  const hour = now.getUTCHours();

  if (month !== 4 || day < 12 || day > 20) return { skipped: true, reason: 'outside pilgrimage dates' };

  const pushHours = [9];
  if (!pushHours.includes(hour)) return { skipped: true, reason: 'not a push hour, current: ' + hour };

  // Check activity status
  const status = await getFormosaStatus(env.TICKER_KV);
  if (status.status !== 'active') return { skipped: true, reason: 'activity ' + status.status };

  // Pick message index based on hour
  const msgIdx = Math.min(pushHours.indexOf(hour), PUSH_MESSAGES.length - 1);

  // ── 按語言分組推播 ──
  const localeConfigs = [
    {
      locale: 'zh-Hant',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND (language IS NULL OR language LIKE 'zh-TW%' OR language LIKE 'zh-Hant%' OR language = 'zh')`,
      bind: [],
    },
    {
      locale: 'en',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND language LIKE ?`,
      bind: ['en%'],
    },
    {
      locale: 'ja',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND language LIKE ?`,
      bind: ['ja%'],
    },
    {
      locale: 'zh-Hans',
      query: `SELECT line_user_id FROM formosa_users
              WHERE line_user_id IS NOT NULL
              AND (participant_status IS NULL OR participant_status = 'active')
              AND (language = 'zh-CN' OR language LIKE 'zh-Hans%')`,
      bind: [],
    },
  ];

  const trackerUrl = 'https://mazu.today/tracker/?v=2';
  let totalSent = 0;

  for (const { locale, query, bind } of localeConfigs) {
    try {
      const stmt = env.AUTH_DB.prepare(query);
      const users = bind.length > 0
        ? await stmt.bind(...bind).all()
        : await stmt.all();

      if (!users.results?.length) continue;

      const pushMessages = BOT_MESSAGES[locale].push;
      const msg = pushMessages[Math.min(msgIdx, pushMessages.length - 1)];
      const localizedUrl = localizeUrl(trackerUrl, locale);
      const userIds = users.results.map(u => u.line_user_id);

      await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [
        { type: 'text', text: `${msg.title}\n\n${msg.text}\n\n📍 ${localizedUrl}` }
      ]);

      totalSent += userIds.length;
    } catch (e) {
      console.error(`ScheduledPush ${locale} error:`, e.message || e);
    }
  }

  return { sent: totalSent };
}

// ── Data Dashboard API (admin only) ──
export async function handleFormosaData(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;

  try {
    // KV cache: avoid D1 read storm during high traffic
    const cacheKey = 'formosa_data_cache';
    const cached = await env.TICKER_KV.get(cacheKey, 'json');
    if (cached) return jsonResponse(cached, 200, request);

    const surveys = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_surveys').first();
    const points = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_gps_points').first();
    const users = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_users').first();
    const recentPoints = await env.AUTH_DB.prepare('SELECT lat, lng, source, timestamp, user_id FROM formosa_gps_points ORDER BY created_at DESC LIMIT 200').all();

    // Carbon summary
    const carbonSum = await env.AUTH_DB.prepare('SELECT SUM(carbon_total_kg) as total, AVG(carbon_total_kg) as avg FROM formosa_surveys').first();

    const payload = {
      stats: {
        total_surveys: surveys?.cnt || 0,
        total_gps_points: points?.cnt || 0,
        total_users: users?.cnt || 0,
        carbon_total_kg: +(carbonSum?.total || 0).toFixed(2),
        carbon_avg_kg: +(carbonSum?.avg || 0).toFixed(2),
      },
      gps_points: recentPoints?.results || [],
    };

    await env.TICKER_KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 60 });
    return jsonResponse(payload, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── 9-Level Pilgrim Ranking (mirrored from frontend) ──
const TITLES = [
  { km: 0,   checkins: 1,  icon: '🔥', name: '煉氣香客', sub: '啟程入門者' },
  { km: 15,  checkins: 5,  icon: '🧱', name: '築基香客', sub: '開始上路者' },
  { km: 45,  checkins: 10, icon: '💛', name: '金丹香客', sub: '穩定行腳者' },
  { km: 90,  checkins: 15, icon: '👶', name: '元嬰香客', sub: '深度參與者' },
  { km: 135, checkins: 20, icon: '✨', name: '化神香客', sub: '高里程行者' },
  { km: 180, checkins: 25, icon: '🌀', name: '煉虛香客', sub: '進階完成者' },
  { km: 225, checkins: 30, icon: '🤝', name: '合體香客', sub: '高階完成者' },
  { km: 270, checkins: 35, icon: '🏆', name: '大乘香客', sub: '榮譽進階者' },
  { km: 300, checkins: 40, icon: '🚀', name: '飛升香客', sub: '圓滿認證者' }
];

function computeRank(km, checkins) {
  let current = TITLES[0], next = null;
  for (let i = TITLES.length - 1; i >= 0; i--) {
    if (km >= TITLES[i].km && checkins >= TITLES[i].checkins) { current = TITLES[i]; break; }
  }
  for (let j = 0; j < TITLES.length; j++) {
    if (km < TITLES[j].km || checkins < TITLES[j].checkins) { next = TITLES[j]; break; }
  }
  return { current, next };
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const VALID_SOURCES = new Set(['auto', 'manual', 'photo', 'checkin', 'remote', 'saved']);

// Shared filtered-km calculation (Stats API baseline logic + remote exclusion)
function computeFilteredKm(pts) {
  if (!pts || pts.length < 2) return 0;
  const sorted = pts
    .filter(p => p.source !== 'remote')
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let totalKm = 0;
  for (let i = 1; i < sorted.length; i++) {
    const dist = haversine(sorted[i-1].lat, sorted[i-1].lng, sorted[i].lat, sorted[i].lng);
    const timeDiffHours = (new Date(sorted[i].timestamp) - new Date(sorted[i-1].timestamp)) / 3600000;
    if (dist < 0.01 || timeDiffHours <= 0 || timeDiffHours < 1/120) continue;
    if (dist / timeDiffHours > 300) continue;
    totalKm += dist;
  }
  return totalKm;
}

const SPEED_THRESHOLDS = [
  { maxSpeed: 15,       mode: 'zero_emission', gwp: 0 },          // ≤ 15 km/h → 步行/腳踏車，零排放
  { maxSpeed: Infinity, mode: 'motorized',     gwp: 0.12013 }     // > 15 km/h → 巴士人均係數 (ecoinvent "market for transport, regular bus")
];

function inferTransportMode(speedKmh) {
  for (const t of SPEED_THRESHOLDS) {
    if (speedKmh <= t.maxSpeed) return t;
  }
}

// ── Per-User Dashboard API ──
export async function handleFormosaUser(request, env, userId) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  try {
    // Ownership check: full data for owner/admin, limited public view otherwise
    const callerId = request.headers.get('X-Line-User-Id');
    const isOwner = callerId === userId;
    const isAdmin = !await requireAdmin(request, env);
    await migrateFormosa(env.AUTH_DB);
    const user = await env.AUTH_DB.prepare('SELECT display_name, picture_url, role, created_at FROM formosa_users WHERE line_user_id = ?').bind(userId).first();
    const points = await env.AUTH_DB.prepare('SELECT lat, lng, altitude, accuracy, source, timestamp FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC').bind(userId).all();
    const survey = await env.AUTH_DB.prepare('SELECT * FROM formosa_surveys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(userId).first();

    // Aggregate carbon from daily reports (primary source)
    const dailyAgg = await env.AUTH_DB.prepare(
      `SELECT COALESCE(SUM(carbon_gwp), 0) as total_gwp, COALESCE(SUM(carbon_wu), 0) as total_wu, COUNT(*) as report_days FROM formosa_daily_reports WHERE user_id = ?`
    ).bind(userId).first();

    const pts = points?.results || [];
    const totalKm = computeFilteredKm(pts);
    let totalCarbon = 0;
    const transportBreakdown = { zero_emission: 0, motorized: 0 };

    // Carbon/transport breakdown (same filters as computeFilteredKm)
    const nonRemote = pts.filter(p => p.source !== 'remote');
    for (let i = 1; i < nonRemote.length; i++) {
      const dist = haversine(nonRemote[i-1].lat, nonRemote[i-1].lng, nonRemote[i].lat, nonRemote[i].lng);
      const timeDiffHours = (new Date(nonRemote[i].timestamp) - new Date(nonRemote[i-1].timestamp)) / 3600000;
      if (dist < 0.01 || timeDiffHours <= 0 || timeDiffHours < 1/120) continue;
      const speed = dist / timeDiffHours;
      if (speed > 300) continue;
      const transport = inferTransportMode(speed);
      totalCarbon += dist * transport.gwp;
      transportBreakdown[transport.mode] += dist;
    }

    const manualCheckins = pts.filter(p => p.source === 'manual').length;
    const inRangePts = pts.filter(p => p.source !== 'remote');
    const checkins = manualCheckins || Math.max(inRangePts.length, 1);
    const rank = computeRank(totalKm, checkins);

    // GPS-inferred transport carbon + daily report non-transport carbon (hotel, water)
    const gpsCarbon = totalCarbon;
    const dailyNonTransport = (dailyAgg?.total_gwp || 0) > 0
      ? 0  // daily reports already include transport; avoid double-counting if user also filed reports
      : 0;
    const hotelWaterCarbon = 0; // TODO: aggregate hotel/water from daily reports separately if needed
    const carbonKg = gpsCarbon + hotelWaterCarbon;

    // Carbon saved: if entire distance were motorized (bus coefficient)
    const carbonSaved = totalKm * GWP_FACTORS.bus - gpsCarbon;

    const stats = {
      total_points: pts.length,
      total_km: +totalKm.toFixed(2),
      carbon_kg: +carbonKg.toFixed(2),
      carbon_saved_kg: +Math.max(0, carbonSaved).toFixed(2),
      carbon_wu: +(dailyAgg?.total_wu || 0).toFixed(2),
      report_days: dailyAgg?.report_days || 0,
      checkins,
      transport_breakdown: Object.fromEntries(Object.entries(transportBreakdown).map(([k, v]) => [k, +v.toFixed(2)])),
      rank: rank.current,
      next_rank: rank.next ? { name: rank.next.name, icon: rank.next.icon, km_needed: +(rank.next.km - totalKm).toFixed(1), checkins_needed: Math.max(0, rank.next.checkins - checkins) } : null
    };

    // Non-owner/non-admin: return public stats only (no survey, no raw GPS)
    if (!isOwner && !isAdmin) {
      return jsonResponse({
        user: { display_name: user?.display_name || 'Anonymous', created_at: null },
        gps_points: pts.map(p => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp, source: p.source })),
        survey: null,
        stats
      }, 200, request);
    }

    return jsonResponse({
      user: user || { display_name: 'Anonymous', created_at: null },
      gps_points: pts,
      survey: survey || null,
      stats
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Survey Aggregations ──
export async function handleFormosaAdminSurveys(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    await migrateFormosa(env.AUTH_DB);
    const rows = await env.AUTH_DB.prepare('SELECT q1_good_deeds, q2_moved_by, q3_transport, q4_eco, q5_stay, q6_meal, role_type FROM formosa_surveys').all();
    const data = rows?.results || [];

    const aggregate = (field, isJson) => {
      const counts = {};
      data.forEach(r => {
        if (isJson) {
          try { JSON.parse(r[field] || '[]').forEach(v => { counts[v] = (counts[v] || 0) + 1; }); } catch(e) {}
        } else {
          const v = r[field] || '未填';
          counts[v] = (counts[v] || 0) + 1;
        }
      });
      return counts;
    };

    return jsonResponse({
      total_surveys: data.length,
      q1_deeds: aggregate('q1_good_deeds', true),
      q2_moved: aggregate('q2_moved_by', true),
      q3_transport: aggregate('q3_transport', false),
      q4_eco: aggregate('q4_eco', true),
      q5_stay: aggregate('q5_stay', false),
      q6_meal: aggregate('q6_meal', false),
      role_distribution: aggregate('role_type', false)
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Carbon Analytics ──
export async function handleFormosaAdminCarbon(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    await migrateFormosa(env.AUTH_DB);

    // GPS-derived distance and carbon (primary source)
    // #168: Filter out 'remote' points (outside geofence) to prevent ghost mileage
    const allPoints = await env.AUTH_DB.prepare(
      "SELECT user_id, lat, lng, source, timestamp FROM formosa_gps_points WHERE source != 'remote' ORDER BY user_id, timestamp ASC"
    ).all();
    const pts = allPoints?.results || [];

    const perUser = {};
    let prevPt = null;
    for (const pt of pts) {
      if (!perUser[pt.user_id]) perUser[pt.user_id] = { zero_emission: 0, motorized: 0 };
      if (prevPt && prevPt.user_id === pt.user_id) {
        const dist = haversine(prevPt.lat, prevPt.lng, pt.lat, pt.lng);
        const timeDiffHours = (new Date(pt.timestamp) - new Date(prevPt.timestamp)) / 3600000;
        if (dist >= 0.01 && timeDiffHours > 0 && timeDiffHours >= 1/120) {
          const speed = dist / timeDiffHours;
          if (speed <= 300) {
            const transport = inferTransportMode(speed);
            perUser[pt.user_id][transport.mode] += dist;
          }
        }
      }
      prevPt = pt;
    }

    let gpsWalkKm = 0, gpsMotorizedKm = 0, gpsCarbonTotal = 0;
    const userIds = Object.keys(perUser);
    for (const uid of userIds) {
      gpsWalkKm += perUser[uid].zero_emission;
      gpsMotorizedKm += perUser[uid].motorized;
      gpsCarbonTotal += perUser[uid].motorized * 0.12013;
    }
    const gpsTotalKm = gpsWalkKm + gpsMotorizedKm;

    // Survey data (supplementary: water, hotel, survey-reported transport)
    const rows = await env.AUTH_DB.prepare('SELECT transport_walk, transport_car, transport_carpool, transport_scooter, transport_bus, transport_mrt, transport_train, transport_hsr, water_bottles, hotel_nights, carbon_total_kg FROM formosa_surveys').all();
    const data = rows?.results || [];

    const modes = ['walk','car','scooter','bus','mrt','train','hsr'];
    const surveyTotals = {};
    modes.forEach(m => { surveyTotals[m] = { km: 0, users: 0 }; });
    data.forEach(r => {
      modes.forEach(m => {
        const km = r['transport_' + m] || 0;
        if (km > 0) { surveyTotals[m].km += km; surveyTotals[m].users++; }
      });
    });

    // Water and hotel from formosa_daily_reports (survey Q removed these fields)
    const drRow = await env.AUTH_DB.prepare(
      'SELECT COALESCE(SUM(water_bottles),0) as water_total, COALESCE(SUM(recycle_bottles),0) as recycle_total, COALESCE(SUM(hotel),0) as hotel_total FROM formosa_daily_reports'
    ).first();
    const waterTotal = (drRow && drRow.water_total) || 0;
    const hotelTotal = (drRow && drRow.hotel_total) || 0;

    // Merge: use GPS-derived walk km (more accurate), keep survey transport breakdown
    const transportTotals = { ...surveyTotals };
    transportTotals.walk = { km: gpsWalkKm, users: userIds.length };

    // Carbon saved: if all walk km were driven by bus (0.12013 kg CO2e/person·km)
    const carbonSaved = Math.max(0, gpsWalkKm * GWP_FACTORS.bus);

    return jsonResponse({
      total_carbon_kg: +gpsCarbonTotal.toFixed(2),
      avg_carbon_kg: userIds.length ? +(gpsCarbonTotal / userIds.length).toFixed(2) : 0,
      total_surveys: data.length,
      transport_totals: transportTotals,
      carbon_saved_kg: +carbonSaved.toFixed(2),
      hypothetical_driving_kg: +(gpsWalkKm * GWP_FACTORS.bus).toFixed(2),
      water_bottles_total: waterTotal,
      hotel_nights_total: hotelTotal,
      gps_total_km: +gpsTotalKm.toFixed(2),
      gps_users: userIds.length
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Activity Timeline ──
export async function handleFormosaAdminTimeline(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    await migrateFormosa(env.AUTH_DB);
    const byDay = await env.AUTH_DB.prepare(
      "SELECT date(created_at) as d, COUNT(*) as cnt, COUNT(DISTINCT user_id) as users FROM formosa_gps_points GROUP BY d ORDER BY d"
    ).all();
    const byHour = await env.AUTH_DB.prepare(
      "SELECT strftime('%Y-%m-%dT%H', created_at) as h, COUNT(*) as cnt FROM formosa_gps_points WHERE created_at >= datetime('now', '-7 days') GROUP BY h ORDER BY h"
    ).all();
    const activeToday = await env.AUTH_DB.prepare(
      "SELECT COUNT(DISTINCT user_id) as cnt FROM formosa_gps_points WHERE date(created_at) = date('now')"
    ).first();
    const totalPts = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_gps_points').first();

    return jsonResponse({
      by_day: byDay?.results || [],
      by_hour: byHour?.results || [],
      active_today: activeToday?.cnt || 0,
      total_gps_points: totalPts?.cnt || 0
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: User Table ──
export async function handleFormosaAdminUsers(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    await migrateFormosa(env.AUTH_DB);
    // #168: Exclude 'remote' points from gps_count to prevent ghost checkin inflation
    const gpsUsers = await env.AUTH_DB.prepare(`
      SELECT u.line_user_id as user_id, u.display_name, u.picture_url, u.role,
        COUNT(CASE WHEN g.source != 'remote' THEN g.id END) as gps_count,
        MAX(g.created_at) as last_active,
        MIN(g.created_at) as first_active
      FROM formosa_users u
      LEFT JOIN formosa_gps_points g ON u.line_user_id = g.user_id
      GROUP BY u.line_user_id
      ORDER BY MAX(g.created_at) DESC
    `).all();

    // Fetch all GPS points to compute walk_km and carbon_kg from actual tracks
    // #168: Include source column and filter out 'remote' (outside geofence) points
    const allPoints = await env.AUTH_DB.prepare(
      "SELECT user_id, lat, lng, source, timestamp FROM formosa_gps_points WHERE source != 'remote' ORDER BY user_id, timestamp ASC"
    ).all();
    const pts = allPoints?.results || [];

    // Compute per-user distance and carbon from GPS tracks
    const gpsStats = {};
    let prevPt = null;
    for (const pt of pts) {
      if (!gpsStats[pt.user_id]) gpsStats[pt.user_id] = { km: 0, carbon: 0 };
      if (prevPt && prevPt.user_id === pt.user_id) {
        const dist = haversine(prevPt.lat, prevPt.lng, pt.lat, pt.lng);
        const timeDiffHours = (new Date(pt.timestamp) - new Date(prevPt.timestamp)) / 3600000;
        if (dist >= 0.01 && timeDiffHours > 0 && timeDiffHours >= 1/120) {
          const speed = dist / timeDiffHours;
          if (speed <= 300) {
            const transport = inferTransportMode(speed);
            gpsStats[pt.user_id].km += dist;
            gpsStats[pt.user_id].carbon += dist * transport.gwp;
          }
        }
      }
      prevPt = pt;
    }

    const surveys = await env.AUTH_DB.prepare('SELECT user_id, carbon_total_kg, transport_walk FROM formosa_surveys').all();
    const surveyMap = {};
    (surveys?.results || []).forEach(s => { surveyMap[s.user_id] = s; });

    const users = (gpsUsers?.results || []).map(u => {
      const s = surveyMap[u.user_id];
      const gs = gpsStats[u.user_id] || { km: 0, carbon: 0 };
      return {
        user_id: u.user_id,
        display_name: u.display_name || u.user_id.substring(0, 8),
        picture_url: u.picture_url || null,
        role: u.role || 'participant',
        gps_count: u.gps_count,
        survey_done: !!s,
        carbon_kg: +gs.carbon.toFixed(2),
        walk_km: +gs.km.toFixed(1),
        last_active: u.last_active,
        first_active: u.first_active
      };
    });

    return jsonResponse({ users }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Zoom → Grid Cell Size mapping ──
function zoomToCellSize(zoom) {
  const map = {
    6: 0.2, 7: 0.1, 8: 0.05, 9: 0.025, 10: 0.012,
    11: 0.006, 12: 0.003, 13: 0.0015,
  };
  return map[Math.min(Math.max(zoom, 6), 13)] || 0.025;
}

// ── Admin: Server-side GPS Grid Clustering ──
export async function handleFormosaAdminClusters(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  try {
    const url = new URL(request.url);
    const zoom = parseInt(url.searchParams.get('zoom')) || 9;
    const since = url.searchParams.get('since') || null;
    const cellSize = zoomToCellSize(zoom);

    // KV cache (30s TTL)
    const cacheKey = `formosa_clusters_z${zoom}_${since || 'all'}`;
    const cached = await env.TICKER_KV.get(cacheKey, 'json');
    if (cached) return jsonResponse(cached, 200, request);

    await migrateFormosa(env.AUTH_DB);
    let sql = 'SELECT lat, lng, user_id, created_at FROM formosa_gps_points';
    const params = [];
    if (since) {
      sql += ' WHERE created_at >= ?';
      params.push(since);
    }
    sql += ' ORDER BY created_at ASC';
    const points = await env.AUTH_DB.prepare(sql).bind(...params).all();
    const rows = points?.results || [];
    if (rows.length === 0) {
      const empty = { clusters: [], front: null, tail: null, spread_km: 0, lost: 0, total_points: 0, total_users: 0, zoom, cell_size: cellSize };
      return jsonResponse(empty, 200, request);
    }

    const grid = {};
    let latestByUser = {};
    const userSet = new Set();
    rows.forEach(p => {
      const key = Math.floor(p.lat / cellSize) + ',' + Math.floor(p.lng / cellSize);
      if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, users: new Set() };
      grid[key].lat += p.lat;
      grid[key].lng += p.lng;
      grid[key].count++;
      grid[key].users.add(p.user_id);
      userSet.add(p.user_id);
      if (!latestByUser[p.user_id] || p.created_at > latestByUser[p.user_id].created_at) {
        latestByUser[p.user_id] = p;
      }
    });

    const clusters = Object.values(grid).map(c => ({
      lat: c.lat / c.count,
      lng: c.lng / c.count,
      count: c.count,
      users: c.users.size
    }));

    // Front/tail from latest positions per user
    const latestPoints = Object.values(latestByUser);
    latestPoints.sort((a, b) => a.lat - b.lat);
    const front = latestPoints.length > 0 ? latestPoints[latestPoints.length - 1] : null;
    const tail = latestPoints.length > 0 ? latestPoints[0] : null;

    let spread_km = 0;
    if (front && tail) {
      const R = 6371;
      const dLat = (front.lat - tail.lat) * Math.PI / 180;
      const dLng = (front.lng - tail.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(tail.lat*Math.PI/180) * Math.cos(front.lat*Math.PI/180) * Math.sin(dLng/2)**2;
      spread_km = +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
    }

    const twoHoursAgo = new Date(Date.now() - 2*60*60*1000).toISOString();
    const lost = latestPoints.filter(p => p.created_at < twoHoursAgo).length;

    // Sedan volunteer GPS median — for crown positioning
    const thirtyMinAgo = new Date(Date.now() - 30*60*1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24*60*60*1000).toISOString();
    let sedan = null;
    try {
      // Active sedan volunteers: is_sedan=1 AND had GPS in last 30 minutes
      const sedanRows = await env.AUTH_DB.prepare(`
        SELECT g.lat, g.lng FROM formosa_gps_points g
        JOIN formosa_users u ON g.user_id = u.line_user_id
        WHERE u.is_sedan = 1 AND g.created_at >= ?
        ORDER BY g.created_at DESC
      `).bind(thirtyMinAgo).all();
      const sedanPts = sedanRows?.results || [];

      // Count active sedan volunteers (unique users with GPS in last 30 min)
      const activeSet = new Set(sedanPts.length > 0 ? (await env.AUTH_DB.prepare(`
        SELECT DISTINCT g.user_id FROM formosa_gps_points g
        JOIN formosa_users u ON g.user_id = u.line_user_id
        WHERE u.is_sedan = 1 AND g.created_at >= ?
      `).bind(thirtyMinAgo).all()).results.map(r => r.user_id) : []);

      // Total: sedan volunteers with GPS in last 24h (not all-time)
      const totalSedanResult = await env.AUTH_DB.prepare(`
        SELECT COUNT(DISTINCT g.user_id) as cnt FROM formosa_gps_points g
        JOIN formosa_users u ON g.user_id = u.line_user_id
        WHERE u.is_sedan = 1 AND g.created_at >= ?
      `).bind(twentyFourHoursAgo).first();

      if (sedanPts.length > 0) {
        // Median lat/lng
        const lats = sedanPts.map(p => p.lat).sort((a, b) => a - b);
        const lngs = sedanPts.map(p => p.lng).sort((a, b) => a - b);
        const mid = Math.floor(lats.length / 2);
        sedan = {
          lat: lats.length % 2 ? lats[mid] : (lats[mid - 1] + lats[mid]) / 2,
          lng: lngs.length % 2 ? lngs[mid] : (lngs[mid - 1] + lngs[mid]) / 2,
          activeSedan: activeSet.size,
          totalSedan: totalSedanResult?.cnt || 0
        };
      }
    } catch (e) {
      console.error('Sedan query error:', e);
    }

    const result = { clusters, front, tail, sedan, spread_km, lost, total_points: rows.length, total_users: userSet.size, zoom, cell_size: cellSize };
    await env.TICKER_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 60 });
    return jsonResponse(result, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Keyword Router ──
async function getUserLocale(userId, env) {
  if (!userId) return 'zh-Hant';
  try {
    const row = await env.AUTH_DB.prepare(
      'SELECT language FROM formosa_users WHERE line_user_id = ?'
    ).bind(userId).first();
    return mapLineLanguageToLocale(row?.language);
  } catch {
    return 'zh-Hant';
  }
}

const TRACKER_URL = 'https://mazu.today/tracker/?v=2';
const PROJECT_URL = 'https://mazu.today/';
const GUIDE_URL = 'https://mazu.today/guide/';

async function routeKeyword(text, userId, env) {
  const locale = await getUserLocale(userId, env);
  const t = text.toLowerCase();

  const trackerUrl = localizeUrl(TRACKER_URL, locale);
  const projectUrl = localizeUrl(PROJECT_URL, locale);
  const guideUrl = localizeUrl(GUIDE_URL, locale);
  const feedbackUrl = localizeUrl('https://mazu.today/feedback/', locale);

  // 打卡 — 同時支援中英日關鍵字
  if (/打卡|checkin|check.?in|記錄|チェックイン/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'checkin', { url: trackerUrl }) }];
  }

  // 說明 / 幫助
  if (/說明|使用|幫助|help|怎麼用|功能|ヘルプ|使い方/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'help', { url: guideUrl }) }];
  }

  // 回報 / bug
  if (/回報|問題|bug|反饋|建議|report|フィードバック/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'bug', { feedbackUrl }) }];
  }

  // 等級 / 紀錄
  if (/等級|紀錄|我的|成就|level|stats|排行|rank|レベル|記録/.test(t)) {
    return [await buildStatsMessage(userId, env, locale)];
  }

  // 分享
  if (/分享|share|推薦|シェア/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'share', { url: trackerUrl }) }];
  }

  // 碳足跡
  if (/碳|carbon|co2|排放|CO₂/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'carbon', { url: trackerUrl }) }];
  }

  // 關於 / 專案
  if (/關於|專案|esg|永續|什麼|about|プロジェクト/.test(t)) {
    return [{ type: 'text', text: botMsg(locale, 'about', { url: projectUrl }) }];
  }

  // 預設：功能選單
  return [{ type: 'text', text: botMsg(locale, 'menu') }];
}

// ── Welcome Flex Message (follow event) ──
function buildWelcomeMessage(locale = 'zh-Hant') {
  return {
    type: 'flex',
    altText: botMsg(locale, 'welcome_alt'),
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#1a5c2a',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: botMsg(locale, 'welcome_header_title'), color: '#ffffff', size: 'xl', weight: 'bold' },
          { type: 'text', text: botMsg(locale, 'welcome_header_subtitle'), color: '#b8e6c8', size: 'sm', margin: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'text', text: botMsg(locale, 'welcome_thanks'), weight: 'bold', size: 'lg' },
          { type: 'text', text: botMsg(locale, 'welcome_intro'), wrap: true, size: 'sm', color: '#666666', margin: 'md' },
          { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
            { type: 'text', text: botMsg(locale, 'welcome_feat_gps'), size: 'sm' },
            { type: 'text', text: botMsg(locale, 'welcome_feat_photo'), size: 'sm' },
            { type: 'text', text: botMsg(locale, 'welcome_feat_carbon'), size: 'sm' },
            { type: 'text', text: botMsg(locale, 'welcome_feat_level'), size: 'sm' }
          ]},
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: botMsg(locale, 'welcome_keyword_hint'), size: 'xs', color: '#999999', margin: 'lg' },
          { type: 'text', text: botMsg(locale, 'welcome_keywords'), size: 'xs', color: '#999999', margin: 'xs' }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '15px',
        contents: [
          { type: 'button', style: 'primary', color: '#1a5c2a', action: { type: 'uri', label: botMsg(locale, 'welcome_btn_checkin'), uri: localizeUrl(TRACKER_URL, locale) } },
          { type: 'button', style: 'link', action: { type: 'uri', label: botMsg(locale, 'welcome_btn_guide'), uri: localizeUrl(GUIDE_URL, locale) } }
        ]
      }
    }
  };
}

// ── Stats Message (from DB) ──
async function buildStatsMessage(userId, env, locale = 'zh-Hant') {
  if (!userId) return { type: 'text', text: botMsg(locale, 'stats_no_account') };

  try {
    // FIX-4: query GPS points to compute actual distance + manual checkin count
    const gpsRows = await env.AUTH_DB.prepare(
      'SELECT lat, lng, timestamp, source FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC'
    ).bind(userId).all();

    const pts = gpsRows.results || [];

    // Count only manual checkins (GPS auto-points don't count as check-ins)
    const checkins = pts.filter(p => p.source === 'manual').length;

    const totalKm = computeFilteredKm(pts);

    const survey = await env.AUTH_DB.prepare(
      'SELECT carbon_total_kg FROM formosa_surveys WHERE user_id = ? LIMIT 1'
    ).bind(userId).first();

    const user = await env.AUTH_DB.prepare(
      'SELECT photo_count FROM formosa_users WHERE line_user_id = ?'
    ).bind(userId).first();

    const carbon = survey?.carbon_total_kg || 0;
    const photos = user?.photo_count || 0;

    // Use computeRank which checks both km AND checkins (consistent with Tracker + Worker)
    const rank = computeRank(totalKm, checkins);
    const title = rank.current;

    const lines = [
      `${title.icon} ${title.name}`,
      '',
      botMsg(locale, 'stats_checkins', { count: checkins }),
      `📷 ${photos}`,
      botMsg(locale, 'stats_carbon', { carbon: carbon.toFixed(2) }),
      survey ? botMsg(locale, 'stats_survey_done') : botMsg(locale, 'stats_survey_pending')
    ];

    return { type: 'text', text: lines.join('\n') };
  } catch (e) {
    return { type: 'text', text: botMsg(locale, 'stats_error') };
  }
}


// ── Rich Menu Setup ──
export async function handleFormosaRichMenu(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;

  const token = env.FORMOSA_LINE_TOKEN;
  const LINE_API = 'https://api.line.me/v2/bot';

  try {
    // Step 1: Create Rich Menu structure
    // Layout: 2500x843, 2 rows x 3 columns = 6 buttons
    const richMenu = {
      size: { width: 2500, height: 843 },
      selected: true,
      name: 'Formosa ESG 2026',
      chatBarText: '📍 媽祖進香選單',
      areas: [
        // Row 1
        { bounds: { x: 0, y: 0, width: 833, height: 421 }, action: { type: 'message', text: '打卡' } },
        { bounds: { x: 833, y: 0, width: 834, height: 421 }, action: { type: 'message', text: '等級' } },
        { bounds: { x: 1667, y: 0, width: 833, height: 421 }, action: { type: 'message', text: '碳足跡' } },
        // Row 2
        { bounds: { x: 0, y: 421, width: 833, height: 422 }, action: { type: 'message', text: '說明' } },
        { bounds: { x: 833, y: 421, width: 834, height: 422 }, action: { type: 'message', text: '關於' } },
        { bounds: { x: 1667, y: 421, width: 833, height: 422 }, action: { type: 'uri', uri: TRACKER_URL, label: '開啟 Tracker' } }
      ]
    };

    // Create rich menu
    const createRes = await fetch(`${LINE_API}/richmenu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(richMenu)
    });
    const createData = await createRes.json();
    if (!createRes.ok) return jsonResponse({ error: 'Create failed', detail: createData }, 500, request);
    const richMenuId = createData.richMenuId;

    // Step 2: Fetch pre-built image and upload to LINE
    const imgRes = await fetchRichMenuImage();
    const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: { 'Content-Type': 'image/png', 'Authorization': `Bearer ${token}` },
      body: imgRes
    });
    if (!uploadRes.ok) {
      const uploadErr = await uploadRes.text();
      return jsonResponse({ error: 'Image upload failed', detail: uploadErr, richMenuId }, 500, request);
    }

    // Step 3: Set as default for all users
    const defaultRes = await fetch(`${LINE_API}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return jsonResponse({
      ok: true,
      richMenuId,
      set_default: defaultRes.ok
    }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// Rich Menu image: fetch pre-built PNG from site
const RICH_MENU_IMAGE_URL = 'https://mazu.today/images/formosa/rich-menu-v2.png';

async function fetchRichMenuImage() {
  const res = await fetch(RICH_MENU_IMAGE_URL);
  if (!res.ok) throw new Error('Failed to fetch rich menu image: ' + res.status);
  return await res.arrayBuffer();
}

// ── LINE API Helpers ──
async function getLineProfile(userId, token) {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('getLineProfile error:', e.message || e);
  }
  return null;
}

async function sendLineMessage(userId, token, messages) {
  return fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ to: userId, messages })
  });
}

async function replyLineMessage(replyToken, token, messages) {
  return fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ replyToken, messages })
  });
}

async function multicastLineMessage(userIds, token, messages) {
  // LINE multicast supports max 500 users per call
  const results = [];
  for (let i = 0; i < userIds.length; i += 500) {
    const batch = userIds.slice(i, i + 500);
    // #R4-Fix-D: retry on 429 / 5xx with exponential backoff (max 2 retries)
    let lastResult = { status: 0 };
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      const resp = await fetch('https://api.line.me/v2/bot/message/multicast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ to: batch, messages })
      });
      lastResult = { status: resp.status };
      if (resp.ok) break;
      try { lastResult.error = await resp.json(); } catch (e) { lastResult.error = await resp.text(); }
      if (resp.status !== 429 && resp.status < 500) break; // don't retry 4xx (except 429)
      console.error(`LINE multicast attempt ${attempt + 1} failed:`, JSON.stringify(lastResult));
    }
    if (!lastResult.error) {
      // success
    } else {
      console.error('LINE multicast final failure:', JSON.stringify(lastResult));
    }
    results.push(lastResult);
  }
  return results;
}

// ── User Sync: LIFF login → upsert user + return server data ──
export async function handleFormosaUserSync(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const data = await request.json();
    const lineUserId = data.line_user_id;
    if (!lineUserId) return jsonResponse({ error: 'line_user_id required' }, 400, request);

    // Upsert user
    await env.AUTH_DB.prepare(`
      INSERT INTO formosa_users (line_user_id, display_name, picture_url, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(line_user_id) DO UPDATE SET
        display_name = excluded.display_name,
        picture_url = excluded.picture_url,
        updated_at = datetime('now')
    `).bind(lineUserId, data.display_name || '', data.picture_url || '').run();

    // Get user's cumulative data from server
    const gpsPoints = await env.AUTH_DB.prepare(
      'SELECT lat, lng, timestamp, source FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC'
    ).bind(lineUserId).all();

    const pts = gpsPoints.results || [];
    const checkinCount = pts.length;
    const totalKm = computeFilteredKm(pts);

    // Check if survey was done
    const survey = await env.AUTH_DB.prepare(
      'SELECT id, carbon_total_kg FROM formosa_surveys WHERE user_id = ? LIMIT 1'
    ).bind(lineUserId).first();

    // Get photo count + privacy + participant status
    const user = await env.AUTH_DB.prepare(
      'SELECT photo_count, phone, privacy_agreed_at, participant_status, completed_at FROM formosa_users WHERE line_user_id = ?'
    ).bind(lineUserId).first();

    return jsonResponse({
      ok: true,
      user_id: lineUserId,
      checkins: checkinCount,
      km: Math.round(totalKm * 100) / 100,
      survey_done: !!survey,
      carbon: survey?.carbon_total_kg || 0,
      photo_count: user?.photo_count || 0,
      privacy_agreed: !!user?.privacy_agreed_at,
      participant_status: user?.participant_status || 'active',
      completed_at: user?.completed_at || null,
      gps_track: pts.map(p => ({ lat: p.lat, lng: p.lng, datetime: p.timestamp, source: p.source }))
    }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Photo Count: increment + get ──
export async function handleFormosaPhotoCount(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    await migrateFormosa(env.AUTH_DB);

    if (request.method === 'POST') {
      const data = await request.json();
      const userId = data.line_user_id;
      const count = data.count || 1;
      if (!userId) return jsonResponse({ error: 'line_user_id required' }, 400, request);

      // Verify caller identity
      const callerId = request.headers.get('X-Line-User-Id');
      if (callerId !== userId) {
        const adminCheck = await requireAdmin(request, env);
        if (adminCheck) return jsonResponse({ error: 'Forbidden' }, 403, request);
      }

      await env.AUTH_DB.prepare(
        `UPDATE formosa_users SET photo_count = photo_count + ?, updated_at = datetime('now') WHERE line_user_id = ?`
      ).bind(count, userId).run();

      const user = await env.AUTH_DB.prepare(
        'SELECT photo_count FROM formosa_users WHERE line_user_id = ?'
      ).bind(userId).first();

      return jsonResponse({ ok: true, photo_count: user?.photo_count || 0 }, 200, request);
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      if (!userId) return jsonResponse({ error: 'userId required' }, 400, request);

      const user = await env.AUTH_DB.prepare(
        'SELECT photo_count FROM formosa_users WHERE line_user_id = ?'
      ).bind(userId).first();

      return jsonResponse({ ok: true, photo_count: user?.photo_count || 0 }, 200, request);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Phone update ──
export async function handleFormosaPhoneUpdate(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const data = await request.json();
    const userId = data.line_user_id;
    const phone = data.phone;
    if (!userId) return jsonResponse({ error: 'line_user_id required' }, 400, request);

    await env.AUTH_DB.prepare(
      `UPDATE formosa_users SET phone = ?, updated_at = datetime('now') WHERE line_user_id = ?`
    ).bind(phone || null, userId).run();

    return jsonResponse({ ok: true }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Privacy Consent ──
export async function handleFormosaPrivacyAgree(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method === 'POST') {
    try {
      await migrateFormosa(env.AUTH_DB);
      const data = await request.json();
      const userId = data.line_user_id;
      if (!userId) return jsonResponse({ error: 'line_user_id required' }, 400, request);

      await env.AUTH_DB.prepare(
        `UPDATE formosa_users SET privacy_agreed_at = datetime('now'), updated_at = datetime('now') WHERE line_user_id = ?`
      ).bind(userId).run();

      return jsonResponse({ ok: true, privacy_agreed_at: new Date().toISOString() }, 200, request);
    } catch (e) {
      console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
    }
  }
  // GET — check consent status
  if (request.method === 'GET') {
    try {
      await migrateFormosa(env.AUTH_DB);
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      if (!userId) return jsonResponse({ error: 'user_id required' }, 400, request);

      const user = await env.AUTH_DB.prepare(
        'SELECT privacy_agreed_at FROM formosa_users WHERE line_user_id = ?'
      ).bind(userId).first();

      return jsonResponse({ agreed: !!user?.privacy_agreed_at, privacy_agreed_at: user?.privacy_agreed_at || null }, 200, request);
    } catch (e) {
      console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
    }
  }
  return jsonResponse({ error: 'Method not allowed' }, 405, request);
}

// ── Participant Status (pause / complete) ──
export async function handleFormosaParticipantStatus(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const data = await request.json();
    const userId = data.line_user_id;
    const status = data.status; // 'active', 'paused', 'completed'
    if (!userId) return jsonResponse({ error: 'line_user_id required' }, 400, request);
    if (!['active', 'paused', 'completed'].includes(status)) {
      return jsonResponse({ error: 'status must be active, paused, or completed' }, 400, request);
    }

    // Check current status — completed is irreversible
    const current = await env.AUTH_DB.prepare(
      'SELECT participant_status FROM formosa_users WHERE line_user_id = ?'
    ).bind(userId).first();
    if (current?.participant_status === 'completed') {
      return jsonResponse({ error: '已完成進香，狀態不可變更', locked: true }, 400, request);
    }

    if (status === 'completed') {
      await env.AUTH_DB.prepare(
        `UPDATE formosa_users SET participant_status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE line_user_id = ?`
      ).bind(userId).run();
    } else {
      await env.AUTH_DB.prepare(
        `UPDATE formosa_users SET participant_status = ?, updated_at = datetime('now') WHERE line_user_id = ?`
      ).bind(status, userId).run();
    }

    return jsonResponse({ ok: true, participant_status: status }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Admin: End Activity (batch complete all participants) ──
export async function handleFormosaAdminEndActivity(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;
  const adminToken = request.headers.get('X-Admin-Token') || 'anonymous';
  if (await checkRateLimitKV(env.TICKER_KV, `admin:${adminToken}`, 60, 30)) {
    return jsonResponse({ error: 'Rate limit exceeded' }, 429, request);
  }
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, request);

  try {
    await migrateFormosa(env.AUTH_DB);
    const result = await env.AUTH_DB.prepare(
      `UPDATE formosa_users SET participant_status = 'completed', completed_at = datetime('now'), updated_at = datetime('now') WHERE participant_status IN ('active', 'paused') OR participant_status IS NULL`
    ).run();

    // Also set activity status to ended
    await env.TICKER_KV.put(FORMOSA_STATUS_KEY, JSON.stringify({ status: 'ended', message: '活動已結束，感謝參與！', updated: new Date().toISOString() }));

    return jsonResponse({ ok: true, updated: result?.meta?.changes || 0 }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── SSBTi / Ecoinvent 3.10 Coefficients ──
const GWP_FACTORS = {
  walk: 0, car: 0.30479, scooter: 0.13734, bike: 0.01220,
  bus: 0.12013, mrt: 0.07575, train: 0.07575, hsr: 0.07487,
  water: 0.10974, recycle: -0.00265, hotel: 8.85
};
const WU_FACTORS = {
  walk: 0, car: 6.94836, scooter: 3.25017, bike: 0.66268,
  bus: 11.16524, mrt: 6.08704, train: 6.08704, hsr: 6.57340,
  water: 15.70476, recycle: -0.13525, hotel: 200
};

// ── Daily Report: Submit / Get ──
export async function handleFormosaDailyReport(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  // GET: fetch user's daily reports
  if (request.method === 'GET') {
    try {
      await migrateFormosa(env.AUTH_DB);
      const url = new URL(request.url);
      const userId = url.searchParams.get('user_id');
      if (!userId) return jsonResponse({ error: 'user_id required' }, 400, request);

      const rows = await env.AUTH_DB.prepare(
        `SELECT * FROM formosa_daily_reports WHERE user_id = ? ORDER BY report_date DESC`
      ).bind(userId).all();

      // Aggregate totals
      let totalGwp = 0, totalWu = 0;
      for (const r of rows.results) { totalGwp += r.carbon_gwp || 0; totalWu += r.carbon_wu || 0; }

      return jsonResponse({ ok: true, reports: rows.results, total_gwp: totalGwp, total_wu: totalWu, count: rows.results.length }, 200, request);
    } catch (e) {
      console.error('handleFormosaDailyReport GET error:', e);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders(request) }
      });
    }
  }

  await migrateFormosa(env.AUTH_DB);

  // POST: submit or update daily report
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const data = await request.json();
    const userId = data.line_user_id;
    if (!userId) return jsonResponse({ error: 'line_user_id required' }, 400, request);

    // Default to today (TW timezone)
    const reportDate = data.report_date || new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);

    const walk = parseFloat(data.walk) || 0;
    const car = parseFloat(data.car) || 0;
    const carpool = Math.max(1, parseInt(data.carpool) || 1);
    const scooter = parseFloat(data.scooter) || 0;
    const bike = parseFloat(data.bike) || 0;
    const bus = parseFloat(data.bus) || 0;
    const mrt = parseFloat(data.mrt) || 0;
    const train = parseFloat(data.train) || 0;
    const hsr = parseFloat(data.hsr) || 0;
    const waterBottles = parseInt(data.water_bottles) || 0;
    const recycleBottles = parseInt(data.recycle_bottles) || 0;
    const hotel = data.hotel ? 1 : 0;

    // Calculate GWP (kgCO₂e)
    const breakdown = {
      walk: walk * GWP_FACTORS.walk,
      car: (car * GWP_FACTORS.car) / carpool,
      scooter: scooter * GWP_FACTORS.scooter,
      bike: bike * GWP_FACTORS.bike,
      bus: bus * GWP_FACTORS.bus,
      mrt: mrt * GWP_FACTORS.mrt,
      train: train * GWP_FACTORS.train,
      hsr: hsr * GWP_FACTORS.hsr,
      water: waterBottles * GWP_FACTORS.water,
      recycle: recycleBottles * GWP_FACTORS.recycle,
      hotel: hotel * GWP_FACTORS.hotel
    };
    const gwp = Object.values(breakdown).reduce((a, b) => a + b, 0);

    // Calculate WU (kg water)
    const wu = walk * WU_FACTORS.walk + (car * WU_FACTORS.car) / carpool +
      scooter * WU_FACTORS.scooter + bike * WU_FACTORS.bike +
      bus * WU_FACTORS.bus + mrt * WU_FACTORS.mrt +
      train * WU_FACTORS.train + hsr * WU_FACTORS.hsr +
      waterBottles * WU_FACTORS.water + recycleBottles * WU_FACTORS.recycle +
      hotel * WU_FACTORS.hotel;

    // Upsert (one report per user per day)
    await env.AUTH_DB.prepare(`
      INSERT INTO formosa_daily_reports (user_id, report_date, transport_walk, transport_car, transport_carpool, transport_scooter, transport_bike, transport_bus, transport_mrt, transport_train, transport_hsr, water_bottles, recycle_bottles, hotel, carbon_gwp, carbon_wu, carbon_breakdown)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, report_date) DO UPDATE SET
        transport_walk=excluded.transport_walk, transport_car=excluded.transport_car, transport_carpool=excluded.transport_carpool,
        transport_scooter=excluded.transport_scooter, transport_bike=excluded.transport_bike, transport_bus=excluded.transport_bus,
        transport_mrt=excluded.transport_mrt, transport_train=excluded.transport_train, transport_hsr=excluded.transport_hsr,
        water_bottles=excluded.water_bottles, recycle_bottles=excluded.recycle_bottles, hotel=excluded.hotel,
        carbon_gwp=excluded.carbon_gwp, carbon_wu=excluded.carbon_wu, carbon_breakdown=excluded.carbon_breakdown
    `).bind(userId, reportDate, walk, car, carpool, scooter, bike, bus, mrt, train, hsr, waterBottles, recycleBottles, hotel, gwp, wu, JSON.stringify(breakdown)).run();

    return jsonResponse({ ok: true, report_date: reportDate, gwp: Math.round(gwp * 1000) / 1000, wu: Math.round(wu * 1000) / 1000, breakdown }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Personalized OG Image: Upload to R2 ──
export async function handleFormosaOgImage(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const userId = request.headers.get('X-User-Id');
    if (!userId) return jsonResponse({ error: 'X-User-Id header required' }, 400, request);

    const blob = await request.arrayBuffer();
    if (!blob || blob.byteLength === 0) return jsonResponse({ error: 'Empty body' }, 400, request);
    if (blob.byteLength > 2 * 1024 * 1024) return jsonResponse({ error: 'Image too large (max 2MB)' }, 413, request);

    const r2Key = `og/${userId}.png`;
    await env.FORMOSA_OG.put(r2Key, blob, {
      httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=3600' },
      customMetadata: { userId, updatedAt: new Date().toISOString() }
    });

    const url = `https://api.paulkuo.tw/api/formosa/og/${encodeURIComponent(userId)}.png`;
    return jsonResponse({ ok: true, url }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Personalized OG Image: Serve from R2 ──
export async function handleFormosaOgServe(request, env, userId) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const r2Key = `og/${userId}.png`;
    const object = await env.FORMOSA_OG.get(r2Key);

    if (!object) {
      // Proxy fallback image directly (302 redirects break Facebook crawler)
      const fallback = await fetch('https://mazu.today/images/formosa-esg-2026-og.png');
      return new Response(fallback.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    // Proxy fallback image directly (302 redirects break Facebook crawler)
    const fallback = await fetch('https://mazu.today/images/formosa-esg-2026-og.png');
    return new Response(fallback.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}

// ── LINE Usage Monitor ──
export async function handleFormosaLineUsage(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;

  try {
    const lineAuth = { 'Authorization': `Bearer ${env.FORMOSA_LINE_TOKEN}` };

    const [quotaRes, consumptionRes] = await Promise.all([
      fetch('https://api.line.me/v2/bot/message/quota', { headers: lineAuth }),
      fetch('https://api.line.me/v2/bot/message/quota/consumption', { headers: lineAuth }),
    ]);

    const quota = await quotaRes.json();
    const consumption = await consumptionRes.json();

    // Followers insight: use yesterday (today's data may not be ready)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10).replace(/-/g, '');
    let followers = null;
    try {
      const followersRes = await fetch(`https://api.line.me/v2/bot/insight/followers?date=${yesterday}`, { headers: lineAuth });
      followers = await followersRes.json();
    } catch (_) { /* optional, ignore failures */ }

    const quotaValue = quota.value || 0;
    const totalUsage = consumption.totalUsage || 0;
    const remaining = Math.max(quotaValue - totalUsage, 0);
    const usagePercent = quotaValue > 0 ? Math.round((totalUsage / quotaValue) * 1000) / 10 : 0;

    return jsonResponse({
      ok: true,
      quota,
      consumption,
      remaining,
      usagePercent,
      followers,
      plan: '中用量 NT$800/月',
      fetchedAt: new Date().toISOString(),
    }, 200, request);
  } catch (e) {
    console.error('LINE usage error:', e);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Feedback Admin GET ──
export async function handleFormosaFeedbackList(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const authErr = await requireAnyRole(request, env);
  if (authErr) return authErr;

  try {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit')) || 50, 1), 200);
    const offset = Math.max(parseInt(url.searchParams.get('offset')) || 0, 0);

    const rows = await env.AUTH_DB.prepare(
      `SELECT id, category, description, screenshot_url, device_info, user_agent, line_user_id, created_at FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return jsonResponse({ ok: true, count: rows.results.length, feedbacks: rows.results }, 200, request);
  } catch (e) {
    console.error('Feedback list error:', e);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Feedback / Bug Report ──
export async function handleFormosaFeedback(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    // Rate limit via KV: 每 IP 每分鐘最多 5 筆
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rateLimited = await checkRateLimitKV(env.TICKER_KV, `feedback:${ip}`, 60, 5);
    if (rateLimited) {
      return jsonResponse({ error: '回報次數過多，請稍後再試', rate_limited: true }, 429, request);
    }

    const body = await request.json();
    const { category, description, screenshot_url, device_info, user_agent, line_user_id } = body;

    if (!category || !description) {
      return jsonResponse({ error: 'category and description are required' }, 400, request);
    }

    if (category.length > 100) {
      return jsonResponse({ error: '類別名稱過長' }, 400, request);
    }
    if (description.length > 2000) {
      return jsonResponse({ error: '描述文字過長，請控制在 2000 字以內' }, 400, request);
    }

    await env.AUTH_DB.prepare(
      `INSERT INTO feedback (category, description, screenshot_url, device_info, user_agent, line_user_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(category, description, screenshot_url || null, device_info || null, user_agent || null, line_user_id || null).run();

    return jsonResponse({ ok: true }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Push Image Upload to R2 ──
export async function handleFormosaUpload(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return jsonResponse({ error: 'Missing file field' }, 400, request);

    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      return jsonResponse({ error: 'Only JPEG or PNG allowed' }, 400, request);
    }

    const buf = await file.arrayBuffer();
    if (buf.byteLength === 0) return jsonResponse({ error: 'Empty file' }, 400, request);
    if (buf.byteLength > 10 * 1024 * 1024) return jsonResponse({ error: 'File too large (max 10MB)' }, 413, request);

    const ext = file.type === 'image/png' ? 'png' : 'jpg';
    const ts = Date.now();
    const rand = crypto.randomUUID().slice(0, 8);
    const r2Key = `push/${ts}-${rand}.${ext}`;

    await env.FORMOSA_OG.put(r2Key, buf, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000' },
    });

    const url = `https://api.paulkuo.tw/api/formosa/push-image/${ts}-${rand}.${ext}`;

    // Try to generate a preview thumbnail via Cloudflare Image Resizing (best-effort)
    let preview_url;
    try {
      const thumbRes = await fetch(url, {
        cf: { image: { width: 480, fit: 'scale-down', format: 'jpeg', quality: 70 } }
      });
      if (thumbRes.ok) {
        const thumbBuf = await thumbRes.arrayBuffer();
        if (thumbBuf.byteLength > 0 && thumbBuf.byteLength < 1024 * 1024) {
          const previewKey = `push/preview/${ts}-${rand}.jpg`;
          await env.FORMOSA_OG.put(previewKey, thumbBuf, {
            httpMetadata: { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' }
          });
          preview_url = `https://api.paulkuo.tw/api/formosa/push-image/preview/${ts}-${rand}.jpg`;
        }
      }
    } catch (e) {
      // Image Resizing not available or failed, skip preview generation
    }

    return jsonResponse({ ok: true, url, ...(preview_url ? { preview_url } : {}) }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Serve Push Image from R2 ──
export async function handleFormosaPushImageServe(request, env, filename) {
  try {
    const r2Key = `push/${filename}`;
    const object = await env.FORMOSA_OG.get(r2Key);
    if (!object) return new Response('Not found', { status: 404 });
    const ct = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    return new Response(object.body, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// ── Feedback Screenshot Upload to R2 ──
export async function handleFormosaFeedbackUpload(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const blob = await request.arrayBuffer();
    if (!blob || blob.byteLength === 0) return jsonResponse({ error: 'Empty body' }, 400, request);
    if (blob.byteLength > 5 * 1024 * 1024) return jsonResponse({ error: 'Image too large (max 5MB)' }, 413, request);

    const ts = Date.now();
    const rand = crypto.randomUUID().slice(0, 8);
    const r2Key = `feedback/${ts}-${rand}.png`;

    await env.FORMOSA_OG.put(r2Key, blob, {
      httpMetadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
    });

    const url = `https://api.paulkuo.tw/api/formosa/feedback-image/${ts}-${rand}.png`;
    return jsonResponse({ ok: true, url }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Serve Feedback Screenshot from R2 ──
export async function handleFormosaFeedbackImageServe(request, env, filename) {
  try {
    const r2Key = `feedback/${filename}`;
    const object = await env.FORMOSA_OG.get(r2Key);
    if (!object) return new Response('Not found', { status: 404 });
    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}

// ── Admin: Update Feedback Status ──
export async function handleFormosaFeedbackUpdate(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  const authErr = await requireAdmin(request, env);
  if (authErr) return authErr;

  try {
    const url = new URL(request.url);
    const id = parseInt(url.pathname.split('/').pop());
    if (!id || isNaN(id)) return jsonResponse({ error: 'Invalid feedback ID' }, 400, request);

    const body = await request.json();
    const { status, admin_note } = body;

    const validStatuses = ['new', 'triaging', 'fixing', 'fixed', 'wontfix'];
    if (status && !validStatuses.includes(status)) {
      return jsonResponse({ error: 'Invalid status. Must be: ' + validStatuses.join(', ') }, 400, request);
    }

    // Build dynamic UPDATE
    const sets = [];
    const binds = [];
    if (status) {
      sets.push('status = ?');
      binds.push(status);
      if (status === 'fixed') {
        sets.push("resolved_at = datetime('now')");
      }
    }
    if (admin_note !== undefined) {
      sets.push('admin_note = ?');
      binds.push(admin_note);
    }
    if (sets.length === 0) return jsonResponse({ error: 'Nothing to update' }, 400, request);

    binds.push(id);
    await env.AUTH_DB.prepare(
      `UPDATE feedback SET ${sets.join(', ')} WHERE id = ?`
    ).bind(...binds).run();

    const row = await env.AUTH_DB.prepare(
      'SELECT id, category, description, screenshot_url, status, admin_note, resolved_at, created_at FROM feedback WHERE id = ?'
    ).bind(id).first();

    if (!row) return jsonResponse({ error: 'Feedback not found' }, 404, request);
    return jsonResponse({ ok: true, feedback: row }, 200, request);
  } catch (e) {
    console.error('Feedback update error:', e);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Public: Feedback Status Board ──
export async function handleFormosaFeedbackPublicStatus(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const rows = await env.AUTH_DB.prepare(
      `SELECT id, category, description, screenshot_url, status, admin_note, resolved_at, created_at
       FROM feedback
       WHERE category != 'test' AND category NOT LIKE '[DRY-RUN]%'
       ORDER BY created_at DESC`
    ).all();

    return jsonResponse({ ok: true, feedbacks: rows.results || [] }, 200, request);
  } catch (e) {
    console.error('Feedback public status error:', e);
    return jsonResponse({ error: 'Internal server error' }, 500, request);
  }
}

// ── Cron: Health Alert with Exponential Backoff ──
const BACKOFF_DELAYS = [0, 10*60, 30*60, 60*60, 2*60*60, 4*60*60]; // seconds

export async function handleFormosaHealthAlert(env) {
  if (!env.FORMOSA_ALERT_USER_ID || !env.FORMOSA_LINE_TOKEN) {
    return { checked: false, healthy: null, alerted: false, reason: 'missing config' };
  }

  // Check D1
  let d1Ok = false;
  try {
    const r = await env.AUTH_DB.prepare('SELECT 1 AS ok').first();
    d1Ok = r?.ok === 1;
  } catch (_) {}

  // Check KV
  let kvOk = false;
  try {
    await env.TICKER_KV.list({ prefix: 'gps:', limit: 1 });
    kvOk = true;
  } catch (_) {}

  const healthy = d1Ok && kvOk;

  // Read backoff state
  const raw = await env.TICKER_KV.get('formosa:health_alert_backoff');
  const state = raw ? JSON.parse(raw) : { level: 0, lastAlertAt: 0, wasUnhealthy: false };

  if (healthy) {
    if (state.wasUnhealthy) {
      // Send recovery notification
      await sendLineMessage(env.FORMOSA_ALERT_USER_ID, env.FORMOSA_LINE_TOKEN, [
        { type: 'text', text: '✅ Formosa ESG 系統已恢復正常\n\nD1: ok\nKV: ok' }
      ]);
      await env.TICKER_KV.put('formosa:health_alert_backoff', JSON.stringify({ level: 0, lastAlertAt: 0, wasUnhealthy: false }));
      return { checked: true, healthy: true, alerted: true };
    }
    return { checked: true, healthy: true, alerted: false };
  }

  // Unhealthy — check backoff
  const now = Date.now() / 1000;
  const delay = BACKOFF_DELAYS[Math.min(state.level, BACKOFF_DELAYS.length - 1)];
  const elapsed = now - (state.lastAlertAt || 0);

  if (state.wasUnhealthy && elapsed < delay) {
    return { checked: true, healthy: false, alerted: false };
  }

  // Send alert
  const issues = [];
  if (!d1Ok) issues.push('D1: error');
  if (!kvOk) issues.push('KV: error');

  await sendLineMessage(env.FORMOSA_ALERT_USER_ID, env.FORMOSA_LINE_TOKEN, [
    { type: 'text', text: `🚨 Formosa ESG 系統異常\n\n${issues.join('\n')}\n\n退避等級: ${state.level}` }
  ]);

  const nextLevel = Math.min((state.wasUnhealthy ? state.level : 0) + 1, BACKOFF_DELAYS.length - 1);
  await env.TICKER_KV.put('formosa:health_alert_backoff', JSON.stringify({ level: nextLevel, lastAlertAt: now, wasUnhealthy: true }));

  return { checked: true, healthy: false, alerted: true };
}

