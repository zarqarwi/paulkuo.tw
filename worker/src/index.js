/**
 * paulkuo-ticker Worker
 * 
 * 即時資料 API：Fitbit 步數 + CyberSolutions 股價
 * 取代原本的 cron → git commit → build 架構
 * 
 * Endpoints:
 *   GET  /fitbit    — 回傳即時 Fitbit 資料（5 分鐘快取）
 *   GET  /stock     — 回傳 CyberSolutions (436A.T) 即時股價（交易時段 10 分鐘 / 非交易 1 小時快取）
 *   GET  /health    — 健康檢查
 *   GET  /sleep     — 睡眠資料分析（?year=2025 或 ?start=...&end=...）
 *   POST /translate — 即時翻譯（Web Speech API 前端 → Claude Haiku）
 *   POST /stt       — 語音辨識 + 翻譯（Whisper → Claude Haiku）
 *   GET  /costs     — API 費用追蹤（?days=30）
 *   GET  /usage         — 使用統計（admin only, ?days=30&code=xxx）
 *   POST /validate-code — 邀請碼驗證
 *   GET  /deepgram-token — Deepgram 臨時 token（需邀請碼）
 * 
 * Auth:
 *   GET  /auth/google/login    — 導向 Google OAuth
 *   GET  /auth/google/callback — Google OAuth callback
 *   GET  /auth/line/login      — 導向 LINE OAuth
 *   GET  /auth/line/callback   — LINE OAuth callback
 *   GET  /auth/facebook/login  — 導向 Facebook OAuth
 *   GET  /auth/facebook/callback — Facebook OAuth callback
 *   GET  /auth/me              — 取得目前登入用戶
 *   POST /auth/logout          — 登出
 *   GET  /auth/admin/members   — 會員列表（admin only）
 * 
 * Cron Trigger:
 *   每 6 小時 refresh Fitbit OAuth2 token
 * 
 * KV keys:
 *   fitbit_token — { access_token, refresh_token, expires_at }
 *   fitbit_cache — { data, cached_at }
 *   stock_cache  — { data, cached_at }
 *   costs_YYYY-MM-DD — [ {timestamp, service, model, action, source, costUSD, ...} ]
 */

const FITBIT_CLIENT_ID = '23V2BH';
// FITBIT_CLIENT_SECRET moved to env secret (wrangler secret put FITBIT_CLIENT_SECRET)
const CACHE_TTL_SEC = 300; // 5 分鐘快取（Fitbit）
const STOCK_SYMBOL = '436A.T';
const STOCK_NAME = 'CyberSolutions';
const STOCK_CACHE_TRADING = 600;  // 交易時段 10 分鐘
const STOCK_CACHE_CLOSED = 3600;  // 非交易時段 1 小時
const ALLOWED_ORIGINS = [
  'https://paulkuo.tw',
  'http://localhost:4321', // Astro dev
  'http://localhost:3000',
  'null', // file:// protocol (local HTML)
];

// === Auth Config ===
const GOOGLE_CLIENT_ID = '220236417478-a3b13lfa6e4q1100bdmdhuc07o97cc1c.apps.googleusercontent.com';
const GOOGLE_REDIRECT_URI = 'https://api.paulkuo.tw/auth/google/callback';
const GOOGLE_SCOPES = 'openid email profile';
// LINE Login
const LINE_CHANNEL_ID = '2009342944';
const LINE_REDIRECT_URI = 'https://api.paulkuo.tw/auth/line/callback';
const LINE_SCOPES = 'profile openid email';
// Facebook Login
const FB_APP_ID = '1625606208779447';
const FB_REDIRECT_URI = 'https://api.paulkuo.tw/auth/facebook/callback';
const FB_SCOPES = 'public_profile,email';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const SITE_URL = 'https://paulkuo.tw';

// Safe redirect path from OAuth cookie
function getOAuthRedirect(request) {
  const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_redirect=([^\s;]+)/);
  if (!cookie) return '';
  try {
    const path = decodeURIComponent(cookie[1]);
    if (path.startsWith('/') && !path.startsWith('//') && !path.includes(':')) return path;
  } catch (e) {}
  return '';
}

// === Invite Codes (hardcoded defaults + KV overrides) ===
// Invite codes stored in KV (key: 'invite_codes') — no hardcoded defaults
async function validateCode(code, kv) {
  if (!code) return null;
  const c = code.trim().toLowerCase();
  try {
    const kvCodes = await kv.get('invite_codes');
    if (kvCodes) {
      const parsed = JSON.parse(kvCodes);
      if (parsed[c]) return parsed[c];
    }
  } catch (e) { /* ignore KV errors */ }
  return null;
}


// === Unified Auth: Admin OAuth direct access, everyone else needs invite code ===
async function authenticateRequest(request, env, inviteCode) {
  // Priority 1: Admin OAuth — direct access without invite code
  const user = await getCurrentUser(request, env);
  if (user && user.role === 'admin') {
    return {
      type: 'oauth',
      name: user.name,
      role: user.role,
      userId: user.id,
      code: 'oauth:' + user.id,
      isAdmin: true,
    };
  }
  // Priority 2: Invite code (required for all non-admin users)
  if (inviteCode) {
    const codeInfo = await validateCode(inviteCode, env.TICKER_KV);
    if (codeInfo) {
      return {
        type: 'invite',
        name: codeInfo.name,
        role: codeInfo.role,
        userId: user ? user.id : null,
        code: inviteCode,
        isAdmin: codeInfo.role === 'admin',
      };
    }
  }
  // Non-admin OAuth without invite code → rejected
  return null;
}
// === In-memory rate limiting (no KV writes) ===
const rateLimitMap = new Map();
function checkRateLimit(ip, limit) {
  const now = Date.now();
  const key = ip + '_' + Math.floor(now / 60000);
  // Clean old entries
  if (rateLimitMap.size > 1000) rateLimitMap.clear();
  const count = rateLimitMap.get(key) || 0;
  if (count >= limit) return false;
  rateLimitMap.set(key, count + 1);
  return true;
}

// === CORS ===
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

// === Fitbit OAuth2 Token Refresh ===
async function refreshToken(kv) {
  const tokenJson = await kv.get('fitbit_token');
  if (!tokenJson) {
    throw new Error('No token in KV');
  }
  const token = JSON.parse(tokenJson);

  const creds = btoa(`${FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET || ""}`);
    if (!env.FITBIT_CLIENT_SECRET) return jsonResponse({ error: "FITBIT_CLIENT_SECRET not configured" }, 500, request);
  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=refresh_token&refresh_token=${token.refresh_token}`,
  });

  const newToken = await res.json();
  if (!newToken.access_token) {
    throw new Error(`Refresh failed: ${JSON.stringify(newToken).slice(0, 200)}`);
  }

  const stored = {
    access_token: newToken.access_token,
    refresh_token: newToken.refresh_token,
    expires_at: Date.now() + (newToken.expires_in || 28800) * 1000,
    refreshed_at: new Date().toISOString(),
  };
  await kv.put('fitbit_token', JSON.stringify(stored));
  console.log(`Token refreshed, expires in ${newToken.expires_in}s`);
  return stored;
}

// === Fitbit API Call ===
async function fitbitGet(path, token) {
  const res = await fetch(`https://api.fitbit.com${path}`, {
    headers: { 'Authorization': `Bearer ${token.access_token}` },
  });
  if (res.status === 401) {
    throw new Error('TOKEN_EXPIRED');
  }
  return res.json();
}

