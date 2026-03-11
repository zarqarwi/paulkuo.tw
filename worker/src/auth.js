import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_SCOPES, LINE_CHANNEL_ID, LINE_REDIRECT_URI, LINE_SCOPES, FB_APP_ID, FB_REDIRECT_URI, FB_SCOPES, SESSION_MAX_AGE, SITE_URL, INVITE_BUDGET_SEC } from './config.js';
import { corsHeaders, jsonResponse, nanoid } from './utils.js';
import { costBuffer } from './costs.js';

function getOAuthRedirect(request) { const cookie = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_redirect=([^\s;]+)/); if (!cookie) return ''; try { const path = decodeURIComponent(cookie[1]); if (path.startsWith('/') && !path.startsWith('//') && !path.includes(':')) return path; } catch (e) {} return ''; }
export async function validateCode(code, kv) { if (!code) return null; const c = code.trim().toLowerCase(); try { const kvCodes = await kv.get('invite_codes'); if (kvCodes) { const parsed = JSON.parse(kvCodes); if (parsed[c]) return parsed[c]; } } catch (e) {} return null; }

export async function authenticateRequest(request, env, inviteCode) {
  const user = await getCurrentUser(request, env);
  if (user && user.role === 'admin') return { type: 'oauth', name: user.name, role: user.role, userId: user.id, code: 'oauth:' + user.id, isAdmin: true };
  if (user && inviteCode) { const codeInfo = await validateCode(inviteCode, env.TICKER_KV); if (codeInfo) return { type: 'oauth+invite', name: user.name || codeInfo.name, role: codeInfo.role, userId: user.id, code: inviteCode, isAdmin: codeInfo.role === 'admin', noBudget: !!codeInfo.noBudget }; }
  // API-only auth: valid admin invite code without session cookie (for TQEF eval_runner etc.)
  if (!user && inviteCode) { const codeInfo = await validateCode(inviteCode, env.TICKER_KV); if (codeInfo) return { type: "api-key", name: codeInfo.name, role: codeInfo.role, userId: "api:" + inviteCode, code: inviteCode, isAdmin: codeInfo.role === "admin", noBudget: !!codeInfo.noBudget }; }
  return null;
}

async function getCodeUsedTime(code, kv, userId) { if (!code || !userId) return 0; try { const raw = await kv.get('time_' + code + '_' + userId); return raw ? parseFloat(raw) : 0; } catch (e) { return 0; } }

export async function checkBudget(auth, env) {
  if (auth.isAdmin || auth.noBudget) return { ok: true, usedSec: 0, budgetSec: Infinity };
  const code = auth.code || '', userId = auth.userId || '';
  if (!code || !userId) return { ok: false, usedSec: 0, budgetSec: INVITE_BUDGET_SEC };
  const used = await getCodeUsedTime(code, env.TICKER_KV, userId);
  const buffered = costBuffer.filter(e => e.code === code && e._userId === userId && e.durationSec > 0).reduce((s, e) => s + (e.durationSec || 0), 0);
  const total = used + buffered;
  return { ok: total < INVITE_BUDGET_SEC, usedSec: +total.toFixed(1), budgetSec: INVITE_BUDGET_SEC, remainingSec: +Math.max(0, INVITE_BUDGET_SEC - total).toFixed(1) };
}

function setSessionCookie(sid) { return `session=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=.paulkuo.tw; Max-Age=${SESSION_MAX_AGE}`; }
function clearSessionCookie() { return 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Domain=.paulkuo.tw; Max-Age=0'; }
function getSessionFromCookie(request) { const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)session=([^\s;]+)/); return m ? m[1] : null; }

