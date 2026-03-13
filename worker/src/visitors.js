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
 * 從 Cloudflare Analytics 撈過去 30 天的流量概覽 + 國家分佈
 * 寫入 KV keys: analytics:overview, analytics:countries
 * 節流：analytics:lastFetch 記錄上次時間，間隔 < 6hr skip
 */
export async function fetchAnalyticsOverview(env, { force = false } = {}) {
  const token = env.CF_ANALYTICS_TOKEN;
  const zoneId = env.CF_ZONE_ID;
  if (!token || !zoneId) {
    console.error('analytics: missing CF_ANALYTICS_TOKEN or CF_ZONE_ID');
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

  // 30 天前的日期
  const now = new Date();
  const since = new Date(now);
  since.setUTCDate(since.getUTCDate() - 31);
  const sinceStr = since.toISOString().split('T')[0];

  const query = `
    query GetAnalyticsOverview($zoneTag: string!, $since: string!) {
      viewer {
        zones(filter: { zoneTag: $zoneTag }) {
          httpRequests1dGroups(
            limit: 30,
            orderBy: [date_DESC],
            filter: { date_gt: $since }
          ) {
            dimensions { date }
            sum {
              requests
              pageViews
              countryMap { clientCountryName requests }
            }
            uniq { uniques }
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
      variables: { zoneTag: zoneId, since: sinceStr },
    }),
  });

  if (!resp.ok) {
    console.error('analytics: GraphQL API error', resp.status);
    return null;
  }

  const json = await resp.json();
  if (json.errors) {
    console.error('analytics: GraphQL errors', JSON.stringify(json.errors));
    return null;
  }

  const groups = json?.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
  if (!groups || groups.length === 0) {
    console.log('analytics: no data');
    return null;
  }

  // 按日期升序排列
  const daily = groups
    .map(g => ({
      date: g.dimensions.date,
      requests: g.sum.requests,
      pageViews: g.sum.pageViews,
      uniques: g.uniq.uniques,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 7 天 / 30 天加總
  const sum = (arr) => arr.reduce((acc, d) => ({
    requests: acc.requests + d.requests,
    pageViews: acc.pageViews + d.pageViews,
    uniques: acc.uniques + d.uniques,
  }), { requests: 0, pageViews: 0, uniques: 0 });

  const total30d = sum(daily);
  const total7d = sum(daily.slice(-7));

  // 國家分佈聚合
  const countryAgg = {};
  for (const g of groups) {
    for (const c of g.sum.countryMap) {
      countryAgg[c.clientCountryName] = (countryAgg[c.clientCountryName] || 0) + c.requests;
    }
  }
  const totalRequests = Object.values(countryAgg).reduce((a, b) => a + b, 0);
  const top15 = Object.entries(countryAgg)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([country, requests]) => ({
      country,
      requests,
      percent: totalRequests > 0 ? +(requests / totalRequests * 100).toFixed(1) : 0,
    }));

  const updatedAt = new Date().toISOString();

  // 寫入 KV
  await Promise.all([
    env.TICKER_KV.put('analytics:overview', JSON.stringify({ daily, total7d, total30d })),
    env.TICKER_KV.put('analytics:countries', JSON.stringify({ top15 })),
    env.TICKER_KV.put('analytics:lastFetch', updatedAt),
  ]);

  console.log(`analytics: updated, ${daily.length} days, ${top15.length} countries`);
  return { overview: { daily, total7d, total30d }, countries: { top15 }, updatedAt };
}

/**
 * GET /analytics — 回傳 KV 裡的流量分析數據
 */
export async function handleAnalytics(request, env, corsHeadersFn) {
  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === '1';

  // ?refresh=1 → 強制拉最新數據（跳過節流）
  if (refresh) {
    const fresh = await fetchAnalyticsOverview(env, { force: true });
    if (fresh) {
      return new Response(JSON.stringify(fresh), {
        headers: { 'Content-Type': 'application/json', ...corsHeadersFn(request) },
      });
    }
  }

  const [overviewRaw, countriesRaw, lastFetch] = await Promise.all([
    env.TICKER_KV.get('analytics:overview'),
    env.TICKER_KV.get('analytics:countries'),
    env.TICKER_KV.get('analytics:lastFetch'),
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
  };

  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      ...corsHeadersFn(request),
    },
  });
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
