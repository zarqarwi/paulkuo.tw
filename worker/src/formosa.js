/**
 * Formosa ESG 2026 — LINE Webhook + Survey/GPS API + Push Notifications
 * 白沙屯媽祖繞境數據系統
 */
import { corsHeaders, jsonResponse } from './utils.js';

// ── Activity Status Helper ──
const FORMOSA_STATUS_KEY = 'formosa_status';
async function getFormosaStatus(kv) {
  const raw = await kv.get(FORMOSA_STATUS_KEY);
  if (!raw) return { status: 'active', message: '' };
  try { return JSON.parse(raw); } catch { return { status: 'active', message: '' }; }
}

// ── Admin Auth Helper ──
function requireAdmin(request, env) {
  // Only accept header-based auth (query params leak in logs/referrer/history)
  const auth = request.headers.get('X-Admin-Token');
  if (!auth || auth !== env.FORMOSA_ADMIN_TOKEN) {
    return jsonResponse({ error: 'Unauthorized' }, 401, request);
  }
  return null; // authorized
}

// ── Admin: Get/Set Activity Status ──
export async function handleFormosaAdminStatus(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });

  if (request.method === 'GET') {
    const data = await getFormosaStatus(env.TICKER_KV);
    return jsonResponse(data, 200, request);
  }

  // POST — set status (requires admin)
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
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
  `ALTER TABLE formosa_users ADD COLUMN completed_at TEXT DEFAULT NULL`
];