// === Fetch Fitbit Data ===
async function fetchFitbitData(kv) {
  // Check cache first
  const cacheJson = await kv.get('fitbit_cache');
  if (cacheJson) {
    const cache = JSON.parse(cacheJson);
    const age = Date.now() - cache.cached_at;
    if (age < CACHE_TTL_SEC * 1000) {
      return { ...cache.data, _cached: true, _age_sec: Math.round(age / 1000) };
    }
  }

  // Get token
  let tokenJson = await kv.get('fitbit_token');
  if (!tokenJson) {
    throw new Error('No Fitbit token configured');
  }
  let token = JSON.parse(tokenJson);

  // Proactive refresh if < 2h remaining
  if (token.expires_at - Date.now() < 2 * 3600 * 1000) {
    try {
      token = await refreshToken(kv);
    } catch (e) {
      console.error('Proactive refresh failed:', e.message);
    }
  }

  // Taiwan time (UTC+8)
  const now = new Date();
  const twOffset = 8 * 60 * 60 * 1000;
  const twNow = new Date(now.getTime() + twOffset);
  const today = twNow.toISOString().slice(0, 10);
  const weekStart = new Date(twNow.getTime() - 7 * 86400000).toISOString().slice(0, 10);

  let summary, stepsData;
  try {
    [summary, stepsData] = await Promise.all([
      fitbitGet(`/1/user/-/activities/date/${today}.json`, token),
      fitbitGet(`/1/user/-/activities/steps/date/${weekStart}/${today}.json`, token),
    ]);
  } catch (e) {
    if (e.message === 'TOKEN_EXPIRED') {
      // Try refresh and retry once
      token = await refreshToken(kv);
      [summary, stepsData] = await Promise.all([
        fitbitGet(`/1/user/-/activities/date/${today}.json`, token),
        fitbitGet(`/1/user/-/activities/steps/date/${weekStart}/${today}.json`, token),
      ]);
    } else {
      throw e;
    }
  }

  const s = summary.summary || {};
  const goals = summary.goals || {};
  const dist = (s.distances || []).find(d => d.activity === 'total')?.distance || 0;

  const week = (stepsData['activities-steps'] || []).map(d => ({
    date: d.dateTime,
    steps: parseInt(d.value, 10),
  }));

  const data = {
    updated: new Date().toISOString(),
    source: 'cloudflare-worker',
    token_status: 'active',
    today: {
      steps: s.steps || 0,
      goal: goals.steps || 10000,
      distance_km: Math.round(dist * 100) / 100,
      calories: s.activityCalories || 0,
      resting_hr: s.restingHeartRate || 0,
    },
    week,
  };

  // Cache in KV (no expiration — we check age manually)
  await kv.put('fitbit_cache', JSON.stringify({ data, cached_at: Date.now() }));

  return data;
}


// === Stock: TSE Trading Hours Check ===
function isTseTradingHours() {
  // JST = UTC+9, TSE 09:00-15:30 JST
  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  const jstDay = now.getUTCDay();
  // Adjust day if UTC+9 crosses midnight
  const jstDate = new Date(now.getTime() + 9 * 3600 * 1000);
  const dayOfWeek = jstDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Weekend
  const jstMin = jstDate.getHours() * 60 + jstDate.getMinutes();
  return jstMin >= 540 && jstMin <= 930; // 09:00-15:30
}

// === Fetch Stock Data ===
async function fetchStockData(kv) {
  const trading = isTseTradingHours();
  const cacheTtl = trading ? STOCK_CACHE_TRADING : STOCK_CACHE_CLOSED;

  // Check cache
  const cacheJson = await kv.get('stock_cache');
  if (cacheJson) {
    const cache = JSON.parse(cacheJson);
    const age = Date.now() - cache.cached_at;
    if (age < cacheTtl * 1000) {
      return { ...cache.data, _cached: true, _age_sec: Math.round(age / 1000) };
    }
  }

  // Fetch from Yahoo Finance
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${STOCK_SYMBOL}?range=5d&interval=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!res.ok) {
    // Return stale cache if available
    if (cacheJson) {
      const cache = JSON.parse(cacheJson);
      return { ...cache.data, _stale: true, _error: `Yahoo returned ${res.status}` };
    }
    throw new Error(`Yahoo Finance API error: ${res.status}`);
  }

  const json = await res.json();
  const result = json.chart?.result?.[0];
  if (!result) throw new Error('No chart data from Yahoo');

  const meta = result.meta || {};
  const price = meta.regularMarketPrice || 0;
  const prevClose = meta.chartPreviousClose || meta.previousClose || price;
  const changePercent = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

  // 5-day history for sparkline
  const timestamps = result.timestamp || [];
  const closes = result.indicators?.quote?.[0]?.close || [];
  const history = timestamps.map((ts, i) => ({
    date: new Date(ts * 1000).toISOString().slice(0, 10),
    close: closes[i] != null ? Math.round(closes[i]) : null,
  })).filter(d => d.close != null);

  const data = {
    updated: new Date().toISOString(),
    source: 'cloudflare-worker',
    symbol: STOCK_SYMBOL,
    name: STOCK_NAME,
    price: Math.round(price),
    previousClose: Math.round(prevClose),
    changePercent: Math.round(changePercent * 100) / 100,
    currency: meta.currency || 'JPY',
    trading,
    history,
  };

  await kv.put('stock_cache', JSON.stringify({ data, cached_at: Date.now() }));
  return data;
}


// === Fetch Sleep Data ===
async function fetchSleepData(kv, params) {
  // Get token
  let tokenJson = await kv.get('fitbit_token');
  if (!tokenJson) throw new Error('No Fitbit token configured');
  let token = JSON.parse(tokenJson);

  // Proactive refresh if < 2h remaining
  if (token.expires_at - Date.now() < 2 * 3600 * 1000) {
    try { token = await refreshToken(kv); } catch (e) {
      console.error('Proactive refresh failed:', e.message);
    }
  }

  const { year, month } = params;

  if (month) {
    // Single month detail: /sleep?month=2025-03
    const [y, m] = month.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2,'0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2,'0')}-${String(lastDay).padStart(2,'0')}`;

    let data;
    try {
      data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token);
    } catch (e) {
      if (e.message === 'TOKEN_EXPIRED') {
        token = await refreshToken(kv);
        data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token);
      } else throw e;
    }

    const sleepLogs = data.sleep || [];
    const daily = {};
    for (const log of sleepLogs) {
      if (!log.isMainSleep) continue;
      const d = log.dateOfSleep;
      if (!daily[d]) daily[d] = { date: d, duration_min: 0, deep_min: 0, light_min: 0, rem_min: 0, wake_min: 0, efficiency: 0, start: '', end: '' };
      daily[d].duration_min += Math.round((log.duration || 0) / 60000);
      daily[d].efficiency = log.efficiency || 0;
      daily[d].start = log.startTime || '';
      daily[d].end = log.endTime || '';
      const stages = log.levels?.summary || {};
      daily[d].deep_min += stages.deep?.minutes || 0;
      daily[d].light_min += stages.light?.minutes || 0;
      daily[d].rem_min += stages.rem?.minutes || 0;
      daily[d].wake_min += stages.wake?.minutes || 0;
    }

    const days = Object.values(daily).sort((a, b) => a.date.localeCompare(b.date));
    const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, d) => s + d[key], 0) / arr.length) : 0;

    return {
      month,
      days_tracked: days.length,
      avg_duration_min: avg(days, 'duration_min'),
      avg_deep_min: avg(days, 'deep_min'),
      avg_rem_min: avg(days, 'rem_min'),
      avg_light_min: avg(days, 'light_min'),
      avg_wake_min: avg(days, 'wake_min'),
      avg_efficiency: avg(days, 'efficiency'),
      daily: days,
    };
  }

  if (year) {
    // Year summary: /sleep?year=2025 — fetch in 90-day chunks
    const y = parseInt(year);
    const chunks = [
      [`${y}-01-01`, `${y}-03-31`],
      [`${y}-04-01`, `${y}-06-30`],
      [`${y}-07-01`, `${y}-09-30`],
      [`${y}-10-01`, `${y}-12-31`],
    ];

    const allLogs = [];
    for (const [start, end] of chunks) {
      try {
        const data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token);
        if (data.sleep) allLogs.push(...data.sleep);
      } catch (e) {
        if (e.message === 'TOKEN_EXPIRED') {
          token = await refreshToken(kv);
          const data = await fitbitGet(`/1.2/user/-/sleep/date/${start}/${end}.json`, token);
          if (data.sleep) allLogs.push(...data.sleep);
        } else {
          console.error(`Sleep chunk ${start}-${end} failed:`, e.message);
        }
      }
    }

    // Group by month
    const months = {};
    for (const log of allLogs) {
      if (!log.isMainSleep) continue;
      const m = log.dateOfSleep.slice(0, 7);
      if (!months[m]) months[m] = { month: m, days: 0, total_min: 0, deep_min: 0, light_min: 0, rem_min: 0, wake_min: 0, efficiency_sum: 0 };
      months[m].days++;
      months[m].total_min += Math.round((log.duration || 0) / 60000);
      const stages = log.levels?.summary || {};
      months[m].deep_min += stages.deep?.minutes || 0;
      months[m].light_min += stages.light?.minutes || 0;
      months[m].rem_min += stages.rem?.minutes || 0;
      months[m].wake_min += stages.wake?.minutes || 0;
      months[m].efficiency_sum += log.efficiency || 0;
    }

    const monthly = Object.values(months)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({
        month: m.month,
        days_tracked: m.days,
        avg_duration_min: m.days ? Math.round(m.total_min / m.days) : 0,
        avg_deep_min: m.days ? Math.round(m.deep_min / m.days) : 0,
        avg_rem_min: m.days ? Math.round(m.rem_min / m.days) : 0,
        avg_light_min: m.days ? Math.round(m.light_min / m.days) : 0,
        avg_wake_min: m.days ? Math.round(m.wake_min / m.days) : 0,
        avg_efficiency: m.days ? Math.round(m.efficiency_sum / m.days) : 0,
      }));

    const totalDays = monthly.reduce((s, m) => s + m.days_tracked, 0);
    const avgAll = (key) => totalDays ? Math.round(monthly.reduce((s, m) => s + m[key] * m.days_tracked, 0) / totalDays) : 0;

    return {
      year: y,
      total_days_tracked: totalDays,
      yearly_avg_duration_min: avgAll('avg_duration_min'),
      yearly_avg_deep_min: avgAll('avg_deep_min'),
      yearly_avg_rem_min: avgAll('avg_rem_min'),
      yearly_avg_efficiency: avgAll('avg_efficiency'),
      monthly,
    };
  }

  throw new Error('Missing parameter: use ?year=2025 or ?month=2025-03');
}

