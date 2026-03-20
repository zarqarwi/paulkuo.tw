/**
 * paulkuo-ticker Worker — Entry Point & Router
 * Modularized: 2026-03-08
 * Social API added: 2026-03-08
 * TQEF Admin API added: 2026-03-14
 */
import { TICKER_CACHE_TTL } from './config.js';
import { corsHeaders, jsonResponse, twISOString, twDateStr } from './utils.js';
import { authenticateRequest, checkBudget } from './auth.js';
import { costBuffer, flushCosts, handleCosts, handleUsage, handleLogCost } from './costs.js';
import { refreshToken, fetchFitbitData, fetchSleepData } from './fitbit.js';
import { isTseTradingHours, fetchStockData } from './stock.js';
import { handleTranslate, handleTranslateStream, handleSummarize, handlePolishTranscript, handleGroqSTT, handleGoogleSTT, handleFeedbackPost, handleFeedbackGet, handleTqefClaude } from './translator.js';
import { handleFeedGet, handleFeedPush, syncSocialFeed } from './feed.js';
import { handleCommentsGet, handleCommentCreate, handleCommentUpdate, handleCommentDelete, handleCommentLike, handleCommentsAdminRecent } from './comments.js';
import { handleGoogleLogin, handleGoogleCallback, handleLineLogin, handleLineCallback, handleFacebookLogin, handleFacebookCallback, handleAuthMe, handleLogout, handleAdminMembers, handleValidateCode, handleAdminGetCodes, handleAdminCreateCode, handleAdminDeleteCode } from './auth.js';
import { handleSocialPublish, handleSocialStatus, handleSocialRefresh } from './social.js';
import { fetchDailyVisitors, handleVisitors, handleAnalytics, handleAnalyticsBeacon, fetchAnalyticsOverview, fetchRumAnalytics, fetchDurationAnalytics } from './visitors.js';
import { handleTqefDashboard, handleTqefCorpus, handleTqefCorpusCreate, handleTqefCorpusImport, handleTqefCorpusUpdate, handleTqefCorpusDelete, handleTqefRounds, handleTqefRoundDetail, handleTqefRoundCompare, handleTqefEvalUpload, handleTqefFeedbackCreate, handleTqefFeedbackAdopt, handleTqefFeedbackList, handleTqefFeedbackReject, handleTqefFeedbackDefer, handleTqefMeetingExport, handleTqefMeetingExportsList, handleTqefMeetingExportEntries, handleTqefMeetingAdoptEntry, handleTqefMeetingArchive, handleTqefUploadText, handleTqefCorpusBatch, handleTqefUploadAudio, handleTqefSttStatus, handleTqefAudioCorrect, handleTqefAudioProxy, handleTqefYoutubeTranscript, handleTqefYoutubeCorpus } from './tqef-api.js';
import { handleScorecardEvaluate, handleScorecardAdvise, handleScorecardSubmit, handleScorecardFeed, handleScorecardGetEval, handleScorecardBadge, handleScorecardHistory } from './scorecard.js';

