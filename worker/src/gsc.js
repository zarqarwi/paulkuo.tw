/**
 * Google Search Console API integration
 * Service Account JWT auth → GSC Search Analytics + Sitemaps API
 * Data stored in TICKER_KV with 24hr refresh throttle
 */

const SITE_URL = 'https://paulkuo.tw';

// ── JWT / Auth ──────────────────────────────────────────────

async function getGscAccessToken(env) {
  const key = JSON.parse(env.GSC_SERVICE_ACCOUNT_KEY);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const jwt = await signJwt(header, payload, key.private_key);

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await resp.json();
  if (!data.access_token) throw new Error(`GSC auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function signJwt(header, payload, privateKeyPem) {
  const pemBody = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const keyData = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  );

  const enc = new TextEncoder();
  const b64url = s => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const sigInput = `${headerB64}.${payloadB64}`;

  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, enc.encode(sigInput));
  const sigB64 = b64url(String.fromCharCode(...new Uint8Array(sig)));

  return `${sigInput}.${sigB64}`;
}

// ── GSC API calls ───────────────────────────────────────────

async function querySearchAnalytics(token, body) {
  const resp = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  return resp.json();
}

async function fetchSearchAnalytics(token) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);
  const fmt = d => d.toISOString().split('T')[0];

  const [overall, queries, pages] = await Promise.all([
    querySearchAnalytics(token, { startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['date'], rowLimit: 28 }),
    querySearchAnalytics(token, { startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['query'], rowLimit: 10 }),
    querySearchAnalytics(token, { startDate: fmt(startDate), endDate: fmt(endDate), dimensions: ['page'], rowLimit: 10 }),
  ]);

  return { overall, queries, pages };
}

async function fetchIndexStatus(token) {
  const resp = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return resp.json();
}

// ── Main: fetch + store in KV ───────────────────────────────

export async function fetchGscData(env) {
  const token = await getGscAccessToken(env);

  const [search, sitemaps] = await Promise.all([
    fetchSearchAnalytics(token),
    fetchIndexStatus(token),
  ]);

  // Aggregate overall metrics
  const rows = search.overall.rows || [];
  const totals = rows.reduce((acc, r) => ({
    clicks: acc.clicks + r.clicks,
    impressions: acc.impressions + r.impressions,
  }), { clicks: 0, impressions: 0 });

  const avgCtr = totals.impressions > 0 ? totals.clicks / totals.impressions : 0;
  const avgPosition = rows.length > 0
    ? rows.reduce((sum, r) => sum + r.position, 0) / rows.length
    : 0;

  const dailyClicks = rows.map(r => ({
    date: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
  }));

  const topQueries = (search.queries.rows || []).map(r => ({
    query: r.keys[0],
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  const topPages = (search.pages.rows || []).map(r => ({
    page: r.keys[0].replace(SITE_URL, ''),
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }));

  const indexInfo = {
    sitemaps: (sitemaps.sitemap || []).map(s => ({
      path: s.path,
      submitted: s.contents?.[0]?.submitted || 0,
      indexed: s.contents?.[0]?.indexed || 0,
    })),
  };

  const ttl = 86400 * 2;

  await Promise.all([
    env.TICKER_KV.put('gsc:search_analytics', JSON.stringify({
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr: avgCtr,
      avgPosition: Math.round(avgPosition * 10) / 10,
      dailyClicks,
      period: '28d',
      fetchedAt: new Date().toISOString(),
    }), { expirationTtl: ttl }),
    env.TICKER_KV.put('gsc:top_queries', JSON.stringify(topQueries), { expirationTtl: ttl }),
    env.TICKER_KV.put('gsc:top_pages', JSON.stringify(topPages), { expirationTtl: ttl }),
    env.TICKER_KV.put('gsc:index_status', JSON.stringify(indexInfo), { expirationTtl: ttl }),
    env.TICKER_KV.put('gsc:lastFetch', String(Date.now())),
  ]);

  console.log(`[GSC] Fetched: ${totals.clicks} clicks, ${totals.impressions} impressions, ${topQueries.length} queries`);
  return { success: true, clicks: totals.clicks };
}

// ── API endpoint: GET /gsc ──────────────────────────────────

export async function handleGsc(request, env) {
  const [analytics, queries, pages, index] = await Promise.all([
    env.TICKER_KV.get('gsc:search_analytics', 'json'),
    env.TICKER_KV.get('gsc:top_queries', 'json'),
    env.TICKER_KV.get('gsc:top_pages', 'json'),
    env.TICKER_KV.get('gsc:index_status', 'json'),
  ]);

  return new Response(JSON.stringify({
    analytics: analytics || null,
    topQueries: queries || [],
    topPages: pages || [],
    indexStatus: index || null,
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
