/**
 * social.js — Social Media Publishing Module
 * Platforms: X, Threads, LinkedIn, Medium, Bluesky
 * All endpoints admin-only. Successful posts auto-push to feed KV.
 */
import { LINKEDIN_API_VERSION } from './config.js';
import { jsonResponse, twISOString } from './utils.js';
import { getCurrentUser } from './auth.js';

const PLATFORM_FEED = {
  x:        { icon: '𝕏', name: 'X',        color: '#1DA1F2' },
  threads:  { icon: '◉', name: 'Threads',  color: '#000000' },
  linkedin: { icon: 'in', name: 'LinkedIn', color: '#0A66C2' },
  medium:   { icon: '📝', name: 'Medium',   color: '#00AB6C' },
  bluesky:  { icon: '🦋', name: 'Bluesky',  color: '#0085FF' },
};

// ═══════════════════════════════════════════════════════
//  X (Twitter) — OAuth 1.0a + HMAC-SHA1
// ═══════════════════════════════════════════════════════

export function pctEncode(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

export async function hmacSha1(key, data) {
  const ck = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(key),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', ck, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function publishX(text, url, env) {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = env;
  if (!X_API_KEY || !X_ACCESS_TOKEN) return { success: false, error: 'X credentials not configured' };

  let tweet = url ? `${text}\n\n${url}` : text;
  if (tweet.length > 280) tweet = tweet.slice(0, 277) + '...';

  const apiUrl = 'https://api.twitter.com/2/tweets';
  const op = {
    oauth_consumer_key: X_API_KEY,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: X_ACCESS_TOKEN,
    oauth_version: '1.0',
  };
  const paramStr = Object.keys(op).sort().map(k => `${pctEncode(k)}=${pctEncode(op[k])}`).join('&');
  const baseStr = `POST&${pctEncode(apiUrl)}&${pctEncode(paramStr)}`;
  op.oauth_signature = await hmacSha1(`${pctEncode(X_API_SECRET)}&${pctEncode(X_ACCESS_TOKEN_SECRET)}`, baseStr);

  const auth = 'OAuth ' + Object.keys(op).sort().map(k => `${pctEncode(k)}="${pctEncode(op[k])}"`).join(', ');
  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: tweet }),
  });
  if (resp.status === 200 || resp.status === 201) {
    const id = (await resp.json()).data?.id || '';
    return { success: true, id, url: `https://x.com/i/status/${id}` };
  }
  return { success: false, error: `${resp.status}: ${(await resp.text()).slice(0, 200)}` };
}

// ═══════════════════════════════════════════════════════
//  Threads — Meta Graph API (two-step)
// ═══════════════════════════════════════════════════════

async function publishThreads(text, linkUrl, env) {
  const { THREADS_USER_ID, THREADS_ACCESS_TOKEN } = env;
  if (!THREADS_USER_ID || !THREADS_ACCESS_TOKEN) return { success: false, error: 'Threads credentials not configured' };

  let post = linkUrl ? `${text}\n\n${linkUrl}` : text;
  if (post.length > 500) post = post.slice(0, 497) + '...';

  // Step 1: create media container
  const r1 = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ media_type: 'TEXT', text: post, access_token: THREADS_ACCESS_TOKEN }),
  });
  if (r1.status !== 200) return { success: false, error: `Container ${r1.status}: ${(await r1.text()).slice(0, 200)}` };
  const containerId = (await r1.json()).id;
  if (!containerId) return { success: false, error: 'No container ID' };

  // Wait for processing
  await new Promise(r => setTimeout(r, 3000));

  // Step 2: publish
  const r2 = await fetch(`https://graph.threads.net/v1.0/${THREADS_USER_ID}/threads_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ creation_id: containerId, access_token: THREADS_ACCESS_TOKEN }),
  });
  if (r2.status === 200) {
    const id = (await r2.json()).id || '';
    return { success: true, id };
  }
  return { success: false, error: `Publish ${r2.status}: ${(await r2.text()).slice(0, 200)}` };
}

// ═══════════════════════════════════════════════════════
//  LinkedIn — Posts API v2
// ═══════════════════════════════════════════════════════

async function getLinkedInUrn(env) {
  const cached = await env.TICKER_KV.get('linkedin_urn');
  if (cached) return cached;
  const resp = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}` },
  });
  if (resp.status !== 200) return null;
  const urn = `urn:li:person:${(await resp.json()).sub}`;
  await env.TICKER_KV.put('linkedin_urn', urn, { expirationTtl: 2592000 });
  return urn;
}

