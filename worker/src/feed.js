import { FEED_CACHE_TTL } from './config.js';
import { corsHeaders, jsonResponse, twISOString } from './utils.js';
import { authenticateRequest } from './auth.js';

export async function handleFeedGet(request, env) {
  const raw = await env.TICKER_KV.get('feed_items'); const items = raw ? JSON.parse(raw) : [];
  return new Response(JSON.stringify({ items, updatedAt: items[0]?.datetime || null }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${FEED_CACHE_TTL}`, ...corsHeaders(request) } });
}

export async function handleFeedPush(request, env) {
  let body; try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  const auth = await authenticateRequest(request, env, body.code || '');
  if (!auth || !auth.isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, request);
  const { platform, icon, color, content, url: postUrl, datetime, category } = body;
  if (!platform || !content) return jsonResponse({ error: 'Missing platform or content' }, 400, request);
  const newItem = { platform: (icon ? icon + ' ' : '') + platform, color: color || '#666', content: content.slice(0, 500), url: postUrl || '', datetime: datetime || twISOString(), category: category || 'general' };
  const raw = await env.TICKER_KV.get('feed_items'); let items = raw ? JSON.parse(raw) : [];
  const basePlatform = platform.replace(/^[^\w]+/, '').trim();
  const idx = items.findIndex(i => i.platform.includes(basePlatform));
  if (idx >= 0) items[idx] = newItem; else items.unshift(newItem);
  items.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || '')); items = items.slice(0, 10);
  await env.TICKER_KV.put('feed_items', JSON.stringify(items));
  return jsonResponse({ ok: true, count: items.length }, 200, request);
}
