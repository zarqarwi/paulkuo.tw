import { twISOString, twDateStr, jsonResponse } from './utils.js';
import { authenticateRequest, checkBudget } from './auth.js';

export const costBuffer = [];
const COST_FLUSH_SIZE = 1; // flush every record to prevent data loss on isolate recycle

export async function logCost(kv, record) {
  costBuffer.push({ timestamp: twISOString(), ...record, costTWD: +(record.costUSD * 32.5).toFixed(4), _userId: record._userId || '' });
  if (costBuffer.length >= COST_FLUSH_SIZE) await flushCosts(kv);
}

export async function flushCosts(kv) {
  if (costBuffer.length === 0) return;
  const toFlush = costBuffer.splice(0);
  const byDate = {};
  toFlush.forEach(e => { const d = e.timestamp.slice(0, 10); if (!byDate[d]) byDate[d] = []; byDate[d].push(e); });
  const codeDeltas = {};
  for (const [date, entries] of Object.entries(byDate)) {
    const dateKey = `costs_${date}`;
    try { const existing = await kv.get(dateKey); const arr = existing ? JSON.parse(existing) : []; arr.push(...entries); await kv.put(dateKey, JSON.stringify(arr), { expirationTtl: 90 * 86400 }); } catch (e) { console.error('flushCosts failed:', e.message); }
    entries.forEach(e => { if (e.code && e._userId && e.source === 'translator' && e.durationSec > 0) { const key = e.code + '_' + e._userId; codeDeltas[key] = (codeDeltas[key] || 0) + (e.durationSec || 0); } });
  }
  for (const [key, delta] of Object.entries(codeDeltas)) {
    if (key.startsWith('oauth:')) continue;
    try { const prev = parseFloat(await kv.get('time_' + key) || '0'); await kv.put('time_' + key, (prev + delta).toFixed(1)); } catch (e) { console.error('time update failed for', key, e.message); }
  }
}

export async function handleCosts(request, env) {
  const url = new URL(request.url);
  const auth = await authenticateRequest(request, env, url.searchParams.get('code') || '');
  if (!auth || !auth.isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, request);
  await flushCosts(env.TICKER_KV);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30', 10), 90);
  const records = [];
  const now = new Date();
  for (let i = 0; i < days; i++) { const d = new Date(now.getTime() - i * 86400000); const data = await env.TICKER_KV.get(`costs_${twDateStr(d)}`); if (data) { try { records.push(...JSON.parse(data)); } catch(e) {} } }
  const totalUSD = records.reduce((s, r) => s + (r.costUSD || 0), 0);
  const byService = {}, bySource = {}, byDate = {};
  records.forEach(r => { byService[r.service] = (byService[r.service] || 0) + (r.costUSD || 0); bySource[r.source] = (bySource[r.source] || 0) + (r.costUSD || 0); const day = (r.timestamp || '').slice(0, 10); if (day) byDate[day] = (byDate[day] || 0) + (r.costUSD || 0); });
  return jsonResponse({ days, totalRecords: records.length, totalUSD: +totalUSD.toFixed(6), totalTWD: +(totalUSD * 32.5).toFixed(2), byService, bySource, byDate, records: records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')) }, 200, request);
}

export async function handleUsage(request, env) {
  const url = new URL(request.url);
  const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 90);
  const auth = await authenticateRequest(request, env, url.searchParams.get('code') || '');
  if (!auth || !auth.isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, request);
  await flushCosts(env.TICKER_KV);
  const now = new Date(); const byCode = {}; let totalCost = 0, totalRequests = 0;
  for (let i = 0; i < days; i++) { const d = new Date(now - i * 86400000); try { const raw = await env.TICKER_KV.get(`costs_${d.toISOString().slice(0, 10)}`); if (!raw) continue; JSON.parse(raw).forEach(e => { if (e.source !== 'translator') return; let code = e.code || 'unknown'; if (code.startsWith('oauth:') || code === '' || code === 'unknown') code = 'agora2026'; if (!byCode[code]) byCode[code] = { code, requests: 0, costUSD: 0, costTWD: 0, actions: {}, langs: {}, lastUsed: '' }; byCode[code].requests++; byCode[code].costUSD += (e.costUSD || 0); byCode[code].costTWD += (e.costTWD || 0); byCode[code].actions[e.action || 'other'] = (byCode[code].actions[e.action || 'other'] || 0) + 1; if (e.sourceLang) byCode[code].langs[e.sourceLang] = (byCode[code].langs[e.sourceLang] || 0) + 1; if (e.timestamp > byCode[code].lastUsed) byCode[code].lastUsed = e.timestamp; totalCost += (e.costUSD || 0); totalRequests++; }); } catch (e) {} }
  Object.values(byCode).forEach(u => { u.costUSD = +u.costUSD.toFixed(6); u.costTWD = +u.costTWD.toFixed(4); });
  return jsonResponse({ period: `${days} days`, totalRequests, totalCostUSD: +totalCost.toFixed(6), totalCostTWD: +(totalCost * 32.5).toFixed(4), users: Object.values(byCode).sort((a, b) => b.costUSD - a.costUSD) }, 200, request);
}

export async function handleLogCost(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { service, model, action, source, durationSec, costUSD, note, code } = body;
  const auth = await authenticateRequest(request, env, code || '');
  if (!auth) return jsonResponse({ error: 'Authentication required' }, 401, request);
  if (!service || !action || costUSD === undefined) return jsonResponse({ error: 'Missing required fields' }, 400, request);
  if (costUSD > 1) return jsonResponse({ error: 'Cost too high for single entry' }, 400, request);
  const budgetLC = await checkBudget(auth, env);
  if (!budgetLC.ok) return jsonResponse({ error: 'Budget exceeded', code: 'budget_exceeded', usedSec: budgetLC.usedSec, budgetSec: budgetLC.budgetSec, remainingSec: budgetLC.remainingSec }, 402, request);
  await logCost(env.TICKER_KV, { service: service || 'unknown', model: model || '', action: action || 'unknown', source: source || 'unknown', code: code || auth.code || '', _userId: auth.userId || '', costUSD: +Number(costUSD).toFixed(6), durationSec: durationSec || 0, note: (note || '').slice(0, 200) });
  await flushCosts(env.TICKER_KV);
  return jsonResponse({ ok: true }, 200, request);
}