// === Cost Tracking ===
// Pricing (per Mar 2026)
const PRICING = {
  'whisper-1': { perMinute: 0.006 },
  'claude-haiku-4-5-20251001': { inputPerMTok: 0.80, outputPerMTok: 4.00 },
};
// Language display names (shared across translate/stt/summarize)
const TNAMES = {
  'ja': '日本語', 'zh-TW': '繁體中文', 'en': 'English',
  'zh-CN': '简体中文', 'ko': '한국어',
  'vi': 'Tiếng Việt', 'th': 'ภาษาไทย', 'id': 'Bahasa Indonesia',
  'de': 'Deutsch', 'es': 'Español', 'fr': 'Français'
};


// === Taiwan timezone helper (UTC+8) ===
function twISOString(date) {
  const d = date || new Date();
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().replace('Z', '+08:00');
}
function twDateStr(date) {
  const d = date || new Date();
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// === Batched cost logging (reduces KV writes by ~50x) ===
const costBuffer = [];
const COST_FLUSH_SIZE = 50;
let costFlushTimer = null;

async function logCost(kv, record) {
  costBuffer.push({
    timestamp: twISOString(),
    ...record,
    costTWD: +(record.costUSD * 32.5).toFixed(4),
  });
  if (costBuffer.length >= COST_FLUSH_SIZE) {
    await flushCosts(kv);
  }
}

async function flushCosts(kv) {
  if (costBuffer.length === 0) return;
  const toFlush = costBuffer.splice(0);
  // Group by date
  const byDate = {};
  toFlush.forEach(e => {
    const d = e.timestamp.slice(0, 10);
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(e);
  });
  for (const [date, entries] of Object.entries(byDate)) {
    const dateKey = `costs_${date}`;
    try {
      const existing = await kv.get(dateKey);
      const arr = existing ? JSON.parse(existing) : [];
      arr.push(...entries);
      await kv.put(dateKey, JSON.stringify(arr), { expirationTtl: 90 * 86400 });
    } catch (e) {
      console.error('flushCosts failed:', e.message);
    }
  }
}

async function handleCosts(request, env) {
  const url = new URL(request.url);
  // Admin auth required
  const adminCode = url.searchParams.get('code') || '';
  const auth = await authenticateRequest(request, env, adminCode);
  if (!auth || !auth.isAdmin) {
    return jsonResponse({ error: 'Admin access required' }, 403, request);
  }
  // Flush buffer first so results are up-to-date
  await flushCosts(env.TICKER_KV);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 90);
  const records = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateKey = `costs_${twDateStr(d)}`;
    const data = await env.TICKER_KV.get(dateKey);
    if (data) {
      try { records.push(...JSON.parse(data)); } catch(e) {}
    }
  }

  // Summary
  const totalUSD = records.reduce((s, r) => s + (r.costUSD || 0), 0);
  const byService = {};
  const bySource = {};
  const byDate = {};
  records.forEach(r => {
    byService[r.service] = (byService[r.service] || 0) + (r.costUSD || 0);
    bySource[r.source] = (bySource[r.source] || 0) + (r.costUSD || 0);
    const day = (r.timestamp || '').slice(0, 10);
    if (day) byDate[day] = (byDate[day] || 0) + (r.costUSD || 0);
  });

  return jsonResponse({
    days,
    totalRecords: records.length,
    totalUSD: +totalUSD.toFixed(6),
    totalTWD: +(totalUSD * 32.5).toFixed(2),
    byService,
    bySource,
    byDate,
    records: records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')),
  }, 200, request);
}

// === STT via Whisper + Translate via Claude Haiku ===
const STT_RATE_LIMIT = 20; // max requests per minute per IP

async function handleSTT(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }
  if (!env.OPENAI_API_KEY) {
    return jsonResponse({ error: 'OPENAI_API_KEY not configured' }, 500, request);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  }

  // Rate limit (in-memory, no KV writes)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, STT_RATE_LIMIT)) {
    return jsonResponse({ error: 'Rate limited. Max 20 requests/min.' }, 429, request);
  }

  // Parse form data (audio file + targetLang)
  let formData;
  try {
    formData = await request.formData();
  } catch (e) {
    return jsonResponse({ error: 'Expected multipart form data' }, 400, request);
  }

  const audioFile = formData.get('audio');
  const targetLang = formData.get('targetLang') || 'zh-TW';
  const userCode = formData.get('code') || '';

  // === Auth verification (OAuth session or invite code) ===
  const auth = await authenticateRequest(request, env, userCode);
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, request);
  }

  if (!audioFile) {
    return jsonResponse({ error: 'Missing audio file' }, 400, request);
  }

  // Check file size (max 10MB)
  if (audioFile.size > 10 * 1024 * 1024) {
    return jsonResponse({ error: 'Audio file too large (max 10MB)' }, 400, request);
  }

  // Step 1: Whisper STT
  const whisperForm = new FormData();
  whisperForm.append('file', audioFile, 'audio.webm');
  whisperForm.append('model', 'whisper-1');
  whisperForm.append('response_format', 'verbose_json');

  let transcript, detectedLang;
  try {
    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
      body: whisperForm,
    });
    if (!whisperRes.ok) {
      const err = await whisperRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Whisper API ${whisperRes.status}`);
    }
    const whisperData = await whisperRes.json();
    transcript = (whisperData.text || '').trim();
    detectedLang = whisperData.language || 'unknown';
    // Log Whisper cost
    const audioDuration = whisperData.duration || 5; // seconds
    const whisperCost = (audioDuration / 60) * PRICING['whisper-1'].perMinute;
    await logCost(env.TICKER_KV, {
      service: 'openai', model: 'whisper-1', action: 'stt', source: 'translator', code: auth.code,
      costUSD: +whisperCost.toFixed(6), durationSec: audioDuration,
      note: `${detectedLang} ${audioDuration.toFixed(1)}s`
    });
  } catch (e) {
    return jsonResponse({ error: 'Whisper: ' + e.message }, 502, request);
  }

  if (!transcript) {
    return jsonResponse({ original: '', detectedLang: 'unknown', translated: '' }, 200, request);
  }

  // Map Whisper language codes to our lang codes
  const WHISPER_TO_LANG = {
    'japanese': 'ja', 'english': 'en', 'chinese': 'zh-TW',
    'korean': 'ko', 'mandarin': 'zh-TW',
    'vietnamese': 'vi', 'thai': 'th', 'indonesian': 'id',
    'german': 'de', 'spanish': 'es', 'french': 'fr',
    // Whisper consistently misdetects Korean speech as Norwegian Nynorsk (nynorsk/nn).
    // Known Whisper bug: Korean prosody triggers the Nynorsk classifier.
    // Ref: https://github.com/openai/whisper/issues/680
    'nynorsk': 'ko', 'nn': 'ko'
  };
  const langCode = WHISPER_TO_LANG[detectedLang] || detectedLang;

  // Skip translation if source == target (but NOT zh-TW: Whisper outputs simplified, need Claude to convert)
  if (langCode === targetLang && targetLang !== 'zh-TW') {
    return jsonResponse({ original: transcript, detectedLang: langCode, translated: transcript }, 200, request);
  }

  // Step 2: Claude Haiku translation (with retry)
  const targetName = TNAMES[targetLang] || targetLang;
  const twHint = targetLang === 'zh-TW' ? ' Use Traditional Chinese characters with Taiwanese vocabulary (e.g. 軟體 not 软件, 網路 not 网络, 影片 not 视频).' : '';
  const claudeBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a professional real-time interpreter. Translate the following into ${targetName}. Fix any obvious speech recognition errors before translating. Output ONLY the translation, nothing else.${twHint}\n\n${transcript.slice(0, 2000)}`
    }]
  });

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: claudeBody
      });
      if (claudeRes.status === 529 && attempt < MAX_RETRIES - 1) {
        console.log(`Claude overloaded, retry ${attempt + 1}/${MAX_RETRIES}`);
        continue;
      }
      if (!claudeRes.ok) {
        const err = await claudeRes.json().catch(() => ({}));
        throw new Error(err.error?.message || `Claude API ${claudeRes.status}`);
      }
      const claudeData = await claudeRes.json();
      const translated = claudeData.content?.[0]?.text?.trim() || '';
      // Log Claude cost
      const usage = claudeData.usage || {};
      const hp = PRICING['claude-haiku-4-5-20251001'];
      const claudeCost = ((usage.input_tokens || 0) / 1e6) * hp.inputPerMTok + ((usage.output_tokens || 0) / 1e6) * hp.outputPerMTok;
      await logCost(env.TICKER_KV, {
        service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate', source: 'translator', code: auth.code,
        inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0,
        costUSD: +claudeCost.toFixed(6),
        note: `${langCode}→${targetLang}`
      });
      return jsonResponse({ original: transcript, detectedLang: langCode, translated }, 200, request);
    } catch (e) {
      if (attempt === MAX_RETRIES - 1) {
        return jsonResponse({ original: transcript, detectedLang: langCode, translated: '⚠ ' + e.message }, 200, request);
      }
    }
  }
}