// ── Run migration ──
export async function migrateFormosa(db) {
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  for (const sql of statements) {
    try { await db.prepare(sql).run(); } catch (e) { /* table exists */ }
  }
  // Add new columns to existing tables (idempotent)
  for (const sql of COLUMN_MIGRATIONS) {
    try { await db.prepare(sql).run(); } catch (e) { /* column already exists */ }
  }
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
      const userId = event.source?.userId;

      // Upsert user for any event type
      if (userId) {
        const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
        await env.AUTH_DB.prepare(
          `INSERT INTO formosa_users (line_user_id, display_name, picture_url, updated_at) VALUES (?, ?, ?, datetime('now')) ON CONFLICT(line_user_id) DO UPDATE SET display_name=excluded.display_name, picture_url=excluded.picture_url, updated_at=datetime('now')`
        ).bind(userId, profile?.displayName || '', profile?.pictureUrl || '').run();
      }

      // ── Follow: Welcome Flex Message ──
      if (event.type === 'follow' && userId) {
        await sendLineMessage(userId, env.FORMOSA_LINE_TOKEN, [buildWelcomeMessage()]);
      }

      // ── Message: Keyword Router ──
      if (event.type === 'message' && event.message?.type === 'text') {
        const text = (event.message.text || '').trim();
        const replyToken = event.replyToken;
        if (!replyToken) continue;

        const reply = await routeKeyword(text, userId, env);
        await replyLineMessage(replyToken, env.FORMOSA_LINE_TOKEN, reply);
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

    // Save survey
    if (data.survey) {
      const s = data.survey;
      const p = data.profile || {};
      const t = p.transport || {};
      await env.AUTH_DB.prepare(`
        INSERT INTO formosa_surveys
        (user_id, q1_good_deeds, q2_moved_by, q2_1_story, q3_善行value, q4_continue, q5_future_actions, q6_csr,
         role_type, transport_walk, transport_car, transport_carpool, transport_scooter, transport_bus,
         transport_mrt, transport_train, transport_hsr, water_bottles, hotel_nights, carbon_total_kg, carbon_breakdown)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        JSON.stringify(s.q1 || []),
        JSON.stringify(s.q2 || []),
        s.q2_1 || '',
        s.q3 || '',
        s.q4 || '',
        JSON.stringify(s.q5 || []),
        s.q6 || '',
        p.role || 'participant',
        t.walk_km || 0,
        t.car_km || 0,
        t.carpool_count || 1,
        t.scooter_km || 0,
        t.bus_km || 0,
        t.mrt_km || 0,
        t.train_km || 0,
        t.hsr_km || 0,
        p.water_bottles || 0,
        p.hotel_nights || 0,
        data.carbon?.total_kg || 0,
        JSON.stringify(data.carbon?.breakdown || {})
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
export async function handleFormosaCheckin(request, env) {
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

    const lat = data.lat;
    const lng = data.lng;
    if (!validateGPS(lat, lng)) {
      return jsonResponse({ error: 'Invalid GPS coordinates' }, 400, request);
    }

    // Geofence: 白沙屯↔北港路線範圍（含緩衝）
    const inRange = lat >= 23.4 && lat <= 24.9 && lng >= 120.1 && lng <= 121.0;
    const source = inRange ? (data.source || 'checkin') : 'remote';

    const ts = data.timestamp || new Date().toISOString();
    const bufferKey = `gps:${ts}:${userId}:${crypto.randomUUID().slice(0, 8)}`;

    // Write to KV buffer (single atomic write, no lock contention)
    await env.TICKER_KV.put(bufferKey, JSON.stringify({
      user_id: userId, lat, lng,
      altitude: data.altitude || null,
      accuracy: data.accuracy || null,
      source, timestamp: ts,
      blessing_id: data.blessing_id || null
    }), { expirationTtl: 86400 });

    // Approximate point count from KV (updated by cron flush)
    const countKey = `gps_count:${userId}`;
    const cachedCount = await env.TICKER_KV.get(countKey);
    const approxCount = cachedCount ? parseInt(cachedCount, 10) + 1 : 1;
    await env.TICKER_KV.put(countKey, String(approxCount), { expirationTtl: 86400 * 30 });

    return jsonResponse({ ok: true, total_points: approxCount, in_range: inRange, buffered: true }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
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
          // Delete flushed keys
          await Promise.all(valid.map(e => env.TICKER_KV.delete(e.key).catch(() => {})));
        } catch (e) {
          console.error('Flush batch error:', e.message);
          errors += valid.length;
          // D1 write failed — extend KV TTL to prevent data loss
          await Promise.all(valid.map(async (entry) => {
            try {
              await env.TICKER_KV.put(entry.key, JSON.stringify(entry.data), { expirationTtl: 86400 });
            } catch {}
          }));
          continue;
        }
      }

      // Clean up invalid keys
      if (invalid.length > 0) {
        await Promise.all(invalid.map(e => env.TICKER_KV.delete(e.key).catch(() => {})));
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

    return { flushed, skipped, errors, total_buffered: allKeys.length, duration_ms: Date.now() - startTime };
  } catch (e) {
    console.error('Flush fatal:', e.message);
    return { flushed, skipped, errors: errors + 1, error: e.message, duration_ms: Date.now() - startTime };
  } finally {
    // 只有自己持有的鎖才刪（避免刪到下一輪的鎖）
    const currentLock = await kv.get(lockKey);
    if (currentLock === lockId) {
      await kv.delete(lockKey);
    }
  }
}

// ── Admin: Role Management ──
export async function handleFormosaAdminRoles(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;

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
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const targetRole = body.role || 'all'; // all | participant | volunteer | admin
    const customText = body.text || '媽祖保佑 🙏\n記錄您的進香足跡吧！';
    const customTitle = body.title || '📍 進香打卡提醒';

    // Get users filtered by role (exclude paused/completed from push)
    let query = "SELECT line_user_id FROM formosa_users WHERE line_user_id IS NOT NULL AND (participant_status IS NULL OR participant_status = 'active')";
    if (targetRole !== 'all') {
      query += ` AND role = '${targetRole}'`;
    }
    const users = await env.AUTH_DB.prepare(query).all();

    if (!users.results?.length) {
      return jsonResponse({ ok: true, sent: 0, message: 'No users to notify' }, 200, request);
    }

    const userIds = users.results.map(u => u.line_user_id);

    const message = {
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
            uri: 'https://paulkuo.tw/projects/formosa-esg-2026/tracker/'
          }
        ]
      }
    };

    const lineResults = await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [message]);

    return jsonResponse({ ok: true, sent: userIds.length, role: targetRole, line_results: lineResults }, 200, request);
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

  const pushHours = [6, 9, 12, 15, 18];
  if (!pushHours.includes(hour)) return { skipped: true, reason: 'not a push hour, current: ' + hour };

  // Check activity status
  const status = await getFormosaStatus(env.TICKER_KV);
  if (status.status !== 'active') return { skipped: true, reason: 'activity ' + status.status };

  // Pick message based on hour
  const msgIdx = Math.min(pushHours.indexOf(hour), PUSH_MESSAGES.length - 1);
  const msg = PUSH_MESSAGES[msgIdx];

  const users = await env.AUTH_DB.prepare("SELECT line_user_id FROM formosa_users WHERE line_user_id IS NOT NULL AND (participant_status IS NULL OR participant_status = 'active')").all();
  if (!users.results?.length) return { skipped: true, reason: 'no users' };

  const userIds = users.results.map(u => u.line_user_id);
  const message = {
    type: 'template',
    altText: msg.title,
    template: {
      type: 'buttons',
      title: msg.title,
      text: msg.text,
      actions: [{ type: 'uri', label: '立即打卡 📍', uri: 'https://paulkuo.tw/projects/formosa-esg-2026/tracker/' }]
    }
  };

  await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [message]);
  return { sent: userIds.length, message: msg.title };
}

// ── Data Dashboard API (admin only) ──
export async function handleFormosaData(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const authErr = requireAdmin(request, env);
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

const SPEED_THRESHOLDS = [
  { maxSpeed: 15,       mode: 'zero_emission', gwp: 0 },          // ≤ 15 km/h → 步行/腳踏車，零排放
  { maxSpeed: Infinity, mode: 'motorized',     gwp: 0.47515 }     // > 15 km/h → 統一用巴士係數
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
    const isAdmin = !requireAdmin(request, env);
    await migrateFormosa(env.AUTH_DB);
    const user = await env.AUTH_DB.prepare('SELECT display_name, picture_url, role, created_at FROM formosa_users WHERE line_user_id = ?').bind(userId).first();
    const points = await env.AUTH_DB.prepare('SELECT lat, lng, altitude, accuracy, source, timestamp FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC').bind(userId).all();
    const survey = await env.AUTH_DB.prepare('SELECT * FROM formosa_surveys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(userId).first();

    // Aggregate carbon from daily reports (primary source)
    const dailyAgg = await env.AUTH_DB.prepare(
      `SELECT COALESCE(SUM(carbon_gwp), 0) as total_gwp, COALESCE(SUM(carbon_wu), 0) as total_wu, COUNT(*) as report_days FROM formosa_daily_reports WHERE user_id = ?`
    ).bind(userId).first();

    const pts = points?.results || [];
    let totalKm = 0;
    let totalCarbon = 0;
    const transportBreakdown = { zero_emission: 0, motorized: 0 };

    for (let i = 1; i < pts.length; i++) {
      const dist = haversine(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
      const timeDiffHours = (new Date(pts[i].timestamp) - new Date(pts[i-1].timestamp)) / 3600000;

      // Filter noise: skip tiny distances, zero/negative time gaps, GPS drift
      if (dist < 0.01 || timeDiffHours <= 0 || timeDiffHours < 1/120) continue; // <10m, or <30s

      const speed = dist / timeDiffHours;
      if (speed > 300) continue; // GPS drift anomaly

      const transport = inferTransportMode(speed);
      totalKm += dist;
      totalCarbon += dist * transport.gwp;
      transportBreakdown[transport.mode] += dist;
    }

    const checkins = pts.filter(p => p.source === 'manual').length || Math.max(pts.length, 1);
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
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
  try {
    await migrateFormosa(env.AUTH_DB);
    const rows = await env.AUTH_DB.prepare('SELECT q1_good_deeds, q2_moved_by, q3_善行value, q4_continue, q5_future_actions, q6_csr, role_type FROM formosa_surveys').all();
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
      q3_value: aggregate('q3_善行value', false),
      q4_continue: aggregate('q4_continue', false),
      q5_actions: aggregate('q5_future_actions', true),
      q6_csr: aggregate('q6_csr', false),
      role_distribution: aggregate('role_type', false)
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Carbon Analytics ──
export async function handleFormosaAdminCarbon(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
  try {
    await migrateFormosa(env.AUTH_DB);
    const rows = await env.AUTH_DB.prepare('SELECT transport_walk, transport_car, transport_carpool, transport_scooter, transport_bus, transport_mrt, transport_train, transport_hsr, water_bottles, hotel_nights, carbon_total_kg FROM formosa_surveys').all();
    const data = rows?.results || [];

    const modes = ['walk','car','scooter','bus','mrt','train','hsr'];
    const factors = { walk: GWP_FACTORS.walk, car: GWP_FACTORS.car, scooter: GWP_FACTORS.scooter, bus: GWP_FACTORS.bus, mrt: GWP_FACTORS.mrt, train: GWP_FACTORS.train, hsr: GWP_FACTORS.hsr };
    const totals = {};
    modes.forEach(m => { totals[m] = { km: 0, users: 0 }; });
    let waterTotal = 0, hotelTotal = 0, carbonTotal = 0;

    data.forEach(r => {
      modes.forEach(m => {
        const km = r['transport_' + m] || 0;
        if (km > 0) { totals[m].km += km; totals[m].users++; }
      });
      waterTotal += r.water_bottles || 0;
      hotelTotal += r.hotel_nights || 0;
      carbonTotal += r.carbon_total_kg || 0;
    });

    // Calculate carbon saved: if all walk km were driven by car (Ecoinvent 3.10)
    const walkKm = totals.walk.km;
    const hypothetical = walkKm * GWP_FACTORS.car;
    const carbonSaved = Math.max(0, hypothetical);

    return jsonResponse({
      total_carbon_kg: +carbonTotal.toFixed(2),
      avg_carbon_kg: data.length ? +(carbonTotal / data.length).toFixed(2) : 0,
      total_surveys: data.length,
      transport_totals: totals,
      carbon_saved_kg: +carbonSaved.toFixed(2),
      hypothetical_driving_kg: +hypothetical.toFixed(2),
      water_bottles_total: waterTotal,
      hotel_nights_total: hotelTotal
    }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Activity Timeline ──
export async function handleFormosaAdminTimeline(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
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
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
  try {
    await migrateFormosa(env.AUTH_DB);
    const gpsUsers = await env.AUTH_DB.prepare(`
      SELECT g.user_id, u.display_name, u.picture_url, u.role,
        COUNT(g.id) as gps_count,
        MAX(g.created_at) as last_active,
        MIN(g.created_at) as first_active
      FROM formosa_gps_points g
      LEFT JOIN formosa_users u ON g.user_id = u.line_user_id
      GROUP BY g.user_id
      ORDER BY last_active DESC
    `).all();

    const surveys = await env.AUTH_DB.prepare('SELECT user_id, carbon_total_kg, transport_walk FROM formosa_surveys').all();
    const surveyMap = {};
    (surveys?.results || []).forEach(s => { surveyMap[s.user_id] = s; });

    const users = (gpsUsers?.results || []).map(u => {
      const s = surveyMap[u.user_id];
      return {
        user_id: u.user_id,
        display_name: u.display_name || u.user_id.substring(0, 8),
        picture_url: u.picture_url || null,
        role: u.role || 'participant',
        gps_count: u.gps_count,
        survey_done: !!s,
        carbon_kg: +(s?.carbon_total_kg || 0).toFixed(2),
        walk_km: +(s?.transport_walk || 0).toFixed(1),
        last_active: u.last_active,
        first_active: u.first_active
      };
    });

    return jsonResponse({ users }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Admin: Server-side GPS Grid Clustering ──
export async function handleFormosaAdminClusters(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
  try {
    await migrateFormosa(env.AUTH_DB);
    const points = await env.AUTH_DB.prepare(
      'SELECT lat, lng, user_id, created_at FROM formosa_gps_points ORDER BY created_at ASC'
    ).all();
    const rows = points?.results || [];
    if (rows.length === 0) return jsonResponse({ clusters: [], front: null, tail: null, spread_km: 0, lost: 0 }, 200, request);

    // Grid clustering (~2km cells)
    const cellSize = 0.018; // ~2km
    const grid = {};
    let latestByUser = {};
    rows.forEach(p => {
      const key = Math.floor(p.lat / cellSize) + ',' + Math.floor(p.lng / cellSize);
      if (!grid[key]) grid[key] = { lat: 0, lng: 0, count: 0, users: new Set() };
      grid[key].lat += p.lat;
      grid[key].lng += p.lng;
      grid[key].count++;
      grid[key].users.add(p.user_id);
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
    latestPoints.sort((a, b) => a.lat - b.lat); // rough south→north
    const front = latestPoints.length > 0 ? latestPoints[latestPoints.length - 1] : null;
    const tail = latestPoints.length > 0 ? latestPoints[0] : null;

    // Spread distance (km)
    let spread_km = 0;
    if (front && tail) {
      const R = 6371;
      const dLat = (front.lat - tail.lat) * Math.PI / 180;
      const dLng = (front.lng - tail.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(tail.lat*Math.PI/180) * Math.cos(front.lat*Math.PI/180) * Math.sin(dLng/2)**2;
      spread_km = +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
    }

    // Lost: users with no GPS in last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2*60*60*1000).toISOString();
    const lost = latestPoints.filter(p => p.created_at < twoHoursAgo).length;

    return jsonResponse({ clusters, front, tail, spread_km, lost }, 200, request);
  } catch (e) { console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request); }
}

// ── Keyword Router ──
const TRACKER_URL = 'https://paulkuo.tw/projects/formosa-esg-2026/tracker/';
const PROJECT_URL = 'https://paulkuo.tw/projects/formosa-esg-2026/';
const GUIDE_URL = 'https://paulkuo.tw/projects/formosa-esg-2026/guide/';

async function routeKeyword(text, userId, env) {
  const t = text.toLowerCase();

  // 打卡
  if (/打卡|checkin|check.?in|記錄/.test(t)) {
    return [{ type: 'text', text: `📍 立即打卡記錄足跡：\n${TRACKER_URL}` }];
  }

  // 說明 / 使用 / 幫助
  if (/說明|使用|幫助|help|怎麼用|功能/.test(t)) {
    return [buildUsageMessage()];
  }

  // 回報 / 問題 / bug
  if (/回報|問題|bug|反饋|建議/.test(t)) {
    return [{ type: 'text', text: '📝 回報問題請到這裡：\nhttps://paulkuo.tw/projects/formosa-esg-2026/feedback/\n\n也可以直接在這裡打字描述，我們會看到！' }];
  }

  // 等級 / 紀錄 / 我的 / 排行
  if (/等級|紀錄|我的|成就|level|stats|排行/.test(t)) {
    return [await buildStatsMessage(userId, env)];
  }

  // 分享
  if (/分享|share|推薦/.test(t)) {
    return [{ type: 'text', text: `📤 分享你的進香足跡給朋友：\n${TRACKER_URL}\n\n打開後點「📸 分享我的進香足跡」按鈕，就能分享到 LINE、Facebook 等平台！` }];
  }

  // 碳足跡 / 碳排
  if (/碳|carbon|co2|排放/.test(t)) {
    return [buildCarbonInfoMessage()];
  }

  // 關於 / 專案 / ESG
  if (/關於|專案|esg|永續|什麼/.test(t)) {
    return [{ type: 'text', text: `🌱 2026 白沙屯媽祖 ESG 永續進香\n\n台灣首份進香永續數據計畫，記錄參與者的足跡、碳足跡與善行故事。\n\n📖 了解更多：\n${PROJECT_URL}` }];
  }

  // Default: 功能選單
  return [buildMenuMessage()];
}

// ── Welcome Flex Message (follow event) ──
function buildWelcomeMessage() {
  return {
    type: 'flex',
    altText: '🙏 歡迎加入白沙屯媽祖 ESG 永續進香！',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical',
        backgroundColor: '#1a5c2a',
        paddingAll: '20px',
        contents: [
          { type: 'text', text: '🙏 白沙屯媽祖', color: '#ffffff', size: 'xl', weight: 'bold' },
          { type: 'text', text: 'ESG 永續進香 2026', color: '#b8e6c8', size: 'sm', margin: 'sm' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'md', paddingAll: '20px',
        contents: [
          { type: 'text', text: '感謝加入！', weight: 'bold', size: 'lg' },
          { type: 'text', text: '這是台灣首份進香永續數據計畫。\n進香期間，您可以：', wrap: true, size: 'sm', color: '#666666', margin: 'md' },
          { type: 'box', layout: 'vertical', margin: 'lg', spacing: 'sm', contents: [
            { type: 'text', text: '📍 GPS 打卡記錄足跡', size: 'sm' },
            { type: 'text', text: '📷 上傳照片定位路徑', size: 'sm' },
            { type: 'text', text: '🌱 計算個人碳足跡', size: 'sm' },
            { type: 'text', text: '📊 解鎖 9 級香客等級', size: 'sm' }
          ]},
          { type: 'separator', margin: 'lg' },
          { type: 'text', text: '輸入關鍵字快速操作：', size: 'xs', color: '#999999', margin: 'lg' },
          { type: 'text', text: '「打卡」「說明」「等級」「碳足跡」「分享」「回報」', size: 'xs', color: '#999999', margin: 'xs' }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '15px',
        contents: [
          { type: 'button', style: 'primary', color: '#1a5c2a', action: { type: 'uri', label: '📍 開始打卡', uri: TRACKER_URL } },
          { type: 'button', style: 'link', action: { type: 'uri', label: '📖 使用說明', uri: GUIDE_URL } }
        ]
      }
    }
  };
}

// ── Usage Instructions ──
function buildUsageMessage() {
  return {
    type: 'flex',
    altText: '📖 使用說明',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box', layout: 'vertical', backgroundColor: '#1a5c2a', paddingAll: '15px',
        contents: [
          { type: 'text', text: '📖 使用說明', color: '#ffffff', size: 'lg', weight: 'bold' }
        ]
      },
      body: {
        type: 'box', layout: 'vertical', spacing: 'lg', paddingAll: '20px',
        contents: [
          { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            { type: 'text', text: '① 打卡記錄', weight: 'bold', size: 'sm' },
            { type: 'text', text: '點「立即打卡」按鈕，系統自動記錄您的 GPS 位置。建議每到一個新地點就打卡一次。', wrap: true, size: 'xs', color: '#666666' }
          ]},
          { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            { type: 'text', text: '② 照片上傳', weight: 'bold', size: 'sm' },
            { type: 'text', text: '上傳進香途中照片，系統會讀取照片中的 GPS 定位。照片不會上傳到伺服器，僅讀取 GPS 資訊作為路徑紀錄。', wrap: true, size: 'xs', color: '#666666' }
          ]},
          { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            { type: 'text', text: '③ 問卷填寫', weight: 'bold', size: 'sm' },
            { type: 'text', text: '填寫善行紀錄、交通方式等問卷，系統自動計算您的碳足跡。問卷只需填一次。', wrap: true, size: 'xs', color: '#666666' }
          ]},
          { type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            { type: 'text', text: '④ 等級成就', weight: 'bold', size: 'sm' },
            { type: 'text', text: '打卡越多、走越遠，等級越高！共 9 級，從煉氣香客到飛升香客。', wrap: true, size: 'xs', color: '#666666' }
          ]},
          { type: 'separator' },
          { type: 'text', text: '💡 輸入關鍵字快速操作', weight: 'bold', size: 'xs', margin: 'md' },
          { type: 'text', text: '「打卡」→ 記錄足跡\n「等級」→ 我的紀錄\n「碳足跡」→ 碳排資訊\n「關於」→ 專案介紹', wrap: true, size: 'xs', color: '#888888', margin: 'sm' }
        ]
      },
      footer: {
        type: 'box', layout: 'vertical', spacing: 'sm', paddingAll: '15px',
        contents: [
          { type: 'button', style: 'primary', color: '#1a5c2a', action: { type: 'uri', label: '📍 開始打卡', uri: TRACKER_URL } },
          { type: 'button', style: 'link', action: { type: 'uri', label: '📖 查看完整使用說明', uri: GUIDE_URL } }
        ]
      }
    }
  };
}

// ── Stats Message (from DB) ──
async function buildStatsMessage(userId, env) {
  if (!userId) return { type: 'text', text: '請先透過 LINE 登入 tracker 建立帳號。' };

  try {
    const gpsPoints = await env.AUTH_DB.prepare(
      'SELECT COUNT(*) as cnt FROM formosa_gps_points WHERE user_id = ?'
    ).bind(userId).first();

    const survey = await env.AUTH_DB.prepare(
      'SELECT carbon_total_kg FROM formosa_surveys WHERE user_id = ? LIMIT 1'
    ).bind(userId).first();

    const user = await env.AUTH_DB.prepare(
      'SELECT photo_count FROM formosa_users WHERE line_user_id = ?'
    ).bind(userId).first();

    const checkins = gpsPoints?.cnt || 0;
    const carbon = survey?.carbon_total_kg || 0;
    const photos = user?.photo_count || 0;

    // Calculate level
    const TITLES = [
      { km: 0, checkins: 1, name: '煉氣香客', icon: '🔥' },
      { km: 15, checkins: 5, name: '築基香客', icon: '🧱' },
      { km: 45, checkins: 10, name: '金丹香客', icon: '💛' },
      { km: 90, checkins: 15, name: '元嬰香客', icon: '👶' },
      { km: 135, checkins: 20, name: '化神香客', icon: '✨' },
      { km: 180, checkins: 25, name: '煉虛香客', icon: '🌀' },
      { km: 225, checkins: 30, name: '合體香客', icon: '🤝' },
      { km: 270, checkins: 35, name: '大乘香客', icon: '🏆' },
      { km: 300, checkins: 40, name: '飛升香客', icon: '🚀' }
    ];
    let title = TITLES[0];
    for (let i = TITLES.length - 1; i >= 0; i--) {
      if (checkins >= TITLES[i].checkins) { title = TITLES[i]; break; }
    }

    const lines = [
      `${title.icon} ${title.name}`,
      '',
      `📍 打卡次數：${checkins}`,
      `📷 上傳照片：${photos} 張`,
      `🌱 碳足跡：${carbon.toFixed(2)} kg CO₂e`,
      survey ? '📋 問卷：已完成' : '📋 問卷：尚未填寫'
    ];

    return { type: 'text', text: lines.join('\n') };
  } catch (e) {
    return { type: 'text', text: '暫時無法讀取資料，請稍後再試。' };
  }
}

// ── Carbon Info ──
function buildCarbonInfoMessage() {
  return {
    type: 'text',
    text: '🌱 碳足跡小知識\n\n進香途中我們用兩種方式估算你的碳足跡：\n🚶 步行/腳踏車 → 零排放 ✨\n🚌 搭乘交通工具 → 約 0.48 kg CO₂e/km\n\n走越多、搭越少，碳足跡越低！\n🌿 鼓勵大家多走路、多共乘，一起愛護地球 🌍\n\n📝 此為簡化估算，目的是提醒減排意識\n\n📍 前往記錄：\n' + TRACKER_URL
  };
}

// ── Default Menu ──
function buildMenuMessage() {
  return {
    type: 'text',
    text: '🙏 媽祖 Bot 為您服務\n\n輸入以下關鍵字：\n📍「打卡」→ 記錄足跡\n📖「說明」→ 使用指南\n📊「等級」→ 我的紀錄\n🌱「碳足跡」→ 碳排資訊\n💡「關於」→ 專案介紹\n\n💡 輸入「說明」查看使用指南'
  };
}

// ── Rich Menu Setup ──
export async function handleFormosaRichMenu(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  const authErr = requireAdmin(request, env);
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
const RICH_MENU_IMAGE_URL = 'https://paulkuo.tw/images/formosa/rich-menu-v2.png';

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
  } catch (e) {}
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
    const resp = await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to: batch, messages })
    });
    const result = { status: resp.status };
    if (!resp.ok) {
      try { result.error = await resp.json(); } catch (e) { result.error = await resp.text(); }
      console.error('LINE multicast error:', JSON.stringify(result));
    }
    results.push(result);
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
      'SELECT lat, lng, timestamp as datetime, source FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC'
    ).bind(lineUserId).all();

    const checkinCount = gpsPoints.results?.length || 0;

    // Calculate total km from GPS points
    let totalKm = 0;
    const pts = gpsPoints.results || [];
    for (let i = 1; i < pts.length; i++) {
      totalKm += haversineKm(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
    }

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
      gps_track: pts.map(p => ({ lat: p.lat, lng: p.lng, datetime: p.datetime, source: p.source }))
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
        const adminCheck = requireAdmin(request, env);
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
  const authErr = requireAdmin(request, env);
  if (authErr) return authErr;
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
  bus: 0.47515, mrt: 0.07575, train: 0.07575, hsr: 0.07487,
  water: 0.10974, recycle: -0.00265, hotel: 12.5
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

  await migrateFormosa(env.AUTH_DB);

  // GET: fetch user's daily reports
  if (request.method === 'GET') {
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
  }

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
      const fallback = await fetch('https://paulkuo.tw/images/formosa-esg-2026-og.png');
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
    const fallback = await fetch('https://paulkuo.tw/images/formosa-esg-2026-og.png');
    return new Response(fallback.body, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    });
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
    const body = await request.json();
    const { category, description, screenshot_url, device_info, user_agent, line_user_id } = body;

    if (!category || !description) {
      return jsonResponse({ error: 'category and description are required' }, 400, request);
    }

    await env.DB.prepare(
      `INSERT INTO feedback (category, description, screenshot_url, device_info, user_agent, line_user_id) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(category, description, screenshot_url || null, device_info || null, user_agent || null, line_user_id || null).run();

    return jsonResponse({ ok: true }, 200, request);
  } catch (e) {
    console.error('API error:', e); return jsonResponse({ error: 'Internal server error' }, 500, request);
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

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
