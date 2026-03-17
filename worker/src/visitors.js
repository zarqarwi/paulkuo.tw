// worker/src/visitors.js
// 每日訪客數：Cloudflare GraphQL Analytics API → KV

const CF_GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

/**
 * 從 Cloudflare Analytics 撈昨天的 unique visitors
 * 寫入 KV key: site_visitors
 */
export async function fetchDailyVisitors(env) {
  const token = env.CF_ANALYTICS_TOKEN;
  const zoneId = env.CF_ZONE_ID;
  if (!token || !zoneId) {
    console.error('visitors: missing CF_ANALYTICS_TOKEN or CF_ZONE_ID');
    return null;
  }

  // 昨天的日期（UTC）
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const dateStr = yesterday.toISOString().split('T')[0];

  const query = `
    query GetUniqueVisitors($zoneTag: string!, $date: string!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(filter: { date: $date }, limit: 1) {
            uniq {
              uniques
            }
            sum {
              pageViews
              requests
            }
          }
        }
      }
    }
  `;

  const resp = await fetch(CF_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { zoneTag: zoneId, date: dateStr },
    }),
  });

  if (!resp.ok) {
    console.error('visitors: GraphQL API error', resp.status);
    return null;
  }

  const json = await resp.json();
  const groups = json?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!groups || groups.length === 0) {
    console.log('visitors: no data for', dateStr);
    return null;
  }

  const data = {
    date: dateStr,
    uniqueVisitors: groups[0].uniq.uniques,
    pageViews: groups[0].sum.pageViews,
    requests: groups[0].sum.requests,
    updatedAt: new Date().toISOString(),
  };

  // 寫入 KV
  await env.TICKER_KV.put('site_visitors', JSON.stringify(data));
  console.log(`visitors: ${dateStr} → ${data.uniqueVisitors} unique visitors`);
  return data;
}

/**
 * 從 Cloudflare Web Analytics (RUM) 撈過去 30 天的流量概覽 + 國家分佈
 * 資料來源：rumPageloadEventsAdaptiveGroups（beacon-based，過濾 bot，比 Zone Analytics 精準）
 * 寫入 KV keys: analytics:overview, analytics:countries
 * 節流：analytics:lastFetch 記錄上次時間，間隔 < 6hr skip
 */