async function handleTicker(request, env) {
  const cacheJson = await env.TICKER_KV.get('ticker_cache');
  if (cacheJson) { const cache = JSON.parse(cacheJson); if (Date.now() - cache.cached_at < TICKER_CACHE_TTL * 1000) return new Response(JSON.stringify(cache.data), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60', ...corsHeaders(request) } }); }
  const [fitbitData, stockData, costsData] = await Promise.allSettled([
    fetchFitbitData(env.TICKER_KV, env).catch(() => null), fetchStockData(env.TICKER_KV).catch(() => null),
    (async () => {
      const now = new Date(); let monthUSD = 0, totalCalls = 0, totalTokens = 0;
      const twNow = new Date(now.getTime() + 8 * 3600 * 1000); const thisMonth = twNow.toISOString().slice(0, 7); const dailyMap = {};
      // Scan last 14 days for sparkline + current month
      for (let i = 0; i < 14; i++) { const dateStr = twDateStr(new Date(now.getTime() - i * 86400000)); try { const raw = await env.TICKER_KV.get(`costs_${dateStr}`); if (!raw) continue; JSON.parse(raw).forEach(e => { const cost = e.costUSD || 0; if (dateStr.startsWith(thisMonth)) { monthUSD += cost; totalCalls++; totalTokens += (e.inputTokens || 0) + (e.outputTokens || 0); } dailyMap[dateStr] = (dailyMap[dateStr] || 0) + cost; }); } catch (e) {} }
      // Read cumulative summary (written by sync_costs_to_kv.py)
      let totalUSD = 0, summaryTokens = 0, summaryCalls = 0;
      try { const sumRaw = await env.TICKER_KV.get('costs_summary'); if (sumRaw) { const s = JSON.parse(sumRaw); totalUSD = s.totalUSD || 0; summaryTokens = s.totalTokens || 0; summaryCalls = s.totalCalls || 0; } } catch (e) {}
      // If no summary yet, fall back to month values
      if (totalUSD === 0) { totalUSD = monthUSD; summaryTokens = totalTokens; summaryCalls = totalCalls; }
      const sortedDays = Object.keys(dailyMap).sort().slice(-14); const dailyValues = sortedDays.map(d => +(dailyMap[d] || 0).toFixed(4));
      const avgPerDay = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
      const last7Total = sortedDays.slice(-7).reduce((s, d) => s + (dailyMap[d] || 0), 0); const prev7Total = sortedDays.slice(-14, -7).reduce((s, d) => s + (dailyMap[d] || 0), 0);
      return { totalUSD: +totalUSD.toFixed(4), monthUSD: +monthUSD.toFixed(4), totalCalls: summaryCalls, totalTokens: summaryTokens, avgPerDay: +avgPerDay.toFixed(4), changePercent: +(prev7Total > 0 ? ((last7Total - prev7Total) / prev7Total * 100) : 0).toFixed(1), dailyValues };
    })()
  ]);
  const data = {
    fitbit: fitbitData.status === 'fulfilled' && fitbitData.value ? { steps: fitbitData.value.today?.steps || 0, goal: fitbitData.value.today?.goal || 10000 } : null,
    stock: stockData.status === 'fulfilled' && stockData.value ? { price: stockData.value.price, changePercent: stockData.value.changePercent, name: stockData.value.name, currency: stockData.value.currency } : null,
    costs: costsData.status === 'fulfilled' ? costsData.value : null, updated: twISOString(),
  };
  // 附加 timing 數據（from cron → KV）
  try {
    const timingRaw = await env.TICKER_KV.get('timing_cache');
    if (timingRaw) {
      const t = JSON.parse(timingRaw);
      const twNow = new Date(Date.now() + 8 * 3600 * 1000);
      const todayStr = twNow.toISOString().slice(0, 10);
      const todayEntry = (t.daily || []).find(d => d.date === todayStr);
      data.timing = {
        todayHours: todayEntry ? Math.round(todayEntry.ai_hours * 10) / 10 : 0,
        monthHours: Math.round(t.month_summary?.total_ai_hours || 0),
        activeDays: t.month_summary?.active_days || 0,
        updated: t.updated || null
      };
    }
  } catch (e) {}
  // 附加訪客數據
  const visitorsRaw = await env.TICKER_KV.get('site_visitors');
  if (visitorsRaw) data.visitors = JSON.parse(visitorsRaw);
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

const ENDPOINTS = ['/ticker','/visitors','/analytics','/analytics/beacon','/ws/stt-qwen','/ws/stt','/stt-groq','/stt-google','/fitbit','/stock','/sleep','/translate','/translate-stream','/summarize','/polish-transcript','/costs','/usage','/validate-code','/log-cost','/feed','/health','/social/publish','/social/status','/social/refresh','/auth/google/login','/auth/line/login','/auth/facebook/login','/auth/me','/auth/logout','/auth/admin/members','/auth/admin/codes','/feedback','/api/comments','/api/comments/:id','/api/comments/:id/like','/api/comments/admin/recent','/api/scorecard/evaluate','/api/scorecard/advise','/api/scorecard/submit','/api/scorecard/feed','/api/scorecard/eval/:id','/api/scorecard/badge/:id','/api/scorecard/history/:projectName','/api/tqef/corpus','/api/tqef/corpus/import','/api/tqef/rounds','/api/tqef/rounds/:id','/api/tqef/eval/upload','/api/tqef/youtube-transcript','/api/tqef/youtube-corpus'];

async function handleRequest(request, env) {
  const url = new URL(request.url); const path = url.pathname; const method = request.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (path === '/health') return handleHealth(request, env);
  if (path === '/ticker' && method === 'GET') return handleTicker(request, env);
  if (path === '/visitors' && method === 'GET') return handleVisitors(request, env, corsHeaders);
  if (path === '/analytics' && method === 'GET') return handleAnalytics(request, env, corsHeaders);
  if (path === '/analytics/beacon' && method === 'POST') return handleAnalyticsBeacon(request, env, corsHeaders);
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
  if (path === '/feedback' && method === 'POST') return handleFeedbackPost(request, env);
  if (path === '/tqef/claude' && method === 'POST') return handleTqefClaude(request, env);
  if (path === '/feedback' && method === 'GET') return handleFeedbackGet(request, env);
  if (path === '/feed/push' && method === 'POST') return handleFeedPush(request, env);
  if (path === '/validate-code') return handleValidateCode(request, env);
  // ── Comments API ──
  if (path === '/api/comments' && method === 'GET') return handleCommentsGet(request, env);
  if (path === '/api/comments' && method === 'POST') return handleCommentCreate(request, env);
  if (path === '/api/comments/admin/recent' && method === 'GET') return handleCommentsAdminRecent(request, env);
  if (path.startsWith('/api/comments/') && path.endsWith('/like') && method === 'POST') {
    const commentId = decodeURIComponent(path.replace('/api/comments/', '').replace('/like', ''));
    if (commentId) return handleCommentLike(request, env, commentId);
  }
  if (path.startsWith('/api/comments/') && method === 'PATCH') {
    const commentId = decodeURIComponent(path.split('/api/comments/')[1]);
    if (commentId && !commentId.includes('/')) return handleCommentUpdate(request, env, commentId);
  }
  if (path.startsWith('/api/comments/') && method === 'DELETE') {
    const commentId = decodeURIComponent(path.split('/api/comments/')[1]);
    if (commentId && !commentId.includes('/')) return handleCommentDelete(request, env, commentId);
  }
  // ── Scorecard AI API ──
  if (path === '/api/scorecard/evaluate' && method === 'POST') return handleScorecardEvaluate(request, env);
  if (path === '/api/scorecard/advise' && method === 'POST') return handleScorecardAdvise(request, env);
  if (path === '/api/scorecard/submit' && method === 'POST') return handleScorecardSubmit(request, env);
  if (path === '/api/scorecard/feed' && method === 'GET') return handleScorecardFeed(request, env);
  if (path.startsWith('/api/scorecard/badge/') && method === 'GET') {
    const evalId = decodeURIComponent(path.split('/api/scorecard/badge/')[1]);
    if (evalId) return handleScorecardBadge(request, env, evalId);
  }
  if (path.startsWith('/api/scorecard/history/') && method === 'GET') {
    const projectName = path.split('/api/scorecard/history/')[1];
    if (projectName) return handleScorecardHistory(request, env, projectName);
  }
  if (path.startsWith('/api/scorecard/eval/') && method === 'GET') {
    const evalId = decodeURIComponent(path.split('/api/scorecard/eval/')[1]);
    if (evalId) return handleScorecardGetEval(request, env, evalId);
  }
  // ── TQEF Admin API ──
  if (path === '/api/tqef/dashboard' && method === 'GET') return handleTqefDashboard(request, env);
  if (path === '/api/tqef/corpus' && method === 'GET') return handleTqefCorpus(request, env);
  if (path === '/api/tqef/corpus' && method === 'POST') return handleTqefCorpusCreate(request, env);
  if (path === '/api/tqef/corpus/import' && method === 'POST') return handleTqefCorpusImport(request, env);
  if (path === '/api/tqef/rounds' && method === 'GET') return handleTqefRounds(request, env);
  if (path === '/api/tqef/eval/upload' && method === 'POST') return handleTqefEvalUpload(request, env);
  if (path === '/api/tqef/feedback' && method === 'POST') return handleTqefFeedbackCreate(request, env);
  if (path === '/api/tqef/feedback' && method === 'GET') return handleTqefFeedbackList(request, env);
  // Dynamic TQEF feedback routes: /api/tqef/feedback/:id/adopt|reject|defer
  if (path.startsWith('/api/tqef/feedback/') && method === 'POST') {
    const fbParts = path.replace('/api/tqef/feedback/', '').split('/');
    if (fbParts.length === 2 && fbParts[0]) {
      const fbId = decodeURIComponent(fbParts[0]);
      if (fbParts[1] === 'adopt') return handleTqefFeedbackAdopt(request, env, fbId);
      if (fbParts[1] === 'reject') return handleTqefFeedbackReject(request, env, fbId);
      if (fbParts[1] === 'defer') return handleTqefFeedbackDefer(request, env, fbId);
    }
  }
  // Channel A: Meeting Export routes
  if (path === '/api/tqef/meeting-export' && method === 'POST') return handleTqefMeetingExport(request, env);
  if (path === '/api/tqef/meeting-exports' && method === 'GET') return handleTqefMeetingExportsList(request, env);
  if (path.startsWith('/api/tqef/meeting-exports/') && method === 'GET') {
    const meParts = path.replace('/api/tqef/meeting-exports/', '').split('/');
    if (meParts.length === 2 && meParts[1] === 'entries') return handleTqefMeetingExportEntries(request, env, decodeURIComponent(meParts[0]));
  }
  if (path.startsWith('/api/tqef/meeting-exports/') && method === 'POST') {
    const meParts = path.replace('/api/tqef/meeting-exports/', '').split('/');
    if (meParts.length === 2 && meParts[0]) {
      const meId = decodeURIComponent(meParts[0]);
      if (meParts[1] === 'adopt-entry') return handleTqefMeetingAdoptEntry(request, env, meId);
      if (meParts[1] === 'archive') return handleTqefMeetingArchive(request, env, meId);
    }
  }
  // Dynamic TQEF routes: /api/tqef/rounds/:id, /api/tqef/rounds/:id/compare/:id2, /api/tqef/corpus/:id
  if (path.startsWith('/api/tqef/rounds/') && method === 'GET') {
    const parts = path.replace('/api/tqef/rounds/', '').split('/');
    if (parts.length === 3 && parts[1] === 'compare') return handleTqefRoundCompare(request, env, decodeURIComponent(parts[0]), decodeURIComponent(parts[2]));
    if (parts.length === 1 && parts[0]) return handleTqefRoundDetail(request, env, decodeURIComponent(parts[0]));
  }
  if (path.startsWith('/api/tqef/corpus/') && method === 'PUT') {
    const corpusId = decodeURIComponent(path.split('/api/tqef/corpus/')[1]);
    if (corpusId) return handleTqefCorpusUpdate(request, env, corpusId);
  }
  if (path.startsWith('/api/tqef/corpus/') && method === 'DELETE') {
    const corpusId = decodeURIComponent(path.split('/api/tqef/corpus/')[1]);
    if (corpusId) return handleTqefCorpusDelete(request, env, corpusId);
  }
  // Channel C: Corpus Intake routes
  if (path === '/api/tqef/upload-text' && method === 'POST') return handleTqefUploadText(request, env);
  if (path === '/api/tqef/corpus/batch' && method === 'POST') return handleTqefCorpusBatch(request, env);
  if (path === '/api/tqef/upload-audio' && method === 'POST') return handleTqefUploadAudio(request, env);
  if (path.startsWith('/api/tqef/stt-status/') && method === 'GET') {
    const uploadId = decodeURIComponent(path.split('/api/tqef/stt-status/')[1]);
    if (uploadId) return handleTqefSttStatus(request, env, uploadId);
  }
  if (path.startsWith('/api/tqef/audio/') && path.endsWith('/correct') && method === 'POST') {
    const audioId = decodeURIComponent(path.replace('/api/tqef/audio/', '').replace('/correct', ''));
    if (audioId) return handleTqefAudioCorrect(request, env, audioId);
  }
  if (path.startsWith('/api/tqef/audio-proxy/') && method === 'GET') {
    const token = decodeURIComponent(path.split('/api/tqef/audio-proxy/')[1]);
    if (token) return handleTqefAudioProxy(request, env, token);
  }
  // Channel D: YouTube 字幕進件
  if (path === '/api/tqef/youtube-transcript' && method === 'POST') return handleTqefYoutubeTranscript(request, env);
  if (path === '/api/tqef/youtube-corpus' && method === 'POST') return handleTqefYoutubeCorpus(request, env);
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
  try { await fetchDailyVisitors(env); } catch (e) { console.error('Cron: visitors fetch FAILED:', e.message); }
  try { await fetchAnalyticsOverview(env); await fetchRumAnalytics(env); await fetchDurationAnalytics(env); console.log('Cron: analytics updated'); } catch (e) { console.error('Cron: analytics FAILED:', e.message); }
  try { await syncSocialFeed(env); console.log('Cron: social feed synced'); } catch (e) { console.error('Cron: social feed sync FAILED:', e.message); }
}

export default {
  fetch: async (request, env, ctx) => { const response = await handleRequest(request, env); if (costBuffer.length >= 10) ctx.waitUntil(flushCosts(env.TICKER_KV)); return response; },
  scheduled: handleScheduled,
};
