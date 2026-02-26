/**
 * paulkuo-ticker Worker
 * 
 * 即時資料 API：Fitbit 步數 + 健康數據
 * 取代原本的 cron → git commit → build 架構
 * 
 * Endpoints:
 *   GET /fitbit  — 回傳即時 Fitbit 資料（5 分鐘快取）
 *   GET /health  — 健康檢查
 * 
 * Cron Trigger:
 *   每 6 小時 refresh Fitbit OAuth2 token
 * 
 * KV keys:
 *   fitbit_token — { access_token, refresh_token, expires_at }
 *   fitbit_cache — { data, cached_at }
 */

const FITBIT_CLIENT_ID = '23V2BH';
const FITBIT_CLIENT_SECRET = '4adac11e3241afadf53cccfaa7b7e86a';
const CACHE_TTL_SEC = 300; // 5 分鐘快取
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
    return jsonResponse({
      status: 'ok',
      fitbit_token: hasToken ? (tokenOk ? 'valid' : 'expired') : 'missing',
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

  // 404
  return jsonResponse({ error: 'Not found', endpoints: ['/fitbit', '/health'] }, 404, request);
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