export async function fetchAnalyticsOverview(env, { force = false } = {}) {
  const token = env.CF_ANALYTICS_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  const siteTag = env.CF_WEB_ANALYTICS_SITE_TAG;
  if (!token || !accountId || !siteTag) {
    console.error('analytics: missing CF_ANALYTICS_TOKEN, CF_ACCOUNT_ID, or CF_WEB_ANALYTICS_SITE_TAG');
    return null;
  }

  // 節流：6 小時內不重複查（force 時跳過）
  if (!force) {
    const lastFetch = await env.TICKER_KV.get('analytics:lastFetch');
    if (lastFetch) {
      const elapsed = Date.now() - new Date(lastFetch).getTime();
      if (elapsed < 6 * 3600 * 1000) {
        console.log(`analytics: skip, last fetch ${Math.round(elapsed / 60000)}min ago`);
        return null;
      }
    }
  }

  // 31 天前的日期
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 31);
  const sinceStr = since.toISOString().split('T')[0];

  // Web Analytics: 每日瀏覽量 + 訪客數
  const dailyQuery = `
    query WebAnalyticsDaily($accountTag: string!, $siteTag: string!, $since: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            filter: { siteTag: $siteTag, date_gt: $since }
            limit: 31
            orderBy: [date_ASC]
          ) {
            count
            sum { visits }
            dimensions { date }
          }
        }
      }
    }
  `;

  // Web Analytics: 國家分佈
  const countryQuery = `
    query WebAnalyticsCountries($accountTag: string!, $siteTag: string!, $since: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            filter: { siteTag: $siteTag, date_gt: $since }
            limit: 50
            orderBy: [count_DESC]
          ) {
            count
            dimensions { countryName }
          }
        }
      }
    }
  `;

  const variables = { accountTag: accountId, siteTag, since: sinceStr };
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [dailyResp, countryResp] = await Promise.all([
    fetch(CF_GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query: dailyQuery, variables }) }),
    fetch(CF_GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query: countryQuery, variables }) }),
  ]);

  if (!dailyResp.ok || !countryResp.ok) {
    console.error('analytics: GraphQL API error', dailyResp.status, countryResp.status);
    return null;
  }

  const [dailyJson, countryJson] = await Promise.all([dailyResp.json(), countryResp.json()]);

  for (const j of [dailyJson, countryJson]) {
    if (j.errors) {
      console.error('analytics: GraphQL errors', JSON.stringify(j.errors));
      return null;
    }
  }

  // 每日數據
  const dailyGroups = dailyJson?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (!dailyGroups || dailyGroups.length === 0) {
    console.log('analytics: no data');
    return null;
  }

  const daily = dailyGroups
    .map(g => ({
      date: g.dimensions.date,
      visits: g.sum.visits,
      pageViews: g.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 1d / 7d / 30d 加總
  const sumFn = (arr) => arr.reduce((acc, d) => ({
    visits: acc.visits + d.visits,
    pageViews: acc.pageViews + d.pageViews,
  }), { visits: 0, pageViews: 0 });

  const total30d = sumFn(daily);
  const total7d = sumFn(daily.slice(-7));
  const total1d = sumFn(daily.slice(-1));

  // 國家分佈
  const countryGroups = countryJson?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
  const totalCountryCount = countryGroups.reduce((s, g) => s + g.count, 0);
  const top15 = countryGroups
    .slice(0, 15)
    .map(g => ({
      country: g.dimensions.countryName,
      count: g.count,
      percent: totalCountryCount > 0 ? +(g.count / totalCountryCount * 100).toFixed(1) : 0,
    }));

  const updatedAt = new Date().toISOString();

  // 寫入 KV
  await Promise.all([
    env.TICKER_KV.put('analytics:overview', JSON.stringify({ daily, total1d, total7d, total30d })),
    env.TICKER_KV.put('analytics:countries', JSON.stringify({ top15 })),
    env.TICKER_KV.put('analytics:lastFetch', updatedAt),
  ]);

  console.log(`analytics: updated (Web Analytics), ${daily.length} days, ${top15.length} countries`);
  return { overview: { daily, total1d, total7d, total30d }, countries: { top15 }, updatedAt };
}

// ── RUM Analytics (account-level) ──

const SEARCH_EXACT = ['bing.com','yahoo.com','search.yahoo.com','duckduckgo.com','baidu.com','yandex.com','ecosia.org'];
const SOCIAL_HOSTS = ['twitter.com','x.com','t.co','facebook.com','l.facebook.com','lm.facebook.com','m.facebook.com','threads.net','l.threads.com','linkedin.com','reddit.com'];
const INTERNAL_HOST = 'paulkuo.tw';

function isGoogle(h) {
  // google.com, google.co.jp, google.com.hk, google.de, etc.
  // but NOT accounts.google.com (那是 OAuth 回跳)
  if (h.startsWith('accounts.google')) return false;
  return h === 'google.com' || /\.google\./.test(h) || /^google\.[a-z]/.test(h);
}

function classifyReferer(host) {
  if (!host || host === '') return 'direct';
  const h = host.toLowerCase().replace(/^www\./, '');
  if (h === INTERNAL_HOST) return 'internal';
  if (isGoogle(h)) return 'search';
  if (SEARCH_EXACT.some(s => h === s || h === 'www.' + s)) return 'search';
  if (SOCIAL_HOSTS.some(s => h === s || h === 'www.' + s)) return 'social';
  return 'other';
}

/**
 * 從 Cloudflare RUM Analytics (account-level) 撈 30 天數據
 * 寫入 KV: analytics:referers, analytics:top-pages, analytics:devices
 * 節流：共用 analytics:lastFetch
 */
export async function fetchRumAnalytics(env) {
  const token = env.CF_ANALYTICS_TOKEN;
  const accountId = env.CF_ACCOUNT_ID;
  if (!token || !accountId) {
    console.error('rum: missing CF_ANALYTICS_TOKEN or CF_ACCOUNT_ID');
    return null;
  }

  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 31);
  const sinceStr = since.toISOString().split('T')[0];

  // Query 1: referers
  const refererQuery = `
    query RumReferers($accountTag: string!, $since: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 200,
            filter: { date_gt: $since },
            orderBy: [count_DESC]
          ) {
            dimensions { refererHost }
            count
          }
        }
      }
    }
  `;

  // Query 2: top pages
  const pagesQuery = `
    query RumTopPages($accountTag: string!, $since: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 200,
            filter: { date_gt: $since },
            orderBy: [count_DESC]
          ) {
            dimensions { requestPath }
            count
          }
        }
      }
    }
  `;

  // Query 3: devices
  const devicesQuery = `
    query RumDevices($accountTag: string!, $since: string!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            limit: 10,
            filter: { date_gt: $since },
            orderBy: [count_DESC]
          ) {
            dimensions { deviceType }
            count
          }
        }
      }
    }
  `;

  const variables = { accountTag: accountId, since: sinceStr };
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [refResp, pageResp, devResp] = await Promise.all([
    fetch(CF_GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query: refererQuery, variables }) }),
    fetch(CF_GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query: pagesQuery, variables }) }),
    fetch(CF_GRAPHQL_ENDPOINT, { method: 'POST', headers, body: JSON.stringify({ query: devicesQuery, variables }) }),
  ]);

  if (!refResp.ok || !pageResp.ok || !devResp.ok) {
    console.error('rum: GraphQL API error', refResp.status, pageResp.status, devResp.status);
    return null;
  }

  const [refJson, pageJson, devJson] = await Promise.all([refResp.json(), pageResp.json(), devResp.json()]);

  for (const j of [refJson, pageJson, devJson]) {
    if (j.errors) {
      console.error('rum: GraphQL errors', JSON.stringify(j.errors));
      return null;
    }
  }

  // ── Referers ──
  const refGroups = refJson?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
  const refAgg = {};
  for (const g of refGroups) {
    const host = g.dimensions.refererHost || '';
    const cat = classifyReferer(host);
    const key = cat === 'direct' ? '(direct)' : host;
    if (!refAgg[key]) refAgg[key] = { host: key, count: 0, category: cat };
    refAgg[key].count += g.count;
  }
  // Separate internal, compute totals excluding internal
  const allRefs = Object.values(refAgg);
  const externalRefs = allRefs.filter(r => r.category !== 'internal');
  const totalRefCount = externalRefs.reduce((s, r) => s + r.count, 0);
  const sources = externalRefs
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)
    .map(r => ({ host: r.host, count: r.count, percent: totalRefCount > 0 ? +(r.count / totalRefCount * 100).toFixed(1) : 0, category: r.category }));

  // ── Top Pages ──
  const pageGroups = pageJson?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
  const pageAgg = {};
  for (const g of pageGroups) {
    const path = g.dimensions.requestPath || '/';
    pageAgg[path] = (pageAgg[path] || 0) + g.count;
  }
  const totalPageCount = Object.values(pageAgg).reduce((s, v) => s + v, 0);
  const pages = Object.entries(pageAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([path, count]) => ({
      path,
      count,
      percent: totalPageCount > 0 ? +(count / totalPageCount * 100).toFixed(1) : 0,
      type: path.startsWith('/articles/') ? 'article' : path === '/' ? 'home' : 'other',
    }));

  // ── Devices ──
  const devGroups = devJson?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups || [];
  const devices = { desktop: 0, mobile: 0, tablet: 0, total: 0 };
  for (const g of devGroups) {
    const dt = (g.dimensions.deviceType || 'desktop').toLowerCase();
    if (dt === 'desktop') devices.desktop += g.count;
    else if (dt === 'mobile') devices.mobile += g.count;
    else if (dt === 'tablet') devices.tablet += g.count;
    devices.total += g.count;
  }

  // ── Write KV ──
  await Promise.all([
    env.TICKER_KV.put('analytics:referers', JSON.stringify({ sources })),
    env.TICKER_KV.put('analytics:top-pages', JSON.stringify({ pages })),
    env.TICKER_KV.put('analytics:devices', JSON.stringify(devices)),
  ]);

  console.log(`rum: updated, ${sources.length} referers, ${pages.length} pages, total=${devices.total}`);
  return { referers: { sources }, topPages: { pages }, devices };
}

