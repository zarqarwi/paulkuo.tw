// worker/src/status.js
// 系統狀態自動偵測 — 8 種規則

export async function handleStatus(request, env) {
  const alerts = [];

  // ── 1. Claude 用量 ──
  try {
    const claudeSub = await env.TICKER_KV.get('claude_subscription', 'json');
    if (claudeSub) {
      if (claudeSub.extraPct > 95) {
        alerts.push({
          level: 'critical',
          msg: `Claude Extra 用量 ${claudeSub.extraPct}%，即將耗盡`,
          category: 'cost'
        });
      } else if (claudeSub.extraPct > 80) {
        const remaining = (claudeSub.extraLimit || 450) - (claudeSub.extraSpent || 0);
        alerts.push({
          level: 'warning',
          msg: `Claude Extra 用量 ${claudeSub.extraPct}%，剩餘 $${remaining.toFixed(2)}`,
          category: 'cost'
        });
      }
    }
  } catch (e) { console.error('[status] claudeSub error:', e.message); }

  // ── 2. API 成本飆升 ──
  try {
    const ticker = await env.TICKER_KV.get('ticker_cache', 'json');
    if (ticker?.costs?.changePercent > 50) {
      alerts.push({
        level: 'warning',
        msg: `API 成本較上期上升 ${Math.round(ticker.costs.changePercent)}%`,
        category: 'cost'
      });
    }
  } catch (e) { console.error('[status] costs error:', e.message); }

  // ── 3. GSC 點擊下降 ──
  try {
    const gsc = await env.TICKER_KV.get('gsc:search_analytics', 'json');
    if (gsc?.dailyClicks?.length >= 14) {
      const daily = gsc.dailyClicks;
      const thisWeek = daily.slice(-7).reduce((s, d) => s + d.clicks, 0);
      const lastWeek = daily.slice(-14, -7).reduce((s, d) => s + d.clicks, 0);
      if (lastWeek > 0 && (lastWeek - thisWeek) / lastWeek > 0.3) {
        alerts.push({
          level: 'warning',
          msg: `GSC 點擊本週下降 ${Math.round((1 - thisWeek / lastWeek) * 100)}%（${thisWeek} vs ${lastWeek}）`,
          category: 'seo'
        });
      }
    }
  } catch (e) { console.error('[status] gsc clicks error:', e.message); }

  // ── 4. 索引覆蓋率低 ──
  try {
    const indexStatus = await env.TICKER_KV.get('gsc:index_status', 'json');
    if (indexStatus?.sitemaps?.length) {
      const total = indexStatus.sitemaps.reduce((s, sm) => s + (sm.submitted || 0), 0);
      const indexed = indexStatus.sitemaps.reduce((s, sm) => s + (sm.indexed || 0), 0);
      if (total > 0 && indexed / total < 0.5) {
        alerts.push({
          level: 'info',
          msg: `索引覆蓋率 ${(indexed / total * 100).toFixed(1)}%（${indexed}/${total}）`,
          category: 'seo'
        });
      }
    }
  } catch (e) { console.error('[status] index error:', e.message); }

  // ── 5. Worker 自身健康（self-check） ──
  try {
    const healthResp = await fetch('https://api.paulkuo.tw/health');
    if (!healthResp.ok) {
      alerts.push({ level: 'critical', msg: 'Worker /health endpoint 異常', category: 'system' });
    }
  } catch (e) {
    alerts.push({ level: 'critical', msg: 'Worker health check 失敗', category: 'system' });
  }

  // ── 6. Cron 停擺 ──
  try {
    const lastFetch = await env.TICKER_KV.get('analytics:lastFetch');
    if (lastFetch) {
      const hoursSince = (Date.now() - parseInt(lastFetch)) / 3600000;
      if (hoursSince > 12) {
        alerts.push({
          level: 'critical',
          msg: `Analytics cron 超過 ${Math.round(hoursSince)} 小時未執行`,
          category: 'system'
        });
      }
    }
  } catch (e) { console.error('[status] cron error:', e.message); }

  // ── 7. Fitbit 斷線 ──
  try {
    const ticker = await env.TICKER_KV.get('ticker_cache', 'json');
    if (ticker?.fitbit?.lastRefresh) {
      const hoursSince = (Date.now() - new Date(ticker.fitbit.lastRefresh).getTime()) / 3600000;
      if (hoursSince > 24) {
        alerts.push({
          level: 'info',
          msg: `Fitbit 資料超過 ${Math.round(hoursSince)} 小時未更新`,
          category: 'health'
        });
      }
    }
  } catch (e) { console.error('[status] fitbit error:', e.message); }

  // ── 8. GSC 資料過期 ──
  try {
    const gscLast = await env.TICKER_KV.get('gsc:lastFetch');
    if (gscLast) {
      const hoursSince = (Date.now() - parseInt(gscLast)) / 3600000;
      if (hoursSince > 48) {
        alerts.push({
          level: 'warning',
          msg: `GSC 資料超過 ${Math.round(hoursSince)} 小時未更新`,
          category: 'seo'
        });
      }
    }
  } catch (e) { console.error('[status] gsc freshness error:', e.message); }

  // ── 彙整 ──
  const hasError = alerts.some(a => a.level === 'critical');
  const hasWarning = alerts.some(a => a.level === 'warning');
  const overall = hasError ? 'critical' : hasWarning ? 'warning' : 'healthy';

  return new Response(JSON.stringify({
    overall,
    alerts,
    totalChecks: 8,
    checkedAt: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
