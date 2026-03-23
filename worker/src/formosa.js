/**
 * Formosa ESG 2026 — LINE Webhook + Survey/GPS API + Push Notifications
 * 白沙屯媽祖繞境數據系統
 */
import { corsHeaders, jsonResponse } from './utils.js';

// ── D1 Schema Migration ──
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS formosa_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_user_id TEXT UNIQUE,
  display_name TEXT,
  picture_url TEXT,
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

// ── Run migration ──
export async function migrateFormosa(db) {
  const statements = SCHEMA_SQL.split(';').filter(s => s.trim());
  for (const sql of statements) {
    try { await db.prepare(sql).run(); } catch (e) { /* table exists */ }
  }
}

// ── LINE Webhook Handler ──
export async function handleFormosaWebhook(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const body = await request.json();
    const events = body.events || [];

    for (const event of events) {
      // User follows the bot
      if (event.type === 'follow') {
        const userId = event.source?.userId;
        if (userId) {
          // Get user profile
          const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
          await env.AUTH_DB.prepare(
            `INSERT OR REPLACE INTO formosa_users (line_user_id, display_name, picture_url, updated_at) VALUES (?, ?, ?, datetime('now'))`
          ).bind(userId, profile?.displayName || '', profile?.pictureUrl || '').run();

          // Send welcome message with tracker link
          await sendLineMessage(userId, env.FORMOSA_LINE_TOKEN, [
            {
              type: 'text',
              text: '🙏 感謝加入白沙屯媽祖 ESG 進香！\n\n進香期間，我們會定時提醒您打卡記錄足跡。\n\n📍 現在就開始記錄：\nhttps://paulkuo.tw/projects/formosa-esg-2026/tracker/'
            }
          ]);
        }
      }

      // User sends a message
      if (event.type === 'message') {
        const userId = event.source?.userId;
        const replyToken = event.replyToken;
        if (replyToken) {
          await replyLineMessage(replyToken, env.FORMOSA_LINE_TOKEN, [
            {
              type: 'text',
              text: '📍 點這裡打卡記錄足跡：\nhttps://paulkuo.tw/projects/formosa-esg-2026/tracker/'
            }
          ]);
        }
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
    const userId = data.user_id || 'anonymous_' + Date.now();

    // Save survey
    if (data.survey) {
      const s = data.survey;
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
        s.role || 'participant',
        s.transport?.walk || 0,
        s.transport?.car || 0,
        s.transport?.carpool || 1,
        s.transport?.scooter || 0,
        s.transport?.bus || 0,
        s.transport?.mrt || 0,
        s.transport?.train || 0,
        s.transport?.hsr || 0,
        s.water_bottles || 0,
        s.hotel_nights || 0,
        data.carbon?.total_kg || 0,
        JSON.stringify(data.carbon?.breakdown || {})
      ).run();
    }

    // Save GPS points
    if (data.gps_points && data.gps_points.length > 0) {
      const stmts = data.gps_points.map(pt =>
        env.AUTH_DB.prepare(
          `INSERT INTO formosa_gps_points (user_id, lat, lng, altitude, accuracy, source, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(userId, pt.lat, pt.lng, pt.altitude || null, pt.accuracy || null, pt.source || 'checkin', pt.timestamp || new Date().toISOString())
      );
      await env.AUTH_DB.batch(stmts);
    }

    return jsonResponse({ ok: true, user_id: userId, message: '資料已儲存' }, 200, request);
  } catch (e) {
    console.error('Submit error:', e.message);
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── GPS Check-in Handler (lightweight, for periodic pings) ──
export async function handleFormosaCheckin(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    await migrateFormosa(env.AUTH_DB);
    const data = await request.json();
    const userId = data.user_id || 'anonymous_' + Date.now();

    await env.AUTH_DB.prepare(
      `INSERT INTO formosa_gps_points (user_id, lat, lng, altitude, accuracy, source, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(userId, data.lat, data.lng, data.altitude || null, data.accuracy || null, data.source || 'checkin', data.timestamp || new Date().toISOString()).run();

    // Count total points for this user
    const count = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_gps_points WHERE user_id = ?').bind(userId).first();

    return jsonResponse({ ok: true, total_points: count?.cnt || 1 }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── Push Notification: Send check-in reminder to all followers ──
export async function handleFormosaPush(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    // Get all registered users
    const users = await env.AUTH_DB.prepare('SELECT line_user_id FROM formosa_users WHERE line_user_id IS NOT NULL').all();

    if (!users.results?.length) {
      return jsonResponse({ ok: true, sent: 0, message: 'No users to notify' }, 200, request);
    }

    const userIds = users.results.map(u => u.line_user_id);

    // Use LINE multicast (up to 500 users per call)
    const message = {
      type: 'template',
      altText: '📍 媽祖保佑！現在走到哪了？點這裡打卡',
      template: {
        type: 'buttons',
        title: '📍 進香打卡提醒',
        text: '媽祖保佑 🙏\n記錄您的進香足跡吧！',
        actions: [
          {
            type: 'uri',
            label: '立即打卡 📍',
            uri: 'https://paulkuo.tw/projects/formosa-esg-2026/tracker/'
          }
        ]
      }
    };

    await multicastLineMessage(userIds, env.FORMOSA_LINE_TOKEN, [message]);

    return jsonResponse({ ok: true, sent: userIds.length }, 200, request);
  } catch (e) {
    console.error('Push error:', e.message);
    return jsonResponse({ error: e.message }, 500, request);
  }
}

// ── Data Dashboard API ──
export async function handleFormosaData(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  try {
    const surveys = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_surveys').first();
    const points = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_gps_points').first();
    const users = await env.AUTH_DB.prepare('SELECT COUNT(*) as cnt FROM formosa_users').first();
    const recentPoints = await env.AUTH_DB.prepare('SELECT lat, lng, source, timestamp, user_id FROM formosa_gps_points ORDER BY created_at DESC LIMIT 200').all();

    // Carbon summary
    const carbonSum = await env.AUTH_DB.prepare('SELECT SUM(carbon_total_kg) as total, AVG(carbon_total_kg) as avg FROM formosa_surveys').first();

    return jsonResponse({
      stats: {
        total_surveys: surveys?.cnt || 0,
        total_gps_points: points?.cnt || 0,
        total_users: users?.cnt || 0,
        carbon_total_kg: +(carbonSum?.total || 0).toFixed(2),
        carbon_avg_kg: +(carbonSum?.avg || 0).toFixed(2),
      },
      gps_points: recentPoints?.results || [],
    }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
  }
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
  for (let i = 0; i < userIds.length; i += 500) {
    const batch = userIds.slice(i, i + 500);
    await fetch('https://api.line.me/v2/bot/message/multicast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to: batch, messages })
    });
  }
}
