/**
 * paulkuo-ticker Worker
 * 
 * 即時資料 API：Fitbit 步數 + CyberSolutions 股價
 * 取代原本的 cron → git commit → build 架構
 * 
 * Endpoints:
 *   GET /fitbit  — 回傳即時 Fitbit 資料（5 分鐘快取）
 *   GET /stock   — 回傳 CyberSolutions (436A.T) 即時股價（交易時段 10 分鐘 / 非交易 1 小時快取）
 *   GET /health  — 健康檢查
 *   GET /sleep   — 睡眠資料分析（?year=2025 或 ?start=...&end=...）
 * 
 * Cron Trigger:
 *   每 6 小時 refresh Fitbit OAuth2 token
 * 
 * KV keys:
 *   fitbit_token — { access_token, refresh_token, expires_at }
 *   fitbit_cache — { data, cached_at }
 *   stock_cache  — { data, cached_at }
 */

const FITBIT_CLIENT_ID = '23V2BH';
const FITBIT_CLIENT_SECRET = '4adac11e3241afadf53cccfaa7b7e86a';
const CACHE_TTL_SEC = 300; // 5 分鐘快取（Fitbit）
const STOCK_SYMBOL = '436A.T';
const STOCK_NAME = 'CyberSolutions';
const STOCK_CACHE_TRADING = 600;  // 交易時段 10 分鐘
const STOCK_CACHE_CLOSED = 3600;  // 非交易時段 1 小時
const ALLOWED_ORIGINS = [
  'https://paulkuo.tw',
  'http://localhost:4321', // Astro dev
  'http://localhost:3000',
];

// === CORS ===
function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.find(o => origin.startsWith(o)) || ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
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

  const creds = btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`);
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


// === Fetch Sleep Data (for analysis) ===
async function fetchSleepData(kv, params) {
  let tokenJson = await kv.get('fitbit_token');
  if (!tokenJson) throw new Error('No Fitbit token configured');
  let token = JSON.parse(tokenJson);

  if (token.expires_at - Date.now() < 2 * 3600 * 1000) {
    try { token = await refreshToken(kv); } catch (e) {
      console.error('Proactive refresh failed:', e.message);
    }
  }

  const year = params.get('year');
  let startDate, endDate;
  if (year) {
    startDate = year + '-01-01';
    endDate = year + '-12-31';
  } else {
    startDate = params.get('start');
    endDate = params.get('end');
  }
  if (!startDate || !endDate) {
    throw new Error('Provide ?year=2025 or ?start=YYYY-MM-DD&end=YYYY-MM-DD');
  }

  const cacheKey = 'sleep_cache_' + startDate + '_' + endDate;
  const cacheJson = await kv.get(cacheKey);
  if (cacheJson) {
    const cache = JSON.parse(cacheJson);
    if (Date.now() - cache.cached_at < 3600 * 1000) {
      return { ...cache.data, _cached: true };
    }
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const chunks = [];
  let cur = new Date(start);
  while (cur <= end) {
    const chunkEnd = new Date(Math.min(cur.getTime() + 99 * 86400000, end.getTime()));
    chunks.push([cur.toISOString().slice(0, 10), chunkEnd.toISOString().slice(0, 10)]);
    cur = new Date(chunkEnd.getTime() + 86400000);
  }

  let allSleep = [];
  for (const [s, e] of chunks) {
    try {
      const data = await fitbitGet('/1.2/user/-/sleep/date/' + s + '/' + e + '.json', token);
      if (data.sleep) allSleep = allSleep.concat(data.sleep);
    } catch (err) {
      if (err.message === 'TOKEN_EXPIRED') {
        token = await refreshToken(kv);
        const data = await fitbitGet('/1.2/user/-/sleep/date/' + s + '/' + e + '.json', token);
        if (data.sleep) allSleep = allSleep.concat(data.sleep);
      } else {
        console.error('Sleep fetch error for ' + s + '-' + e + ':', err.message);
      }
    }
  }

  const monthly = {};
  for (const s of allSleep) {
    if (!s.isMainSleep) continue;
    const month = s.dateOfSleep ? s.dateOfSleep.slice(0, 7) : null;
    if (!month) continue;
    if (!monthly[month]) {
      monthly[month] = { month: month, nights: 0, total_minutes: 0, deep_min: 0, light_min: 0, rem_min: 0, wake_min: 0, scores: [] };
    }
    const m = monthly[month];
    m.nights++;
    m.total_minutes += s.duration ? Math.round(s.duration / 60000) : 0;
    const stages = (s.levels && s.levels.summary) || {};
    m.deep_min += (stages.deep && stages.deep.minutes) || 0;
    m.light_min += (stages.light && stages.light.minutes) || 0;
    m.rem_min += (stages.rem && stages.rem.minutes) || 0;
    m.wake_min += (stages.wake && stages.wake.minutes) || 0;
    if (s.efficiency) m.scores.push(s.efficiency);
  }

  const summary = Object.values(monthly).map(function(m) {
    return {
      month: m.month,
      nights: m.nights,
      avg_hours: Math.round(m.total_minutes / m.nights / 60 * 10) / 10,
      avg_deep_min: Math.round(m.deep_min / m.nights),
      avg_light_min: Math.round(m.light_min / m.nights),
      avg_rem_min: Math.round(m.rem_min / m.nights),
      avg_wake_min: Math.round(m.wake_min / m.nights),
      avg_efficiency: m.scores.length ? Math.round(m.scores.reduce(function(a, b) { return a + b; }, 0) / m.scores.length) : null,
    };
  }).sort(function(a, b) { return a.month.localeCompare(b.month); });

  const data = {
    updated: new Date().toISOString(),
    source: 'cloudflare-worker',
    range: { start: startDate, end: endDate },
    total_nights: allSleep.filter(function(s) { return s.isMainSleep; }).length,
    monthly: summary,
    raw_count: allSleep.length,
  };

  await kv.put(cacheKey, JSON.stringify({ data: data, cached_at: Date.now() }));
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

// === Request Handler ===
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


  // Sleep data (for analysis)
  if (path === '/sleep') {
    try {
      const data = await fetchSleepData(env.TICKER_KV, url.searchParams);
      return jsonResponse(data, 200, request);
    } catch (e) {
      return jsonResponse({
        error: e.message,
        usage: '/sleep?year=2025 or /sleep?start=2025-01-01&end=2025-06-30',
      }, e.message.includes('Provide') ? 400 : 500, request);
    }
  }

  // 404
  return jsonResponse({ error: 'Not found', endpoints: ['/fitbit', '/stock', '/sleep', '/health'] }, 404, request);
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
  fetch: handleRequest,
  scheduled: handleScheduled,
};