/**
 * GET /analytics — 回傳 KV 裡的流量分析數據
 */
export async function handleAnalytics(request, env, corsHeadersFn) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === '1';

  // ?refresh=1 → 強制拉最新數據（跳過節流）
  if (refresh) {
    const [fresh, rum] = await Promise.all([
      fetchAnalyticsOverview(env, { force: true }),
      fetchRumAnalytics(env),
    ]);
    if (fresh) {
      const merged = { ...fresh, ...(rum || {}) };
      return new Response(JSON.stringify(merged), {
        headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) },
      });
    }
  }

  const [overviewRaw, countriesRaw, lastFetch, referersRaw, topPagesRaw, devicesRaw, durationRaw] = await Promise.all([
    env.TICKER_KV.get('analytics:overview'),
    env.TICKER_KV.get('analytics:countries'),
    env.TICKER_KV.get('analytics:lastFetch'),
    env.TICKER_KV.get('analytics:referers'),
    env.TICKER_KV.get('analytics:top-pages'),
    env.TICKER_KV.get('analytics:devices'),
    env.TICKER_KV.get('analytics:duration'),
  ]);

  if (!overviewRaw) {
    return new Response(JSON.stringify({ error: 'no analytics data yet' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) },
    });
  }

  const result = {
    overview: JSON.parse(overviewRaw),
    countries: JSON.parse(countriesRaw || '{"top15":[]}'),
    updatedAt: lastFetch || null,
    referers: JSON.parse(referersRaw || '{"sources":[]}'),
    topPages: JSON.parse(topPagesRaw || '{"pages":[]}'),
    devices: devicesRaw ? JSON.parse(devicesRaw) : null,
    duration: durationRaw ? JSON.parse(durationRaw) : null,
  };

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeadersFn(request),
    },
  });
}

