/**
 * paulkuo-ticker Worker — Entry Point & Router
 * Modularized: 2026-03-08
 * Social API added: 2026-03-08
 */
import { TICKER_CACHE_TTL } from './config.js';
import { corsHeaders, jsonResponse, twISOString, twDateStr } from './utils.js';
import { authenticateRequest, checkBudget } from './auth.js';
import { costBuffer, flushCosts, handleCosts, handleUsage, handleLogCost } from './costs.js';
import { refreshToken, fetchFitbitData, fetchSleepData } from './fitbit.js';
import { isTseTradingHours, fetchStockData } from './stock.js';
import { handleTranslate, handleTranslateStream, handleSummarize, handlePolishTranscript, handleGroqSTT, handleGoogleSTT } from './translator.js';
import { handleFeedGet, handleFeedPush } from './feed.js';
import { handleGoogleLogin, handleGoogleCallback, handleLineLogin, handleLineCallback, handleFacebookLogin, handleFacebookCallback, handleAuthMe, handleLogout, handleAdminMembers, handleValidateCode, handleAdminGetCodes, handleAdminCreateCode, handleAdminDeleteCode } from './auth.js';
import { handleSocialPublish, handleSocialStatus, handleSocialRefresh } from './social.js';

async function handleTicker(request, env) {
  const cacheJson = await env.TICKER_KV.get('ticker_cache');
  if (cacheJson) { const cache = JSON.parse(cacheJson); if (Date.now() - cache.cached_at < TICKER_CACHE_TTL * 1000) return new Response(JSON.stringify(cache.data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(request) } }); }
  const [fitbitData, stockData, costsData] = await Promise.allSettled([
    fetchFitbitData(env.TICKER_KV, env).catch(() => null), fetchStockData(env.TICKER_KV).catch(() => null),
    (async () => {
      const now = new Date(); let totalUSD = 0, monthUSD = 0, totalCalls = 0, totalTokens = 0;
      const twNow = new Date(now.getTime() + 8 * 3600 * 1000); const thisMonth = twNow.toISOString().slice(0, 7); const dailyMap = {};
      for (let i = 0; i < 30; i++) { const dateStr = twDateStr(new Date(now.getTime() - i * 86400000)); try { const raw = await env.TICKER_KV.get(`costs_${dateStr}`); if (!raw) continue; JSON.parse(raw).forEach(e => { const cost = e.costUSD || 0; totalUSD += cost; totalCalls++; totalTokens += (e.inputTokens || 0) + (e.outputTokens || 0); if (dateStr.startsWith(thisMonth)) monthUSD += cost; dailyMap[dateStr] = (dailyMap[dateStr] || 0) + cost; }); } catch (e) {} }
      const sortedDays = Object.keys(dailyMap).sort().slice(-14); const dailyValues = sortedDays.map(d => +(dailyMap[d] || 0).toFixed(4));
      const avgPerDay = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
      const last7Total = sortedDays.slice(-7).reduce((s, d) => s + (dailyMap[d] || 0), 0); const prev7Total = sortedDays.slice(-14, -7).reduce((s, d) => s + (dailyMap[d] || 0), 0);
      return { totalUSD: +totalUSD.toFixed(4), monthUSD: +monthUSD.toFixed(4), totalCalls, totalTokens, avgPerDay: +avgPerDay.toFixed(4), changePercent: +(prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total * 100) : 0).toFixed(1), dailyValues };
    })()
  ]);
  const data = {
    fitbit: fitbitData.status === 'fulfilled' && fitbitData.value ? { steps: fitbitData.value.today?.steps || 0, goal: fitbitData.value.today?.goal || 10000 } : null,
    stock: stockData.status === 'fulfilled' && stockData.value ? { price: stockData.value.price, changePercent: stockData.value.changePercent, name: stockData.value.name, currency: stockData.value.currency } : null,
    costs: costsData.status === 'fulfilled' ? costsData.value : null, updated: twISOString(),
  };
  await env.TICKER_KV.put('ticker_cache', JSON.stringify({ data, cached_at: Date.now() }));
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(request) } });
}

async function handleHealth(request, env) {
  const tokenJson = await env.TICKER_KV.get('fitbit_token'); const hasToken = !!tokenJson;
  let tokenOk = false; if (hasToken) { const t = JSON.parse(tokenJson); tokenOk = (t.expires_at * 1000) > Date.now(); }
  const stockCache = await env.TICKER_KV.get('stock_cache');
  const fitbitLastRefresh = await env.TICKER_KV.get('fitbit_last_refresh');
  const fitbitHoursAgo = fitbitLastRefresh ? Math.round((Date.now() - new Date(fitbitLastRefresh).getTime()) / 3600000 * 10) / 10 : null;
  return jsonResponse({ status: 'ok', fitbit_token: hasToken ? (tokenOk ? 'valid' : 'expired') : 'missing', fitbit_last_refresh: fitbitLastRefresh || 'never', fitbit_hours_ago: fitbitHoursAgo, fitbit_stale: fitbitHoursAgo !== null && fitbitHoursAgo > 12, stock_cache_age_sec: stockCache ? Math.round((Date.now() - JSON.parse(stockCache).cached_at) / 1000) : null, tse_trading: isTseTradingHours(), timestamp: new Date().toISOString() }, 200, request);
}

const ENDPOINTS = ['/ticker','/ws/stt-qwen','/ws/stt','/stt-groq','/stt-google','/fitbit','/stock','/sleep','/translate','/translate-stream','/summarize','/polish-transcript','/costs','/usage','/validate-code','/log-cost','/feed','/health','/social/publish','/social/status','/social/refresh','/auth/google/login','/auth/line/login','/auth/facebook/login','/auth/me','/auth/logout','/auth/admin/members','/auth/admin/codes'];

