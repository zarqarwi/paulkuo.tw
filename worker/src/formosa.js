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
    await migrateFormosa(env.AUTH_DB);
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
        // Ensure user is saved (in case follow event was missed)
        if (userId) {
          const profile = await getLineProfile(userId, env.FORMOSA_LINE_TOKEN);
          await env.AUTH_DB.prepare(
            `INSERT OR REPLACE INTO formosa_users (line_user_id, display_name, picture_url, updated_at) VALUES (?, ?, ?, datetime('now'))`
          ).bind(userId, profile?.displayName || '', profile?.pictureUrl || '').run();
        }
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

// ── 9-Level Pilgrim Ranking (mirrored from frontend) ──
const TITLES = [
  { km: 0,   checkins: 1,  icon: '🔥', name: '煉氣香客', sub: '啟程入門者' },
  { km: 15,  checkins: 3,  icon: '🧱', name: '築基香客', sub: '開始上路者' },
  { km: 45,  checkins: 5,  icon: '💛', name: '金丹香客', sub: '穩定行腳者' },
  { km: 90,  checkins: 6,  icon: '👶', name: '元嬰香客', sub: '深度參與者' },
  { km: 135, checkins: 8,  icon: '✨', name: '化神香客', sub: '高里程行者' },
  { km: 180, checkins: 10, icon: '🌀', name: '煉虛香客', sub: '進階完成者' },
  { km: 225, checkins: 12, icon: '🤝', name: '合體香客', sub: '高階完成者' },
  { km: 270, checkins: 14, icon: '🏆', name: '大乘香客', sub: '榮譽進階者' },
  { km: 300, checkins: 14, icon: '🚀', name: '飛升香客', sub: '圓滿認證者' }
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

// ── Per-User Dashboard API ──
export async function handleFormosaUser(request, env, userId) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  try {
    await migrateFormosa(env.AUTH_DB);
    const user = await env.AUTH_DB.prepare('SELECT display_name, picture_url, created_at FROM formosa_users WHERE line_user_id = ?').bind(userId).first();
    const points = await env.AUTH_DB.prepare('SELECT lat, lng, altitude, accuracy, source, timestamp FROM formosa_gps_points WHERE user_id = ? ORDER BY timestamp ASC').bind(userId).all();
    const survey = await env.AUTH_DB.prepare('SELECT * FROM formosa_surveys WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').bind(userId).first();

    const pts = points?.results || [];
    let totalKm = 0;
    for (let i = 1; i < pts.length; i++) {
      totalKm += haversine(pts[i-1].lat, pts[i-1].lng, pts[i].lat, pts[i].lng);
    }

    const checkins = pts.filter(p => p.source === 'manual').length || Math.max(pts.length, 1);
    const rank = computeRank(totalKm, checkins);

    return jsonResponse({
      user: user || { display_name: 'Anonymous', created_at: null },
      gps_points: pts,
      survey: survey || null,
      stats: {
        total_points: pts.length,
        total_km: +totalKm.toFixed(2),
        carbon_kg: +(survey?.carbon_total_kg || 0).toFixed(2),
        checkins,
        rank: rank.current,
        next_rank: rank.next ? { name: rank.next.name, icon: rank.next.icon, km_needed: +(rank.next.km - totalKm).toFixed(1), checkins_needed: Math.max(0, rank.next.checkins - checkins) } : null
      }
    }, 200, request);
  } catch (e) { return jsonResponse({ error: e.message }, 500, request); }
}

// ── Admin: Survey Aggregations ──
export async function handleFormosaAdminSurveys(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
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
  } catch (e) { return jsonResponse({ error: e.message }, 500, request); }
}

// ── Admin: Carbon Analytics ──
export async function handleFormosaAdminCarbon(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  try {
    await migrateFormosa(env.AUTH_DB);
    const rows = await env.AUTH_DB.prepare('SELECT transport_walk, transport_car, transport_carpool, transport_scooter, transport_bus, transport_mrt, transport_train, transport_hsr, water_bottles, hotel_nights, carbon_total_kg FROM formosa_surveys').all();
    const data = rows?.results || [];

    const modes = ['walk','car','scooter','bus','mrt','train','hsr'];
    const factors = { walk: 0, car: 0.21, scooter: 0.05, bus: 0.04, mrt: 0.03, train: 0.03, hsr: 0.04 };
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

    // Calculate carbon saved: if all walk km were driven by car
    const walkKm = totals.walk.km;
    const hypothetical = walkKm * 0.21;
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
  } catch (e) { return jsonResponse({ error: e.message }, 500, request); }
}

// ── Admin: Activity Timeline ──
export async function handleFormosaAdminTimeline(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
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
  } catch (e) { return jsonResponse({ error: e.message }, 500, request); }
}

// ── Admin: User Table ──
export async function handleFormosaAdminUsers(request, env) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  try {
    await migrateFormosa(env.AUTH_DB);
    const gpsUsers = await env.AUTH_DB.prepare(`
      SELECT g.user_id, u.display_name, u.picture_url,
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
        gps_count: u.gps_count,
        survey_done: !!s,
        carbon_kg: +(s?.carbon_total_kg || 0).toFixed(2),
        walk_km: +(s?.transport_walk || 0).toFixed(1),
        last_active: u.last_active,
        first_active: u.first_active
      };
    });

    return jsonResponse({ users }, 200, request);
  } catch (e) { return jsonResponse({ error: e.message }, 500, request); }
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

    return jsonResponse({
      ok: true,
      user_id: lineUserId,
      checkins: checkinCount,
      km: Math.round(totalKm * 100) / 100,
      survey_done: !!survey,
      carbon: survey?.carbon_total_kg || 0,
      gps_track: pts.map(p => ({ lat: p.lat, lng: p.lng, datetime: p.datetime, source: p.source }))
    }, 200, request);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, request);
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