async function upsertUser(db, { email, name, avatar, provider, providerId }) {
  const existing = await db.prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?').bind(provider, providerId).first();
  if (existing) { await db.prepare("UPDATE users SET name = ?, avatar = ?, email = ?, last_login_at = datetime('now') WHERE id = ?").bind(name, avatar, email, existing.id).run(); return existing.id; }
  const id = nanoid(); await db.prepare('INSERT INTO users (id, email, name, avatar, provider, provider_id, role) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, email, name, avatar, provider, providerId, 'member').run(); return id;
}

export async function getCurrentUser(request, env) {
  const sessionId = getSessionFromCookie(request); if (!sessionId) return null;
  try { return await env.AUTH_DB.prepare('SELECT u.id, u.email, u.name, u.avatar, u.provider, u.role, u.created_at, s.expires_at FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = ? AND s.expires_at > datetime(\'now\')').bind(sessionId).first(); } catch (e) { console.error("getCurrentUser D1 error:", e.message); return null; }
}

async function createSessionAndRedirect(request, env, userId) {
  const sessionId = nanoid(32); const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000).toISOString();
  await env.AUTH_DB.prepare('INSERT INTO sessions (id, user_id, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)').bind(sessionId, userId, expiresAt, (request.headers.get('User-Agent') || '').slice(0, 200), request.headers.get('CF-Connecting-IP') || '').run();
  const redir = getOAuthRedirect(request);
  const headers = new Headers({ Location: `${SITE_URL}${redir}${redir.includes('?') ? '&' : '?'}auth_success=1` });
  headers.append('Set-Cookie', setSessionCookie(sessionId)); headers.append('Set-Cookie', 'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  return new Response(null, { status: 302, headers });
}

function csrfCheck(request, state) { const m = (request.headers.get('Cookie') || '').match(/(?:^|;\s*)oauth_state=([^\s;]+)/); return m && m[1] === state; }

export function handleGoogleLogin(request) {
  const url = new URL(request.url); const redirect = url.searchParams.get('redirect') || ''; const state = nanoid(32);
  const headers = new Headers({ Location: `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, redirect_uri: GOOGLE_REDIRECT_URI, response_type: 'code', scope: GOOGLE_SCOPES, state, access_type: 'online', prompt: 'select_account' })}` });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
export async function handleGoogleCallback(request, env) {
  const url = new URL(request.url); const code = url.searchParams.get('code'), state = url.searchParams.get('state'), error = url.searchParams.get('error');
  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);
  if (!csrfCheck(request, state)) return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: GOOGLE_REDIRECT_URI, grant_type: 'authorization_code' }) });
    if (!tokenRes.ok) { console.error('Google token failed:', await tokenRes.text()); return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302); }
    const tokens = await tokenRes.json();
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();
    const userId = await upsertUser(env.AUTH_DB, { email: profile.email, name: profile.name, avatar: profile.picture, provider: 'google', providerId: profile.id });
    return await createSessionAndRedirect(request, env, userId);
  } catch (err) { console.error('Google OAuth error:', err); return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302); }
}

export function handleLineLogin(request) {
  const url = new URL(request.url); const redirect = url.searchParams.get('redirect') || ''; const state = nanoid(32);
  const headers = new Headers({ Location: `https://access.line.me/oauth2/v2.1/authorize?${new URLSearchParams({ response_type: 'code', client_id: LINE_CHANNEL_ID, redirect_uri: LINE_REDIRECT_URI, state, scope: LINE_SCOPES })}` });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
export async function handleLineCallback(request, env) {
  const url = new URL(request.url); const code = url.searchParams.get('code'), state = url.searchParams.get('state'), error = url.searchParams.get('error');
  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);
  if (!csrfCheck(request, state)) return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  try {
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: LINE_REDIRECT_URI, client_id: LINE_CHANNEL_ID, client_secret: env.LINE_CHANNEL_SECRET }) });
    if (!tokenRes.ok) { console.error('LINE token failed:', await tokenRes.text()); return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302); }
    const tokens = await tokenRes.json();
    const profileRes = await fetch('https://api.line.me/v2/profile', { headers: { Authorization: `Bearer ${tokens.access_token}` } });
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();
    let email = ''; if (tokens.id_token) { try { email = JSON.parse(atob(tokens.id_token.split('.')[1])).email || ''; } catch (e) {} }
    const userId = await upsertUser(env.AUTH_DB, { email: email || `line_${profile.userId}@line.user`, name: profile.displayName, avatar: profile.pictureUrl || '', provider: 'line', providerId: profile.userId });
    return await createSessionAndRedirect(request, env, userId);
  } catch (err) { console.error('LINE OAuth error:', err); return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302); }
}

