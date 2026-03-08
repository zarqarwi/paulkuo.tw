import { STOCK_SYMBOL, STOCK_NAME, STOCK_CACHE_TRADING, STOCK_CACHE_CLOSED } from './config.js';

export function isTseTradingHours() {
  const jstDate = new Date(Date.now() + 9 * 3600 * 1000); if (jstDate.getDay() === 0 || jstDate.getDay() === 6) return false;
  return jstDate.getHours() * 60 + jstDate.getMinutes() >= 540 && jstDate.getHours() * 60 + jstDate.getMinutes() <= 930;
}

export async function fetchStockData(kv) {
  const trading = isTseTradingHours(); const cacheTtl = trading ? STOCK_CACHE_TRADING : STOCK_CACHE_CLOSED;
  const cacheJson = await kv.get('stock_cache');
  if (cacheJson) { const cache = JSON.parse(cacheJson); if (Date.now() - cache.cached_at < cacheTtl * 1000) return { ...cache.data, _cached: true, _age_sec: Math.round((Date.now() - cache.cached_at) / 1000) }; }
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${STOCK_SYMBOL}?range=5d&interval=1d`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) { if (cacheJson) { const cache = JSON.parse(cacheJson); return { ...cache.data, _stale: true, _error: `Yahoo returned ${res.status}` }; } throw new Error(`Yahoo Finance API error: ${res.status}`); }
  const json = await res.json(); const result = json.chart?.result?.[0]; if (!result) throw new Error('No chart data from Yahoo');
  const meta = result.meta || {}; const price = meta.regularMarketPrice || 0; const prevClose = meta.chartPreviousClose || meta.previousClose || price;
  const history = (result.timestamp || []).map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: result.indicators?.quote?.[0]?.close?.[i] != null ? Math.round(result.indicators.quote[0].close[i]) : null })).filter(d => d.close != null);
  const data = { updated: new Date().toISOString(), source: 'cloudflare-worker', symbol: STOCK_SYMBOL, name: STOCK_NAME, price: Math.round(price), previousClose: Math.round(prevClose), changePercent: Math.round((prevClose ? (price - prevClose) / prevClose * 100 : 0) * 100) / 100, currency: meta.currency || 'JPY', trading, history };
  await kv.put('stock_cache', JSON.stringify({ data, cached_at: Date.now() })); return data;
}