// === Translate via Claude Haiku ===
const TRANSLATE_RATE_LIMIT = 30; // max requests per minute per IP

async function handleTranslate(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }

  // Check API key is configured
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }

  const { text, sourceLang, targetLang, code: userCode, glossary } = body;
  if (!text || !targetLang) {
    return jsonResponse({ error: 'Missing text or targetLang' }, 400, request);
  }

  // === Auth verification (OAuth session or invite code) ===
  const auth = await authenticateRequest(request, env, userCode || '');
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, request);
  }

  // Rate limit (in-memory, no KV writes)
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, TRANSLATE_RATE_LIMIT)) {
    return jsonResponse({ error: 'Rate limited. Max 30 requests/min.' }, 429, request);
  }

  // Truncate to prevent abuse (max 2000 chars)
  const trimmedText = text.slice(0, 2000);

  const targetName = TNAMES[targetLang] || targetLang;
  const claudeBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a professional real-time interpreter. Translate the following into ${targetName}. Fix any obvious speech recognition errors before translating. Output ONLY the translation, nothing else. If the text is already in ${targetName}, output it as-is.${targetLang === 'zh-TW' ? ' Use Traditional Chinese characters with Taiwanese vocabulary (e.g. 軟體 not 软件, 網路 not 网络, 影片 not 视频).' : ''}\n\n${trimmedText}`
    }]
  });

  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1000 * attempt));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: claudeBody
      });

      if (res.status === 529 && attempt < MAX_RETRIES - 1) {
        console.log('Translate: Claude overloaded, retry ' + (attempt + 1));
        continue;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Anthropic API ${res.status}`);
      }

      const data = await res.json();
      const translated = data.content?.[0]?.text?.trim() || '';

      // Log Claude cost with code tracking
      const usage = data.usage || {};
      const hp = PRICING['claude-haiku-4-5-20251001'];
      const claudeCost = ((usage.input_tokens || 0) / 1e6) * hp.inputPerMTok + ((usage.output_tokens || 0) / 1e6) * hp.outputPerMTok;
      await logCost(env.TICKER_KV, {
        service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate', source: 'translator', code: auth.code,
        inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0,
        costUSD: +claudeCost.toFixed(6),
        note: (sourceLang || 'auto') + '>' + targetLang
      });

      return jsonResponse({ translated, model: 'claude-haiku-4-5' }, 200, request);
    } catch (e) {
      if (attempt === MAX_RETRIES - 1) {
        return jsonResponse({ error: e.message }, 502, request);
      }
    }
  }
}

// === Streaming Translation via Claude Haiku (SSE) ===
async function handleTranslateStream(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  }
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }
  const { text, sourceLang, targetLang, code: userCode, glossary } = body;
  if (!text || !targetLang) {
    return jsonResponse({ error: 'Missing text or targetLang' }, 400, request);
  }
  const auth = await authenticateRequest(request, env, userCode || '');
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, request);
  }
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (!checkRateLimit(ip, TRANSLATE_RATE_LIMIT)) {
    return jsonResponse({ error: 'Rate limited' }, 429, request);
  }

  const trimmedText = text.slice(0, 2000);
  const targetName = TNAMES[targetLang] || targetLang;
  const twHint = targetLang === 'zh-TW' ? ' Use Traditional Chinese characters with Taiwanese vocabulary (e.g. 軟體 not 软件, 網路 not 网络, 影片 not 视频).' : '';
  const glossaryHint = (glossary && glossary.length > 0) ? '\nUse these terminology translations: ' + glossary.map(g => g.term + ' → ' + g.translation).join(', ') + '.' : '';

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      stream: true,
      messages: [{
        role: 'user',
        content: 'You are a professional real-time interpreter. Translate the following into ' + targetName + '. Fix any obvious speech recognition errors before translating. Output ONLY the translation, nothing else.' + twHint + glossaryHint + '\n\n' + trimmedText
      }]
    })
  });

  if (!claudeRes.ok) {
    const err = await claudeRes.json().catch(() => ({}));
    return jsonResponse({ error: err.error?.message || 'Claude API ' + claudeRes.status }, 502, request);
  }

  // Transform Anthropic SSE → simplified SSE for frontend
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  let inputTokens = 0, outputTokens = 0;

  (async () => {
    const reader = claudeRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const evt = JSON.parse(data);
            if (evt.type === 'content_block_delta' && evt.delta?.text) {
              await writer.write(encoder.encode('data: ' + JSON.stringify({ t: evt.delta.text }) + '\n\n'));
            }
            if (evt.type === 'message_delta' && evt.usage) {
              outputTokens = evt.usage.output_tokens || 0;
            }
            if (evt.type === 'message_start' && evt.message?.usage) {
              inputTokens = evt.message.usage.input_tokens || 0;
            }
          } catch (e) {}
        }
      }
      // Send done event with cost
      const hp = PRICING['claude-haiku-4-5-20251001'];
      const cost = (inputTokens / 1e6) * hp.inputPerMTok + (outputTokens / 1e6) * hp.outputPerMTok;
      await writer.write(encoder.encode('data: ' + JSON.stringify({ done: true, costUSD: +cost.toFixed(6) }) + '\n\n'));
      // Log cost
      await logCost(env.TICKER_KV, {
        service: 'anthropic', model: 'claude-haiku-4.5', action: 'translate-stream',
        source: 'translator', code: auth.code,
        inputTokens, outputTokens, costUSD: +cost.toFixed(6),
        note: (sourceLang || 'auto') + '>' + targetLang
      });
    } catch (e) {
      await writer.write(encoder.encode('data: ' + JSON.stringify({ error: e.message }) + '\n\n'));
    } finally {
      await writer.close();
    }
  })();

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...corsHeaders(request),
    },
  });
}

// === Public Ticker Summary (one endpoint for all live data) ===
const TICKER_CACHE_TTL = 300; // 5 minutes

