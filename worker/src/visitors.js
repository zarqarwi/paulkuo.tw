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