// ── Duration Beacon (停留時間) ──

/**
 * POST /analytics/beacon — 接收前端停留時間回報
 * Body: { path: string, duration: number } (秒)
 * sendBeacon 的 Content-Type 可能是 text/plain，需要兼容處理
 */
export async function handleAnalyticsBeacon(request, env, corsHeadersFn) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: corsHeadersFn(request) });
  }

  let body;
  try {
    const text = await request.text();
    body = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers: corsHeadersFn(request) });
  }

  const { path, duration, hasInteraction } = body;

  // 驗證
  if (typeof path !== 'string' || !path.startsWith('/')) {
    return new Response(null, { status: 400, headers: corsHeadersFn(request) });
  }
  if (typeof duration !== 'number' || duration <= 1 || duration >= 1800) {
    return new Response(null, { status: 400, headers: corsHeadersFn(request) });
  }

  const key = `analytics:duration:${path}`;
  let data = { totalSeconds: 0, count: 0, bounceCount: 0, humanCount: 0 };
  try {
    const raw = await env.TICKER_KV.get(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      data = { totalSeconds: parsed.totalSeconds || 0, count: parsed.count || 0, bounceCount: parsed.bounceCount || 0, humanCount: parsed.humanCount || 0 };
    }
  } catch {}

  data.totalSeconds += Math.round(duration);
  data.count += 1;
  if (duration < 10) data.bounceCount += 1;
  if (hasInteraction === true) data.humanCount += 1;

  await env.TICKER_KV.put(key, JSON.stringify(data));

  return new Response(null, { status: 204, headers: corsHeadersFn(request) });
}

/**
 * Cron: 彙整停留時間 → analytics:duration (Top 15 排名)
 * List 所有 analytics:duration:* keys，算平均，存排名
 */
export async function fetchDurationAnalytics(env) {
  const prefix = 'analytics:duration:';
  const pages = [];
  let totalBounce = 0, totalCount = 0, totalHuman = 0;

  // KV list 用 prefix 過濾
  let cursor = undefined;
  let iterations = 0;
  do {
    const listResult = await env.TICKER_KV.list({ prefix, cursor, limit: 100 });
    for (const key of listResult.keys) {
      try {
        const raw = await env.TICKER_KV.get(key.name);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const { totalSeconds, count } = parsed;
        const bounceCount = parsed.bounceCount || 0;
        const humanCount = parsed.humanCount || 0;
        if (count > 0) {
          pages.push({
            path: key.name.slice(prefix.length),
            avgSeconds: Math.round(totalSeconds / count),
            views: count,
          });
          totalBounce += bounceCount;
          totalCount += count;
          totalHuman += humanCount;
        }
      } catch {}
    }
    cursor = listResult.list_complete ? undefined : listResult.cursor;
    iterations++;
  } while (cursor && iterations < 20);

  // Top 15 by avgSeconds (descending)
  pages.sort((a, b) => b.avgSeconds - a.avgSeconds);
  const top15 = pages.slice(0, 15);

  const bounceRate = totalCount > 0 ? Math.round(totalBounce / totalCount * 1000) / 10 : 0;

  await env.TICKER_KV.put('analytics:duration', JSON.stringify({
    pages: top15,
    bounceRate,
    totalBounce,
    totalCount,
    humanVisits: totalHuman,
    updatedAt: new Date().toISOString(),
  }));

  console.log(`duration: aggregated ${pages.length} paths, top15 saved, bounce=${bounceRate}%, human=${totalHuman}`);
  return { pages: top15, bounceRate, humanVisits: totalHuman };
}

/**
 * GET /visitors — 回傳 KV 裡的訪客數據
 */
export async function handleVisitors(request, env, corsHeadersFn) {
  const cached = await env.TICKER_KV.get('site_visitors');
  if (!cached) {
    return new Response(JSON.stringify({ error: 'no data yet' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) },
    });
  }
  return new Response(cached, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeadersFn(request),
    },
  });
}