export function handleFacebookLogin(request) {
  const url = new URL(request.url); const redirect = url.searchParams.get('redirect') || ''; const state = nanoid(32);
  const headers = new Headers({ Location: `https://www.facebook.com/v19.0/dialog/oauth?${new URLSearchParams({ client_id: FB_APP_ID, redirect_uri: FB_REDIRECT_URI, state, scope: FB_SCOPES, response_type: 'code' })}` });
  headers.append('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  if (redirect) headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
export async function handleFacebookCallback(request, env) {
  const url = new URL(request.url); const code = url.searchParams.get('code'), state = url.searchParams.get('state'), error = url.searchParams.get('error');
  if (error) return Response.redirect(`${SITE_URL}?auth_error=${encodeURIComponent(error)}`, 302);
  if (!code || !state) return Response.redirect(`${SITE_URL}?auth_error=missing_params`, 302);
  if (!csrfCheck(request, state)) return Response.redirect(`${SITE_URL}?auth_error=csrf_failed`, 302);
  try {
    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({ client_id: FB_APP_ID, client_secret: env.FB_APP_SECRET, redirect_uri: FB_REDIRECT_URI, code })}`);
    if (!tokenRes.ok) { console.error('FB token failed:', await tokenRes.text()); return Response.redirect(`${SITE_URL}?auth_error=token_failed`, 302); }
    const tokens = await tokenRes.json();
    const profileRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email,picture.type(large)&access_token=${tokens.access_token}`);
    if (!profileRes.ok) return Response.redirect(`${SITE_URL}?auth_error=profile_failed`, 302);
    const profile = await profileRes.json();
    const userId = await upsertUser(env.AUTH_DB, { email: profile.email || `fb_${profile.id}@facebook.user`, name: profile.name, avatar: profile.picture?.data?.url || '', provider: 'facebook', providerId: profile.id });
    return await createSessionAndRedirect(request, env, userId);
  } catch (err) { console.error('Facebook OAuth error:', err); return Response.redirect(`${SITE_URL}?auth_error=server_error`, 302); }
}

export async function handleAuthMe(request, env) { const user = await getCurrentUser(request, env); if (!user) return jsonResponse({ authenticated: false }, 200, request); return jsonResponse({ authenticated: true, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, provider: user.provider, role: user.role, created_at: user.created_at } }, 200, request); }
export async function handleLogout(request, env) { const sid = getSessionFromCookie(request); if (sid) await env.AUTH_DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sid).run(); const headers = new Headers({ 'Content-Type': 'application/json', ...corsHeaders(request) }); headers.append('Set-Cookie', clearSessionCookie()); return new Response(JSON.stringify({ success: true }), { status: 200, headers }); }
export async function handleAdminMembers(request, env) {
  const user = await getCurrentUser(request, env); if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  const url = new URL(request.url); const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200); const offset = parseInt(url.searchParams.get('offset') || '0');
  const { results } = await env.AUTH_DB.prepare('SELECT id, email, name, avatar, provider, role, created_at, last_login_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?').bind(limit, offset).all();
  const countRow = await env.AUTH_DB.prepare('SELECT COUNT(*) as total FROM users').first();
  return jsonResponse({ members: results, total: countRow.total, limit, offset }, 200, request);
}

export async function handleValidateCode(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const result = await validateCode(body.code, env.TICKER_KV);
  if (result) {
    const codeKey = body.code.trim().toLowerCase();
    if (result.maxUsers) { const user = await getCurrentUser(request, env); const usersRaw = await env.TICKER_KV.get('code_users_' + codeKey); const users = usersRaw ? JSON.parse(usersRaw) : []; const userId = user ? user.id : null; if (!(userId && users.includes(userId)) && users.length >= result.maxUsers) return jsonResponse({ valid: false, reason: 'quota_full', maxUsers: result.maxUsers }, 200, request); if (userId && !users.includes(userId)) { users.push(userId); await env.TICKER_KV.put('code_users_' + codeKey, JSON.stringify(users)); } }
    let budgetInfo = {};
    if (result.role !== 'admin' && !result.noBudget) { const user = await getCurrentUser(request, env); const usedSec = user ? await getCodeUsedTime(codeKey, env.TICKER_KV, user.id) : 0; budgetInfo = { budgetSec: INVITE_BUDGET_SEC, usedSec: +usedSec.toFixed(1), remainingSec: +Math.max(0, INVITE_BUDGET_SEC - usedSec).toFixed(1) }; }
    return jsonResponse({ valid: true, name: result.name, role: result.role, ...budgetInfo }, 200, request);
  }
  return jsonResponse({ valid: false }, 200, request);
}