async function handleTicker(request, env) {
  // Check cache
  const cacheJson = await env.TICKER_KV.get('ticker_cache');
  if (cacheJson) {
    const cache = JSON.parse(cacheJson);
    if (Date.now() - cache.cached_at < TICKER_CACHE_TTL * 1000) {
      return new Response(JSON.stringify(cache.data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(request) },
      });
    }
  }

  // Gather all data in parallel
  const [fitbitData, stockData, costsData] = await Promise.allSettled([
    fetchFitbitData(env.TICKER_KV).catch(e => null),
    fetchStockData(env.TICKER_KV).catch(e => null),
    (async () => {
      // Aggregate costs from KV (last 30 days)
      const now = new Date();
      let totalUSD = 0, monthUSD = 0, totalCalls = 0, totalTokens = 0;
      const twNow = new Date(now.getTime() + 8 * 3600 * 1000);
      const thisMonth = twNow.toISOString().slice(0, 7);
      const dailyMap = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(now.getTime() - i * 86400000);
        const dateStr = twDateStr(d);
        const dateKey = `costs_${dateStr}`;
        try {
          const raw = await env.TICKER_KV.get(dateKey);
          if (!raw) continue;
          const entries = JSON.parse(raw);
          entries.forEach(e => {
            const cost = e.costUSD || 0;
            totalUSD += cost;
            totalCalls++;
            totalTokens += (e.inputTokens || 0) + (e.outputTokens || 0);
            if (dateStr.startsWith(thisMonth)) monthUSD += cost;
            dailyMap[dateStr] = (dailyMap[dateStr] || 0) + cost;
          });
        } catch (e) {}
      }
      const sortedDays = Object.keys(dailyMap).sort().slice(-14);
      const dailyValues = sortedDays.map(d => +(dailyMap[d] || 0).toFixed(4));
      const avgPerDay = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
      const last7 = sortedDays.slice(-7);
      const prev7 = sortedDays.slice(-14, -7);
      const last7Total = last7.reduce((s, d) => s + (dailyMap[d] || 0), 0);
      const prev7Total = prev7.reduce((s, d) => s + (dailyMap[d] || 0), 0);
      const changePercent = prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total * 100) : 0;
      return { totalUSD: +totalUSD.toFixed(4), monthUSD: +monthUSD.toFixed(4), totalCalls, totalTokens, avgPerDay: +avgPerDay.toFixed(4), changePercent: +changePercent.toFixed(1), dailyValues };
    })()
  ]);

  const data = {
    fitbit: fitbitData.status === 'fulfilled' && fitbitData.value ? { steps: fitbitData.value.today?.steps || 0, goal: fitbitData.value.today?.goal || 10000 } : null,
    stock: stockData.status === 'fulfilled' && stockData.value ? { price: stockData.value.price, changePercent: stockData.value.changePercent, name: stockData.value.name, currency: stockData.value.currency } : null,
    costs: costsData.status === 'fulfilled' ? costsData.value : null,
    updated: twISOString(),
  };

  // Cache 5 min
  await env.TICKER_KV.put('ticker_cache', JSON.stringify({ data, cached_at: Date.now() }));

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(request) },
  });
}

// === Social Feed (KV-backed, pushed by social-poster) ===
// KV key: 'feed_items' — JSON array of latest posts (1 per platform, max 10)
// Each item: { platform, icon, color, content, url, datetime, category }

const FEED_CACHE_TTL = 60; // 1 minute client cache

async function handleFeedGet(request, env) {
  const raw = await env.TICKER_KV.get('feed_items');
  const items = raw ? JSON.parse(raw) : [];
  return new Response(JSON.stringify({ items, updatedAt: items[0]?.datetime || null }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${FEED_CACHE_TTL}`,
      ...corsHeaders(request),
    },
  });
}

async function handleFeedPush(request, env) {
  // Admin only
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }
  const auth = await authenticateRequest(request, env, body.code || '');
  if (!auth || !auth.isAdmin) {
    return jsonResponse({ error: 'Admin access required' }, 403, request);
  }

  const { platform, icon, color, content, url: postUrl, datetime, category } = body;
  if (!platform || !content) {
    return jsonResponse({ error: 'Missing platform or content' }, 400, request);
  }

  const newItem = {
    platform: (icon ? icon + ' ' : '') + platform,
    color: color || '#666',
    content: content.slice(0, 500),
    url: postUrl || '',
    datetime: datetime || twISOString(),
    category: category || 'general',
  };

  // Read existing, upsert by platform name, keep max 10
  const raw = await env.TICKER_KV.get('feed_items');
  let items = raw ? JSON.parse(raw) : [];

  // Replace existing entry for same platform, or prepend
  const basePlatform = platform.replace(/^[^\w]+/, '').trim();
  const idx = items.findIndex(i => i.platform.includes(basePlatform));
  if (idx >= 0) {
    items[idx] = newItem;
  } else {
    items.unshift(newItem);
  }

  // Sort by datetime desc, keep max 10
  items.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
  items = items.slice(0, 10);

  await env.TICKER_KV.put('feed_items', JSON.stringify(items));
  return jsonResponse({ ok: true, count: items.length }, 200, request);
}

// === Request Handler ===
// === Meeting Summary via Claude Haiku ===
async function handleSummarize(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }
  if (!env.ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'ANTHROPIC_API_KEY not configured' }, 500, request);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }

  const { text, lang, glossary, code: sumCode } = body;

  // === Invite code verification ===
  const auth = await authenticateRequest(request, env, sumCode || '');
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, request);
  }

  if (!text || text.trim().length < 20) {
    return jsonResponse({ error: 'Text too short for summary' }, 400, request);
  }

  const truncated = text.slice(0, 100000);
  const langName = TNAMES[lang] || lang || '繁體中文';

  let glossaryHint = '';
  if (glossary && glossary.length > 0) {
    glossaryHint = '\nGlossary (use these term translations):\n' + glossary.map(g => '- ' + g.term + ' = ' + g.translation).join('\n') + '\n';
  }

  let localeHint = '';
  if (lang === 'zh-TW') {
    localeHint = '\nIMPORTANT: Use Taiwan Traditional Chinese (台灣正體中文). Use Taiwan-specific terms: 簡報 (not 演示文稿), 投影片 (not 幻燈片), 軟體 (not 软件), 影片 (not 視頻), 網路 (not 網絡). Never use Simplified Chinese characters or mainland Chinese expressions.\n';
  }
  const prompt = `You are a professional meeting assistant. Analyze the following meeting transcript and produce a structured summary in ${langName}.${localeHint}${glossaryHint}

Output ONLY valid JSON with this structure:
{
  "title": "brief meeting title",
  "summary": "2-3 paragraph executive summary",
  "keyPoints": ["point 1", "point 2"],
  "actionItems": ["action 1", "action 2"],
  "decisions": ["decision 1"]
}

If no action items or decisions are found, use empty arrays.

--- TRANSCRIPT ---
${truncated}`;

  const MAX_RETRIES = 3;
  const claudeBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  });

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 1500 * attempt));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: claudeBody
      });

      if (res.status === 529 && attempt < MAX_RETRIES - 1) {
        console.log('Summarize: Claude overloaded, retry ' + (attempt+1));
        continue;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Claude API ${res.status}`);
      }

      const data = await res.json();
      const raw = data.content?.[0]?.text?.trim() || '';

      const usage = data.usage || {};
      const hp = PRICING['claude-haiku-4-5-20251001'];
      const cost = ((usage.input_tokens || 0) / 1e6) * hp.inputPerMTok + ((usage.output_tokens || 0) / 1e6) * hp.outputPerMTok;
      await logCost(env.TICKER_KV, {
        service: 'anthropic', model: 'claude-haiku-4.5', action: 'summarize', source: 'translator', code: auth.code,
        inputTokens: usage.input_tokens || 0, outputTokens: usage.output_tokens || 0,
        costUSD: +cost.toFixed(6), note: langName
      });

      let parsed;
      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
      } catch (e) {
        parsed = { title: 'Meeting Summary', summary: raw, keyPoints: [], actionItems: [], decisions: [] };
      }

      return jsonResponse({ ...parsed, costUSD: +cost.toFixed(6) }, 200, request);
    } catch (e) {
      if (attempt === MAX_RETRIES - 1) {
        return jsonResponse({ error: 'Summarize failed: ' + e.message }, 502, request);
      }
    }
  }
}

// === Validate Invite Code ===
async function handleValidateCode(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }
  const result = await validateCode(body.code, env.TICKER_KV);
  if (result) {
    return jsonResponse({ valid: true, name: result.name, role: result.role }, 200, request);
  }
  return jsonResponse({ valid: false }, 200, request);
}