async function handleRequest(request, env) {
  const url = new URL(request.url); const path = url.pathname; const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (path === '/health') return handleHealth(request, env);
  if (path === '/ticker' && method === 'GET') return handleTicker(request, env);
  if (path === '/feed' && method === 'GET') return handleFeedGet(request, env);
  if (path === '/fitbit') { try { return jsonResponse(await fetchFitbitData(env.TICKER_KV, env), 200, request); } catch (e) { return jsonResponse({ error: e.message }, 500, request); } }
  if (path === '/stock') { try { return jsonResponse(await fetchStockData(env.TICKER_KV), 200, request); } catch (e) { return jsonResponse({ error: e.message }, 500, request); } }
  if (path === '/sleep') { try { return jsonResponse(await fetchSleepData(env.TICKER_KV, { year: url.searchParams.get('year'), month: url.searchParams.get('month') }, env), 200, request); } catch (e) { return jsonResponse({ error: e.message, usage: '/sleep?year=2025 or /sleep?month=2025-03' }, e.message.includes('Missing parameter') ? 400 : 500, request); } }
  if (path === '/translate') return handleTranslate(request, env);
  if (path === '/translate-stream') return handleTranslateStream(request, env);
  if (path === '/stt-groq') return handleGroqSTT(request, env);
  if (path === '/stt-google') return handleGoogleSTT(request, env);
  if (path === '/summarize') return handleSummarize(request, env);
  if (path === '/polish-transcript') return handlePolishTranscript(request, env);
  if (path === '/costs') return handleCosts(request, env);
  if (path === '/usage') return handleUsage(request, env);
  if (path === '/log-cost') return handleLogCost(request, env);
  if (path === '/feed/push' && method === 'POST') return handleFeedPush(request, env);
  if (path === '/validate-code') return handleValidateCode(request, env);
  // ── Social API ──
  if (path === '/social/publish') return handleSocialPublish(request, env);
  if (path === '/social/status') return handleSocialStatus(request, env);
  if (path === '/social/refresh') return handleSocialRefresh(request, env);
  if (path === '/ws/stt-qwen' || path === '/ws/stt') {
    if (request.headers.get('Upgrade') !== 'websocket') return jsonResponse({ error: 'WebSocket upgrade required' }, 426, request);
    const wsAuth = await authenticateRequest(request, env, url.searchParams.get('code') || '');
    if (!wsAuth) return jsonResponse({ error: 'Authentication required' }, 403, request);
    const wsBudget = await checkBudget(wsAuth, env);
    if (!wsBudget.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: wsBudget.usedSec, budgetSec: wsBudget.budgetSec, remainingSec: wsBudget.remainingSec }, 402, request);
    if (path === '/ws/stt-qwen') { if (!env.DASHSCOPE_API_KEY) return jsonResponse({ error: 'DashScope not configured' }, 500, request); return fetch('https://dashscope-intl.aliyuncs.com/api-ws/v1/realtime?model=' + (url.searchParams.get('model') || 'qwen3-asr-flash-realtime'), { headers: { 'Upgrade': 'websocket', 'Authorization': 'Bearer ' + env.DASHSCOPE_API_KEY, 'OpenAI-Beta': 'realtime=v1' } }); }
    else { if (!env.DEEPGRAM_API_KEY) return jsonResponse({ error: 'Deepgram not configured' }, 500, request); const dgParams = new URLSearchParams(url.searchParams); dgParams.delete('code'); return fetch('https://api.deepgram.com/v1/listen?' + dgParams.toString(), { headers: { 'Upgrade': 'websocket', 'Authorization': 'Token ' + env.DEEPGRAM_API_KEY } }); }
  }
  if (path === '/auth/google/login' && method === 'GET') return handleGoogleLogin(request);
  if (path === '/auth/google/callback' && method === 'GET') return handleGoogleCallback(request, env);
  if (path === '/auth/line/login' && method === 'GET') return handleLineLogin(request);
  if (path === '/auth/line/callback' && method === 'GET') return handleLineCallback(request, env);
  if (path === '/auth/facebook/login' && method === 'GET') return handleFacebookLogin(request);
  if (path === '/auth/facebook/callback' && method === 'GET') return handleFacebookCallback(request, env);
  if (path === '/auth/me' && method === 'GET') return handleAuthMe(request, env);
  if (path === '/auth/logout' && method === 'POST') return handleLogout(request, env);
  if (path === '/auth/admin/members' && method === 'GET') return handleAdminMembers(request, env);
  if (path === '/auth/admin/codes' && method === 'GET') return handleAdminGetCodes(request, env);
  if (path === '/auth/admin/codes' && method === 'POST') return handleAdminCreateCode(request, env);
  if (path === '/auth/admin/codes' && method === 'DELETE') return handleAdminDeleteCode(request, env);
  return jsonResponse({ error: 'Not found', endpoints: ENDPOINTS }, 404, request);
}

async function handleScheduled(event, env) {
  try { await refreshToken(env.TICKER_KV, env); await env.TICKER_KV.put('fitbit_last_token_refresh', new Date().toISOString()); console.log('Cron: token refresh success'); } catch (e) { console.error('Cron: token refresh FAILED:', e.message); }
  try { await fetchFitbitData(env.TICKER_KV, env); await env.TICKER_KV.put('fitbit_last_refresh', new Date().toISOString()); console.log('Cron: Fitbit data cached'); } catch (e) { console.error('Cron: Fitbit fetch FAILED:', e.message); }
}

export default {
  fetch: async (request, env, ctx) => { const response = await handleRequest(request, env); if (costBuffer.length >= 10) ctx.waitUntil(flushCosts(env.TICKER_KV)); return response; },
  scheduled: handleScheduled,
};