export async function handleAdminGetCodes(request, env) {
  const user = await getCurrentUser(request, env); if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  try {
    const raw = await env.TICKER_KV.get('invite_codes'); const codes = raw ? JSON.parse(raw) : {}; const list = [];
    for (const [code, info] of Object.entries(codes)) {
      const usersRaw = await env.TICKER_KV.get('code_users_' + code); const userIds = usersRaw ? JSON.parse(usersRaw) : []; let totalTimeSec = 0; const userDetails = [];
      for (const uid of userIds) { const t = parseFloat(await env.TICKER_KV.get('time_' + code + '_' + uid) || '0'); totalTimeSec += t; const userRow = await env.AUTH_DB.prepare('SELECT name, email, avatar, provider, last_login_at FROM users WHERE id = ?').bind(uid).first(); userDetails.push({ id: uid, name: userRow ? userRow.name : 'Unknown', email: userRow ? userRow.email : '', provider: userRow ? userRow.provider : '', usedSec: +t.toFixed(1), remainingSec: info.role !== 'admin' ? +Math.max(0, INVITE_BUDGET_SEC - t).toFixed(1) : null, lastLogin: userRow ? userRow.last_login_at : null }); }
      userDetails.sort((a, b) => b.usedSec - a.usedSec); list.push({ code, ...info, usersCount: userIds.length, totalTimeSec: +totalTimeSec.toFixed(1), users: userDetails });
    }
    return jsonResponse({ codes: list, total: list.length }, 200, request);
  } catch (e) { return jsonResponse({ error: 'Failed to read codes: ' + e.message }, 500, request); }
}

export async function handleAdminCreateCode(request, env) {
  const user = await getCurrentUser(request, env); if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const { code, name, role } = body; if (!code || !name) return jsonResponse({ error: 'code and name are required' }, 400, request);
  const codeKey = code.trim().toLowerCase(); if (codeKey.length < 2 || codeKey.length > 32) return jsonResponse({ error: 'code must be 2-32 characters' }, 400, request);
  const validRole = (role === 'admin') ? 'admin' : 'user';
  try { const raw = await env.TICKER_KV.get('invite_codes'); const codes = raw ? JSON.parse(raw) : {}; const isNew = !codes[codeKey]; codes[codeKey] = { name: name.trim(), role: validRole }; await env.TICKER_KV.put('invite_codes', JSON.stringify(codes)); return jsonResponse({ success: true, action: isNew ? 'created' : 'updated', code: codeKey, name: name.trim(), role: validRole }, 200, request); } catch (e) { return jsonResponse({ error: 'Failed to save code: ' + e.message }, 500, request); }
}

export async function handleAdminDeleteCode(request, env) {
  const user = await getCurrentUser(request, env); if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);
  const codeKey = (new URL(request.url).searchParams.get('code') || '').trim().toLowerCase(); if (!codeKey) return jsonResponse({ error: 'code parameter required' }, 400, request);
  try { const raw = await env.TICKER_KV.get('invite_codes'); const codes = raw ? JSON.parse(raw) : {}; if (!codes[codeKey]) return jsonResponse({ error: 'Code not found' }, 404, request); delete codes[codeKey]; await env.TICKER_KV.put('invite_codes', JSON.stringify(codes)); return jsonResponse({ success: true, deleted: codeKey }, 200, request); } catch (e) { return jsonResponse({ error: 'Failed to delete code: ' + e.message }, 500, request); }
}