// === Usage Statistics ===
async function handleUsage(request, env) {
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 90);
  const adminCode = url.searchParams.get('code') || '';
  
  // Only admin can view usage
  const auth = await authenticateRequest(request, env, adminCode);
  if (!auth || !auth.isAdmin) {
    return jsonResponse({ error: 'Admin access required' }, 403, request);
  }

  await flushCosts(env.TICKER_KV);

  const now = new Date();
  const byCode = {};
  let totalCost = 0;
  let totalRequests = 0;

  for (let i = 0; i < days; i++) {
    const d = new Date(now - i * 86400000);
    const dateKey = `costs_${d.toISOString().slice(0, 10)}`;
    try {
      const raw = await env.TICKER_KV.get(dateKey);
      if (!raw) continue;
      const entries = JSON.parse(raw);
      entries.forEach(e => {
        if (e.source !== 'translator') return;
        const code = e.code || 'unknown';
        if (!byCode[code]) {
          byCode[code] = { code, requests: 0, costUSD: 0, costTWD: 0, actions: {}, lastUsed: '' };
        }
        byCode[code].requests++;
        byCode[code].costUSD += (e.costUSD || 0);
        byCode[code].costTWD += (e.costTWD || 0);
        const act = e.action || 'other';
        byCode[code].actions[act] = (byCode[code].actions[act] || 0) + 1;
        if (e.timestamp > byCode[code].lastUsed) {
          byCode[code].lastUsed = e.timestamp;
        }
        totalCost += (e.costUSD || 0);
        totalRequests++;
      });
    } catch (e) { /* skip corrupted day */ }
  }

  // Round numbers
  Object.values(byCode).forEach(u => {
    u.costUSD = +u.costUSD.toFixed(6);
    u.costTWD = +u.costTWD.toFixed(4);
  });

  return jsonResponse({
    period: `${days} days`,
    totalRequests,
    totalCostUSD: +totalCost.toFixed(6),
    totalCostTWD: +(totalCost * 32.5).toFixed(4),
    users: Object.values(byCode).sort((a, b) => b.costUSD - a.costUSD)
  }, 200, request);
}

// === Deepgram Token (for streaming STT) ===
// handleDeepgramToken removed — /ws/stt proxy handles Deepgram auth


// === Log External Costs (e.g. Deepgram streaming from frontend) ===
async function handleLogCost(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'POST required' }, 405, request);
  }
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }
  const { service, model, action, source, durationSec, costUSD, note, code } = body;
  const auth = await authenticateRequest(request, env, code || '');
  if (!auth) {
    return jsonResponse({ error: 'Authentication required' }, 401, request);
  }
  if (!service || !action || costUSD === undefined) {
    return jsonResponse({ error: 'Missing required fields: service, action, costUSD' }, 400, request);
  }
  if (costUSD > 1) {
    return jsonResponse({ error: 'Cost too high for single entry' }, 400, request);
  }
  await logCost(env.TICKER_KV, {
    service: service || 'unknown',
    model: model || '',
    action: action || 'unknown',
    source: source || 'unknown',
    code: code || '',
    costUSD: +Number(costUSD).toFixed(6),
    durationSec: durationSec || 0,
    note: (note || '').slice(0, 200),
  });
  await flushCosts(env.TICKER_KV);
  return jsonResponse({ ok: true }, 200, request);
}

// ============================================================
// AUTH MODULE — Google OAuth + D1 Sessions
// ============================================================

function nanoid(size = 21) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] & 63];
  return id;
}

function setSessionCookie(sessionId) {
  // SameSite=Lax + Domain=.paulkuo.tw — cookie shared across paulkuo.tw subdomains
  return `session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=.paulkuo.tw; Max-Age=${SESSION_MAX_AGE}`;
}
function clearSessionCookie() {
  return 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=.paulkuo.tw; Max-Age=0';
}
function getSessionFromCookie(request) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([^\s;]+)/);
  return match ? match[1] : null;
}

// Google OAuth Step 1: redirect to Google
function handleGoogleLogin(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '';
  const state = nanoid(32);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  const headers = new Headers({
    Location: `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
  });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}

// Google OAuth Step 2: handle callback
async function handleGoogleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);

  // CSRF check
  const cookie = request.headers.get('Cookie') || '';
  const stateMatch = cookie.match(/(?:^|;\s*)oauth_state=([^\s;]+)/);
  if (!stateMatch || stateMatch[1] !== state) {
    return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', await tokenRes.text());
      return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302);
    }
    const tokens = await tokenRes.json();

    // Get user profile
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();

    // Upsert user in D1
    const userId = await upsertUser(env.AUTH_DB, {
      email: profile.email, name: profile.name,
      avatar: profile.picture, provider: 'google', providerId: profile.id,
    });

    // Create session
    const sessionId = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await env.AUTH_DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, expiresAt,
      (request.headers.get('User-Agent') || '').slice(0, 200),
      request.headers.get('CF-Connecting-IP') || ''
    ).run();

    // Redirect with session cookie
    const redir = getOAuthRedirect(request);
    const headers = new Headers({ Location: `${SITE_URL}${redir}${redir.includes("?") ? "&" : "?"}auth_success=1` });
    headers.append('Set-Cookie', setSessionCookie(sessionId));
    headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response(null, { status: 302, headers });

  } catch (err) {
    console.error('Google OAuth error:', err);
    return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
  }
}


// LINE Login Step 1: redirect to LINE
function handleLineLogin(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '';
  const state = nanoid(32);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINE_CHANNEL_ID,
    redirect_uri: LINE_REDIRECT_URI,
    state,
    scope: LINE_SCOPES,
  });
  const headers = new Headers({
    Location: `https://access.line.me/oauth2/v2.1/authorize?${params}`,
  });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}

// LINE Login Step 2: handle callback
async function handleLineCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);

  // CSRF check
  const cookie = request.headers.get('Cookie') || '';
  const stateMatch = cookie.match(/(?:^|;\s*)oauth_state=([^\s;]+)/);
  if (!stateMatch || stateMatch[1] !== state) {
    return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: env.LINE_CHANNEL_SECRET,
      }),
    });
    if (!tokenRes.ok) {
      console.error('LINE token exchange failed:', await tokenRes.text());
      return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302);
    }
    const tokens = await tokenRes.json();

    // Get user profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();

    // Get email from id_token (if available)
    let email = '';
    if (tokens.id_token) {
      try {
        const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        email = payload.email || '';
      } catch (e) { /* no email */ }
    }

    // Upsert user in D1
    const userId = await upsertUser(env.AUTH_DB, {
      email: email || `line_${profile.userId}@line.user`,
      name: profile.displayName,
      avatar: profile.pictureUrl || '',
      provider: 'line',
      providerId: profile.userId,
    });

    // Create session
    const sessionId = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await env.AUTH_DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, expiresAt,
      (request.headers.get('User-Agent') || '').slice(0, 200),
      request.headers.get('CF-Connecting-IP') || ''
    ).run();

    // Redirect with session cookie
    const redir = getOAuthRedirect(request);
    const headers = new Headers({ Location: `${SITE_URL}${redir}${redir.includes("?") ? "&" : "?"}auth_success=1` });
    headers.append('Set-Cookie', setSessionCookie(sessionId));
    headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('LINE OAuth error:', err);
    return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
  }
}


// Facebook Login Step 1: redirect to Facebook
function handleFacebookLogin(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get('redirect') || '';
  const state = nanoid(32);
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    state,
    scope: FB_SCOPES,
    response_type: 'code',
  });
  const headers = new Headers({
    Location: `https://www.facebook.com/v19.0/dialog/oauth?${params}`,
  });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}

// Facebook Login Step 2: handle callback
async function handleFacebookCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);

  // CSRF check
  const cookie = request.headers.get('Cookie') || '';
  const stateMatch = cookie.match(/(?:^|;\s*)oauth_state=([^\s;]+)/);
  if (!stateMatch || stateMatch[1] !== state) {
    return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  }

  try {
    // Exchange code for token
    const tokenParams = new URLSearchParams({
      client_id: FB_APP_ID,
      client_secret: env.FB_APP_SECRET,
      redirect_uri: FB_REDIRECT_URI,
      code,
    });
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams}`);
    if (!tokenRes.ok) {
      console.error('FB token exchange failed:', await tokenRes.text());
      return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302);
    }
    const tokens = await tokenRes.json();

    // Get user profile + email
    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`
    );
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();

    // Upsert user in D1
    const userId = await upsertUser(env.AUTH_DB, {
      email: profile.email || `fb_${profile.id}@facebook.user`,
      name: profile.name,
      avatar: profile.picture?.data?.url || '',
      provider: 'facebook',
      providerId: profile.id,
    });

    // Create session
    const sessionId = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
    await env.AUTH_DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)'
    ).bind(sessionId, userId, expiresAt,
      (request.headers.get('User-Agent') || '').slice(0, 200),
      request.headers.get('CF-Connecting-IP') || ''
    ).run();

    // Redirect with session cookie
    const redir = getOAuthRedirect(request);
    const headers = new Headers({ Location: `${SITE_URL}${redir}${redir.includes("?") ? "&" : "?"}auth_success=1` });
    headers.append('Set-Cookie', setSessionCookie(sessionId));
    headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    return new Response(null, { status: 302, headers });
  } catch (err) {
    console.error('Facebook OAuth error:', err);
    return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302);
  }
}