async function publishLinkedIn(text, articleUrl, articleTitle, env) {
  if (!env.LINKEDIN_ACCESS_TOKEN) return { success: false, error: 'LinkedIn token not configured' };
  const urn = await getLinkedInUrn(env);
  if (!urn) return { success: false, error: 'Cannot get LinkedIn URN (token expired?)' };

  const payload = {
    author: urn, commentary: text, visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false,
  };
  if (articleUrl) payload.content = { article: { source: articleUrl, title: articleTitle || '', description: '' } };

  const resp = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.LINKEDIN_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(payload),
  });
  if (resp.status === 200 || resp.status === 201) {
    return { success: true, id: resp.headers.get('x-restli-id') || '' };
  }
  return { success: false, error: `${resp.status}: ${(await resp.text()).slice(0, 200)}` };
}

// ═══════════════════════════════════════════════════════
//  Medium — REST API
// ═══════════════════════════════════════════════════════

async function getMediumUserId(env) {
  const cached = await env.TICKER_KV.get('medium_user_id');
  if (cached) return cached;
  const resp = await fetch('https://api.medium.com/v1/me', {
    headers: { Authorization: `Bearer ${env.MEDIUM_TOKEN}`, Accept: 'application/json' },
  });
  if (resp.status !== 200) return null;
  const id = (await resp.json()).data?.id;
  if (id) await env.TICKER_KV.put('medium_user_id', id, { expirationTtl: 2592000 });
  return id;
}

async function publishMedium(title, content, tags, canonicalUrl, publishStatus, env) {
  if (!env.MEDIUM_TOKEN) return { success: false, error: 'Medium token not configured' };
  const userId = await getMediumUserId(env);
  if (!userId) return { success: false, error: 'Cannot get Medium user ID' };

  const payload = { title, contentFormat: 'markdown', content: content || `# ${title}`, publishStatus: publishStatus || 'draft', notifyFollowers: false };
  if (tags?.length) payload.tags = tags.slice(0, 3);
  if (canonicalUrl) payload.canonicalUrl = canonicalUrl;

  const resp = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.MEDIUM_TOKEN}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  if (resp.status === 200 || resp.status === 201) {
    const d = (await resp.json()).data || {};
    return { success: true, id: d.id || '', url: d.url || '' };
  }
  return { success: false, error: `${resp.status}: ${(await resp.text()).slice(0, 200)}` };
}

// ═══════════════════════════════════════════════════════
//  Bluesky — AT Protocol
// ═══════════════════════════════════════════════════════

async function publishBluesky(text, linkUrl, env) {
  const { BLUESKY_HANDLE, BLUESKY_APP_PASSWORD } = env;
  if (!BLUESKY_HANDLE || !BLUESKY_APP_PASSWORD) return { success: false, error: 'Bluesky credentials not configured' };

  const sesResp = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: BLUESKY_HANDLE, password: BLUESKY_APP_PASSWORD }),
  });
  if (sesResp.status !== 200) return { success: false, error: `Auth ${sesResp.status}: ${(await sesResp.text()).slice(0, 200)}` };
  const session = await sesResp.json();

  let post = linkUrl ? `${text}\n\n${linkUrl}` : text;
  if (post.length > 300) post = post.slice(0, 297) + '...';

  // Build link facet
  const facets = [];
  if (linkUrl) {
    const idx = post.indexOf(linkUrl);
    if (idx >= 0) {
      const enc = new TextEncoder();
      const byteStart = enc.encode(post.slice(0, idx)).length;
      facets.push({
        index: { byteStart, byteEnd: byteStart + enc.encode(linkUrl).length },
        features: [{ $type: 'app.bsky.richtext.facet#link', uri: linkUrl }],
      });
    }
  }

  const record = { $type: 'app.bsky.feed.post', text: post, createdAt: new Date().toISOString() };
  if (facets.length) record.facets = facets;

  const resp = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
    method: 'POST',
    headers: { Authorization: `Bearer ${session.accessJwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
  });
  if (resp.status === 200) {
    const d = await resp.json();
    const rkey = d.uri?.split('/').pop() || '';
    const handle = BLUESKY_HANDLE.replace(/^@/, '');
    return { success: true, id: d.uri || '', url: `https://bsky.app/profile/${handle}/post/${rkey}` };
  }
  return { success: false, error: `${resp.status}: ${(await resp.text()).slice(0, 200)}` };
}

// ═══════════════════════════════════════════════════════
//  Feed Push (inline KV write, no HTTP round-trip)
// ═══════════════════════════════════════════════════════

async function pushFeed(platform, content, postUrl, env) {
  const cfg = PLATFORM_FEED[platform];
  if (!cfg) return;
  const item = { platform: `${cfg.icon} ${cfg.name}`, color: cfg.color, content: content.slice(0, 500), url: postUrl, datetime: twISOString(), category: 'general' };
  const raw = await env.TICKER_KV.get('feed_items');
  let items = raw ? JSON.parse(raw) : [];
  const idx = items.findIndex(i => i.platform.includes(cfg.name));
  if (idx >= 0) items[idx] = item; else items.unshift(item);
  items.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
  items = items.slice(0, 10);
  await env.TICKER_KV.put('feed_items', JSON.stringify(items));
}

// ═══════════════════════════════════════════════════════
//  Route Handlers
// ═══════════════════════════════════════════════════════

/**
 * POST /social/publish
 * Body: { platforms: string[], text, title?, url?, tags?, medium_content?, medium_status? }
 */
export async function handleSocialPublish(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403, request);

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { platforms, text, title, url, tags, medium_content, medium_status } = body;
  if (!platforms?.length || !text) return jsonResponse({ error: 'platforms[] and text are required' }, 400, request);

  const results = {};
  const tasks = [];

  for (const p of platforms) {
    switch (p) {
      case 'x':        tasks.push(publishX(text, url, env).then(r => { results.x = r; })); break;
      case 'threads':  tasks.push(publishThreads(text, url, env).then(r => { results.threads = r; })); break;
      case 'linkedin': tasks.push(publishLinkedIn(text, url, title, env).then(r => { results.linkedin = r; })); break;
      case 'medium':   tasks.push(publishMedium(title || text.slice(0, 100), medium_content || text, tags, url, medium_status, env).then(r => { results.medium = r; })); break;
      case 'bluesky':  tasks.push(publishBluesky(text, url, env).then(r => { results.bluesky = r; })); break;
      default:         results[p] = { success: false, error: `Unknown platform: ${p}` };
    }
  }

  await Promise.allSettled(tasks);

  // Feed push for successes
  const feedTasks = [];
  for (const [p, r] of Object.entries(results)) {
    if (r.success) feedTasks.push(pushFeed(p, text, r.url || url || '', env));
  }
  if (feedTasks.length) await Promise.allSettled(feedTasks);

  const ok = Object.values(results).filter(r => r.success).length;
  return jsonResponse({ results, summary: { total: Object.keys(results).length, success: ok }, timestamp: twISOString() }, 200, request);
}

/**
 * GET /social/status — check which platforms have credentials configured
 */
export async function handleSocialStatus(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403, request);

  const s = {
    x:        { configured: !!(env.X_API_KEY && env.X_ACCESS_TOKEN), note: 'OAuth 1.0a, no expiry' },
    threads:  { configured: !!(env.THREADS_USER_ID && env.THREADS_ACCESS_TOKEN), note: '60-day token' },
    linkedin: { configured: !!env.LINKEDIN_ACCESS_TOKEN, note: '60-day token' },
    medium:   { configured: !!env.MEDIUM_TOKEN, note: 'Integration token, no expiry' },
    bluesky:  { configured: !!(env.BLUESKY_HANDLE && env.BLUESKY_APP_PASSWORD), note: 'App password, no expiry' },
  };
  if (s.linkedin.configured) s.linkedin.urnCached = !!(await env.TICKER_KV.get('linkedin_urn'));
  if (s.threads.configured) {
    try {
      const r = await fetch(`https://graph.threads.net/v1.0/${env.THREADS_USER_ID}?fields=id&access_token=${env.THREADS_ACCESS_TOKEN}`);
      s.threads.tokenValid = r.status === 200;
    } catch { s.threads.tokenValid = false; }
  }
  return jsonResponse({ platforms: s, timestamp: twISOString() }, 200, request);
}

/**
 * POST /social/refresh — refresh expiring tokens (Threads/LinkedIn)
 * Body: { platform?: 'threads'|'linkedin' } — omit to refresh all
 */
export async function handleSocialRefresh(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Admin access required' }, 403, request);

  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { platform } = body;
  const results = {};

  // Threads: exchange current token for new long-lived token
  if ((!platform || platform === 'threads') && env.THREADS_ACCESS_TOKEN) {
    try {
      const r = await fetch(`https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${env.THREADS_ACCESS_TOKEN}`);
      if (r.status === 200) {
        const d = await r.json();
        results.threads = { success: true, expiresInDays: Math.round((d.expires_in || 0) / 86400), newTokenPrefix: d.access_token?.slice(0, 12) + '...', note: 'Run: wrangler secret put THREADS_ACCESS_TOKEN --config wrangler.toml' };
      } else {
        results.threads = { success: false, error: `${r.status}: ${(await r.text()).slice(0, 200)}` };
      }
    } catch (e) { results.threads = { success: false, error: e.message }; }
  }

  // LinkedIn: cannot auto-refresh with "Sign In" scope
  if ((!platform || platform === 'linkedin') && env.LINKEDIN_ACCESS_TOKEN) {
    await env.TICKER_KV.delete('linkedin_urn');
    results.linkedin = { success: false, note: 'LinkedIn "Sign In" tokens cannot auto-refresh. Re-authorize at linkedin.com/developers/tools/oauth/token-generator, then: wrangler secret put LINKEDIN_ACCESS_TOKEN --config wrangler.toml' };
  }

  return jsonResponse({ results, timestamp: twISOString() }, 200, request);
}