async function upsertUser(db, { email, name, avatar, provider, providerId }) {
  const existing = await db.prepare(
    'SELECT id FROM users WHERE provider = ? AND provider_id = ?'
  ).bind(provider, providerId).first();
  if (existing) {
    await db.prepare(
      "UPDATE users SET name = ?, avatar = ?, email = ?, last_login_at = datetime('now') WHERE id = ?"
    ).bind(name, avatar, email, existing.id).run();
    return existing.id;
  }
  const id = nanoid();
  await db.prepare(
    'INSERT INTO users (id, email, name, avatar, provider, provider_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, email, name, avatar, provider, providerId, 'member').run();
  return id;
}

async function getCurrentUser(request, env) {
  const sessionId = getSessionFromCookie(request);
  if (!sessionId) return null;
  return await env.AUTH_DB.prepare(`
    SELECT u.id, u.email, u.name, u.avatar, u.provider, u.role, u.created_at, s.expires_at
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
}

async function handleAuthMe(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ authenticated: false }, 200, request);
  return jsonResponse({
    authenticated: true,
    user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, provider: user.provider, role: user.role, created_at: user.created_at },
  }, 200, request);
}

async function handleLogout(request, env) {
  const sessionId = getSessionFromCookie(request);
  if (sessionId) {
    await env.AUTH_DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  }
  const headers = new Headers({ 'Content-Type': 'application/json', ...corsHeaders(request) });
  headers.append('Set-Cookie', clearSessionCookie());
  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
}

async function handleAdminMembers(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = parseInt(url.searchParams.get('offset') || '0');
  const { results } = await env.AUTH_DB.prepare(
    'SELECT id, email, name, avatar, provider, role, created_at, last_login_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).bind(limit, offset).all();
  const countRow = await env.AUTH_DB.prepare('SELECT COUNT(*) as total FROM users').first();
  return jsonResponse({ members: results, total: countRow.total, limit, offset }, 200, request);
}

// === Invite Code Admin CRUD ===
async function handleAdminGetCodes(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  try {
    const raw = await env.TICKER_KV.get('invite_codes');
    const codes = raw ? JSON.parse(raw) : {};
    const list = Object.entries(codes).map(([code, info]) => ({ code, ...info }));
    return jsonResponse({ codes: list, total: list.length }, 200, request);
  } catch (e) {
    return jsonResponse({ error: 'Failed to read codes: ' + e.message }, 500, request);
  }
}

async function handleAdminCreateCode(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  let body;
  try { body = await request.json(); } catch (e) {
    return jsonResponse({ error: 'Invalid JSON' }, 400, request);
  }
  const { code, name, role } = body;
  if (!code || !name) return jsonResponse({ error: 'code and name are required' }, 400, request);
  const codeKey = code.trim().toLowerCase();
  if (codeKey.length < 2 || codeKey.length > 32) return jsonResponse({ error: 'code must be 2-32 characters' }, 400, request);
  const validRole = (role === 'admin') ? 'admin' : 'user';
  try {
    const raw = await env.TICKER_KV.get('invite_codes');
    const codes = raw ? JSON.parse(raw) : {};
    const isNew = !codes[codeKey];
    codes[codeKey] = { name: name.trim(), role: validRole };
    await env.TICKER_KV.put('invite_codes', JSON.stringify(codes));
    return jsonResponse({ success: true, action: isNew ? 'created' : 'updated', code: codeKey, name: name.trim(), role: validRole }, 200, request);
  } catch (e) {
    return jsonResponse({ error: 'Failed to save code: ' + e.message }, 500, request);
  }
}

async function handleAdminDeleteCode(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  const url = new URL(request.url);
  const codeKey = (url.searchParams.get('code') || '').trim().toLowerCase();
  if (!codeKey) return jsonResponse({ error: 'code parameter required' }, 400, request);
  try {
    const raw = await env.TICKER_KV.get('invite_codes');
    const codes = raw ? JSON.parse(raw) : {};
    if (!codes[codeKey]) return jsonResponse({ error: 'Code not found' }, 404, request);
    delete codes[codeKey];
    await env.TICKER_KV.put('invite_codes', JSON.stringify(codes));
    return jsonResponse({ success: true, deleted: codeKey }, 200, request);
  } catch (e) {
    return jsonResponse({ error: 'Failed to delete code: ' + e.message }, 500, request);
  }
}

// ============================================================

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  // Health check
  if (path === '/health') {
    const tokenJson = await env.TICKER_KV.get('fitbit_token');
    const hasToken = !!tokenJson;
    let tokenOk = false;
    if (hasToken) {
      const t = JSON.parse(tokenJson);
      tokenOk = t.expires_at > Date.now();
    }
    const stockCache = await env.TICKER_KV.get('stock_cache');
    const stockAge = stockCache ? Math.round((Date.now() - JSON.parse(stockCache).cached_at) / 1000) : null;

    return jsonResponse({
      status: 'ok',
      fitbit_token: hasToken ? (tokenOk ? 'valid' : 'expired') : 'missing',
      stock_cache_age_sec: stockAge,
      tse_trading: isTseTradingHours(),
      timestamp: new Date().toISOString(),
    }, 200, request);
  }

  // Fitbit data
  if (path === '/fitbit') {
    try {
      const data = await fetchFitbitData(env.TICKER_KV);
      return jsonResponse(data, 200, request);
    } catch (e) {
      return jsonResponse({
        error: e.message,
        hint: e.message.includes('No Fitbit token') 
          ? 'Run: wrangler kv key put --binding TICKER_KV fitbit_token \'{"access_token":"...","refresh_token":"...","expires_at":...}\''
          : 'Check worker logs',
      }, 500, request);
    }
  }

  // Sleep data (analysis)
  if (path === '/sleep') {
    try {
      const params = {
        year: url.searchParams.get('year'),
        month: url.searchParams.get('month'),
      };
      const data = await fetchSleepData(env.TICKER_KV, params);
      return jsonResponse(data, 200, request);
    } catch (e) {
      return jsonResponse({
        error: e.message,
        usage: '/sleep?year=2025 or /sleep?month=2025-03',
      }, e.message.includes('Missing parameter') ? 400 : 500, request);
    }
  }

  // Stock data
  if (path === '/stock') {
    try {
      const data = await fetchStockData(env.TICKER_KV);
      return jsonResponse(data, 200, request);
    } catch (e) {
      return jsonResponse({ error: e.message }, 500, request);
    }
  }


  // Translate (legacy Web Speech API)
  if (path === '/translate') {
    return handleTranslate(request, env);
  }

  // STT + Translate (Whisper + Claude Haiku)
  if (path === '/stt') {
    return handleSTT(request, env);
  }

  // Streaming translation (SSE)
  if (path === '/translate-stream') {
    return handleTranslateStream(request, env);
  }

  // Meeting summary
  if (path === '/summarize') {
    return handleSummarize(request, env);
  }

  // Cost tracking
  if (path === '/costs') {
    return handleCosts(request, env);
  }


  // Usage statistics (admin only)
  if (path === '/usage') {
    return handleUsage(request, env);
  }

  // Deepgram token for streaming STT
  // /deepgram-token removed — auth handled by /ws/stt proxy

  // Log external costs (e.g. Deepgram streaming billed client-side)
  if (path === '/log-cost') {
    return handleLogCost(request, env);
  }

  // === WebSocket proxy to Qwen3-ASR (edge -> DashScope, protocol translation) ===
  if (path === '/ws/stt-qwen') {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return jsonResponse({ error: 'WebSocket upgrade required' }, 426, request);
    }
    const wsCode = url.searchParams.get('code') || '';
    const wsAuth = await authenticateRequest(request, env, wsCode);
    if (!wsAuth) {
      return jsonResponse({ error: 'Authentication required' }, 403, request);
    }
    const dashscopeKey = env.DASHSCOPE_API_KEY;
    if (!dashscopeKey) {
      return jsonResponse({ error: 'DashScope not configured' }, 500, request);
    }
    const qwenLang = url.searchParams.get('language') || 'zh';

    // Create WebSocket pair for frontend connection
    const pair = new WebSocketPair();
    const [clientWs, serverWs] = Object.values(pair);

    // Connect upstream to DashScope Realtime API
    const dashscopeUrl = 'wss://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=qwen3-asr-flash-realtime';
    let upstreamResp;
    try {
      upstreamResp = await fetch(dashscopeUrl, {
        headers: {
          'Upgrade': 'websocket',
          'Authorization': 'Bearer ' + dashscopeKey,
          'OpenAI-Beta': 'realtime=v1',
        },
      });
    } catch (e) {
      return jsonResponse({ error: 'Failed to connect to DashScope: ' + e.message }, 502, request);
    }
    const upstream = upstreamResp.webSocket;
    if (!upstream) {
      return jsonResponse({ error: 'DashScope WebSocket upgrade failed' }, 502, request);
    }

    serverWs.accept();
    upstream.accept();

    // Send session.update to DashScope
    upstream.send(JSON.stringify({
      event_id: 'init_' + Date.now(),
      type: 'session.update',
      session: {
        modalities: ['text'],
        input_audio_format: 'pcm',
        sample_rate: 16000,
        input_audio_transcription: { language: qwenLang },
        turn_detection: { type: 'server_vad', threshold: 0.0, silence_duration_ms: 400 },
      },
    }));

    // Helper: ArrayBuffer to base64
    function ab2b64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(binary);
    }

    // Frontend -> DashScope: binary PCM16 -> base64 JSON
    serverWs.addEventListener('message', (event) => {
      try {
        if (event.data instanceof ArrayBuffer) {
          upstream.send(JSON.stringify({
            event_id: 'a_' + Date.now(),
            type: 'input_audio_buffer.append',
            audio: ab2b64(event.data),
          }));
        } else if (typeof event.data === 'string') {
          const msg = JSON.parse(event.data);
          if (msg.type === 'CloseStream') {
            upstream.send(JSON.stringify({ event_id: 'fin_' + Date.now(), type: 'session.finish' }));
          }
        }
      } catch (e) { console.error('[qwen-ws] fwd error:', e.message); }
    });

    // DashScope -> Frontend: transform to Deepgram-compatible format
    upstream.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'conversation.item.input_audio_transcription.text': {
            const text = data.text || data.stash || '';
            if (!text) break;
            serverWs.send(JSON.stringify({
              type: 'Results', is_final: false, speech_final: false,
              channel: { alternatives: [{ transcript: text, detected_language: qwenLang }] },
            }));
            break;
          }
          case 'conversation.item.input_audio_transcription.completed': {
            const transcript = data.transcript || '';
            if (!transcript) break;
            serverWs.send(JSON.stringify({
              type: 'Results', is_final: true, speech_final: true,
              channel: { alternatives: [{ transcript: transcript, detected_language: qwenLang }] },
            }));
            serverWs.send(JSON.stringify({ type: 'UtteranceEnd' }));
            break;
          }
          case 'session.finished':
            try { serverWs.close(1000, 'Session finished'); } catch (e) {}
            break;
          case 'error':
            console.error('[qwen-ws] DashScope error:', JSON.stringify(data));
            serverWs.send(JSON.stringify({ type: 'error', message: (data.error && data.error.message) || 'DashScope error' }));
            break;
        }
      } catch (e) { console.error('[qwen-ws] parse error:', e.message); }
    });

    serverWs.addEventListener('close', () => {
      try { upstream.send(JSON.stringify({ event_id: 'close_' + Date.now(), type: 'session.finish' })); } catch (e) {}
      try { upstream.close(); } catch (e) {}
    });
    upstream.addEventListener('close', () => { try { serverWs.close(1000, 'Upstream closed'); } catch (e) {} });
    upstream.addEventListener('error', () => { try { serverWs.close(1011, 'Upstream error'); } catch (e) {} });

    return new Response(null, { status: 101, webSocket: clientWs });
  }

  // WebSocket proxy to Deepgram (edge → Deepgram, much faster than client direct)
  if (path === '/ws/stt') {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return jsonResponse({ error: 'WebSocket upgrade required' }, 426, request);
    }
    // Auth: code passed as query param
    const wsCode = url.searchParams.get('code') || '';
    const wsAuth = await authenticateRequest(request, env, wsCode);
    if (!wsAuth) {
      return jsonResponse({ error: 'Authentication required' }, 403, request);
    }
    const dgKey = env.DEEPGRAM_API_KEY;
    if (!dgKey) {
      return jsonResponse({ error: 'Deepgram not configured' }, 500, request);
    }
    // Build upstream Deepgram URL with all query params except 'code'
    const dgParams = new URLSearchParams(url.searchParams);
    dgParams.delete('code');
    const dgUrl = 'https://api.deepgram.com/v1/listen?' + dgParams.toString();
    // Proxy: fetch with Upgrade header → Cloudflare auto-pipes the WebSocket
    return fetch(dgUrl, {
      headers: {
        'Upgrade': 'websocket',
        'Authorization': 'Token ' + dgKey,
      },
    });
  }

  // Invite code validation
  if (path === '/validate-code') {
    return handleValidateCode(request, env);
  }

  // === Public Ticker (combined live data) ===
  if (path === '/ticker' && request.method === 'GET') {
    return handleTicker(request, env);
  }

  // === Social Feed ===
  if (path === '/feed' && request.method === 'GET') {
    return handleFeedGet(request, env);
  }
  if (path === '/feed/push' && request.method === 'POST') {
    return handleFeedPush(request, env);
  }

  // Auth routes
  if (path === '/auth/google/login' && request.method === 'GET') {
    return handleGoogleLogin(request);
  }
  if (path === '/auth/google/callback' && request.method === 'GET') {
    return handleGoogleCallback(request, env);
  }
  if (path === '/auth/line/login' && request.method === 'GET') {
    return handleLineLogin(request);
  }
  if (path === '/auth/line/callback' && request.method === 'GET') {
    return handleLineCallback(request, env);
  }
  if (path === '/auth/facebook/login' && request.method === 'GET') {
    return handleFacebookLogin(request);
  }
  if (path === '/auth/facebook/callback' && request.method === 'GET') {
    return handleFacebookCallback(request, env);
  }
  if (path === '/auth/me' && request.method === 'GET') {
    return handleAuthMe(request, env);
  }
  if (path === '/auth/logout' && request.method === 'POST') {
    return handleLogout(request, env);
  }
  if (path === '/auth/admin/members' && request.method === 'GET') {
    return handleAdminMembers(request, env);
  }
  if (path === '/auth/admin/codes' && request.method === 'GET') {
    return handleAdminGetCodes(request, env);
  }
  if (path === '/auth/admin/codes' && request.method === 'POST') {
    return handleAdminCreateCode(request, env);
  }
  if (path === '/auth/admin/codes' && request.method === 'DELETE') {
    return handleAdminDeleteCode(request, env);
  }

  // 404
  return jsonResponse({ error: 'Not found', endpoints: ['/ticker', '/ws/stt-qwen', '/fitbit', '/stock', '/sleep', '/translate', '/translate-stream', '/stt', '/summarize', '/costs', '/usage', '/validate-code', '/log-cost', '/feed', '/health', '/auth/google/login', '/auth/line/login', '/auth/facebook/login', '/auth/me', '/auth/logout', '/auth/admin/members', '/auth/admin/codes'] }, 404, request);
}

// === Cron Trigger (token refresh) ===
async function handleScheduled(event, env) {
  try {
    await refreshToken(env.TICKER_KV);
    console.log('Cron: token refresh success');
  } catch (e) {
    console.error('Cron: token refresh FAILED:', e.message);
  }
}

// === Export ===
export default {
  fetch: async (request, env, ctx) => {
    const response = await handleRequest(request, env);
    // Flush cost buffer after response if batch is large enough
    if (costBuffer.length >= 10) {
      ctx.waitUntil(flushCosts(env.TICKER_KV));
    }
    return response;
  },
  scheduled: handleScheduled,
};
