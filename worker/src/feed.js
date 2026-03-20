import { FEED_CACHE_TTL } from './config.js';
import { corsHeaders, jsonResponse, twISOString } from './utils.js';
import { authenticateRequest } from './auth.js';
import { pctEncode, hmacSha1 } from './social.js';

export async function handleFeedGet(request, env) {
  const raw = await env.TICKER_KV.get('feed_items'); const socialItems = raw ? JSON.parse(raw) : [];

  // 最近留言活動（混入動態 feed）
  let commentItems = [];
  try {
    const { results: recentComments } = await env.AUTH_DB.prepare(`
      SELECT
        c.id, c.article_slug, c.content, c.created_at, c.parent_id,
        u.name as user_name,
        p.id as parent_comment_id,
        pu.name as parent_user_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN comments p ON c.parent_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE c.is_deleted = 0
      ORDER BY c.created_at DESC
      LIMIT 5
    `).all();

    commentItems = recentComments.map(c => {
      const readableSlug = c.article_slug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());

      let content;
      if (c.parent_id && c.parent_user_name) {
        content = `${c.user_name} 回覆了 ${c.parent_user_name} 在「${readableSlug}」的留言`;
      } else {
        const excerpt = c.content.length > 80
          ? c.content.slice(0, 80) + '…'
          : c.content;
        content = `${c.user_name} 在「${readableSlug}」留言：「${excerpt}」`;
      }

      return {
        platform: '💬 paulkuo.tw',
        color: 'var(--accent-ai)',
        content,
        url: `/articles/${c.article_slug}#comment-${c.id}`,
        datetime: c.created_at,
        category: 'comment',
      };
    });
  } catch (e) {
    // comments table 不存在時不要炸掉整個 feed
    console.error('Feed: comment query failed:', e.message);
  }

  // 最近公開 Scorecard 評估
  let scorecardItems = [];
  try {
    const { results: recentEvals } = await env.AUTH_DB.prepare(`
      SELECT id, project_name, total_score, verdict, created_at
      FROM scorecard_evaluations
      WHERE is_public = 1
      ORDER BY created_at DESC
      LIMIT 3
    `).all();

    const VERDICT_MAP = {
      go: { emoji: '🚀', label: '全力推進' },
      conditional: { emoji: '✅', label: '有條件推進' },
      watch: { emoji: '⚠️', label: '觀望補強' },
      pause: { emoji: '❌', label: '暫停或轉向' },
    };
    function matchVerdict(v) {
      if (!v) return VERDICT_MAP.watch;
      const lower = v.toLowerCase();
      if (lower.includes('推薦') || lower.includes('潛力') || lower.includes('go')) return VERDICT_MAP.go;
      if (lower.includes('值得') || lower.includes('conditional')) return VERDICT_MAP.conditional;
      if (lower.includes('轉向') || lower.includes('pause') || lower.includes('stop')) return VERDICT_MAP.pause;
      return VERDICT_MAP.watch;
    }
    scorecardItems = recentEvals.map(e => {
      const v = matchVerdict(e.verdict);
      return {
        platform: '🎯 SCORECARD',
        color: '#2563eb',
        content: `📊 Builder's Scorecard 產品體檢：${e.project_name} 獲得 ${Number(e.total_score).toFixed(1)}/10 分 ${v.emoji}（${v.label}）— 五維度 AI 自動評估`,
        url: `https://paulkuo.tw/tools/builders-scorecard/eval/${e.id}`,
        datetime: e.created_at,
        category: 'scorecard',
      };
    });
  } catch (e) {
    console.error('Feed: scorecard query failed:', e.message);
  }

  const allItems = [...socialItems, ...commentItems, ...scorecardItems]
    .sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''))
    .slice(0, 12);

  return new Response(JSON.stringify({ items: allItems, updatedAt: allItems[0]?.datetime || null }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${FEED_CACHE_TTL}`, ...corsHeaders(request) } });
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

/**
 * syncSocialFeed — cron 定期拉各平台最新貼文，upsert 到 KV feed_items
 * Returns diagnostic log array when called from handleFeedSync
 */
export async function syncSocialFeed(env) {
  const raw = await env.TICKER_KV.get('feed_items');
  let items = raw ? JSON.parse(raw) : [];
  let updated = false;
  const log = [];

  // ── Bluesky（公開 API，不需認證）──
  try {
    const handle = (env.BLUESKY_HANDLE || 'paulkuo.bsky.social').replace(/^@/, '');
    const bskyResp = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&filter=posts_no_replies&limit=3`
    );
    if (bskyResp.ok) {
      const data = await bskyResp.json();
      const latestPost = data.feed?.[0]?.post;
      if (latestPost) {
        const rkey = latestPost.uri?.split('/').pop() || '';
        const newItem = {
          platform: '🦋 Bluesky',
          color: '#0085FF',
          content: (latestPost.record?.text || '').slice(0, 500),
          url: `https://bsky.app/profile/${handle}/post/${rkey}`,
          datetime: latestPost.record?.createdAt || new Date().toISOString(),
          category: 'social',
        };
        const idx = items.findIndex(i => i.platform?.includes('Bluesky'));
        if (idx >= 0) {
          if (items[idx].content !== newItem.content) {
            items[idx] = newItem;
            updated = true;
            log.push({ platform: 'bluesky', status: 'updated', content: newItem.content.slice(0, 80) });
          } else {
            log.push({ platform: 'bluesky', status: 'unchanged' });
          }
        } else {
          items.unshift(newItem);
          updated = true;
          log.push({ platform: 'bluesky', status: 'added', content: newItem.content.slice(0, 80) });
        }
      } else {
        log.push({ platform: 'bluesky', status: 'no_posts' });
      }
    } else {
      log.push({ platform: 'bluesky', status: 'error', code: bskyResp.status });
    }
  } catch (e) {
    console.error('syncSocialFeed Bluesky failed:', e.message);
    log.push({ platform: 'bluesky', status: 'exception', error: e.message });
  }

  // ── Threads ──
  try {
    if (env.THREADS_USER_ID && env.THREADS_ACCESS_TOKEN) {
      const thResp = await fetch(
        `https://graph.threads.net/v1.0/${env.THREADS_USER_ID}/threads?fields=id,text,timestamp,permalink&access_token=${env.THREADS_ACCESS_TOKEN}&limit=3`
      );
      if (thResp.ok) {
        const data = await thResp.json();
        const postCount = data.data?.length || 0;
        console.log('syncSocialFeed Threads: API returned', postCount, 'posts');
        const latestPost = data.data?.[0];
        if (latestPost?.text) {
          const newItem = {
            platform: '◉ Threads',
            color: '#000000',
            content: latestPost.text.slice(0, 500),
            url: latestPost.permalink || '',
            datetime: latestPost.timestamp || new Date().toISOString(),
            category: 'social',
          };
          const idx = items.findIndex(i => i.platform?.includes('Threads'));
          if (idx >= 0) {
            if (items[idx].content !== newItem.content) {
              items[idx] = newItem;
              updated = true;
              log.push({ platform: 'threads', status: 'updated', postCount, content: newItem.content.slice(0, 80) });
            } else {
              console.log('syncSocialFeed Threads: content unchanged, skipping');
              log.push({ platform: 'threads', status: 'unchanged', postCount });
            }
          } else {
            items.unshift(newItem);
            updated = true;
            log.push({ platform: 'threads', status: 'added', postCount, content: newItem.content.slice(0, 80) });
          }
        } else {
          log.push({ platform: 'threads', status: 'no_text_in_latest', postCount });
        }
      } else {
        const errText = await thResp.text().catch(() => '');
        console.error('syncSocialFeed Threads error:', thResp.status, errText.slice(0, 300));
        log.push({ platform: 'threads', status: 'error', code: thResp.status, error: errText.slice(0, 200) });
      }
    } else {
      log.push({ platform: 'threads', status: 'no_credentials' });
    }
  } catch (e) {
    console.error('syncSocialFeed Threads failed:', e.message);
    log.push({ platform: 'threads', status: 'exception', error: e.message });
  }

  // ── X（OAuth 1.0a — 試讀 timeline，403 就跳過）──
  try {
    const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET } = env;
    if (X_API_KEY && X_ACCESS_TOKEN) {
      const meUrl = 'https://api.twitter.com/2/users/me';
      const meOp = {
        oauth_consumer_key: X_API_KEY,
        oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
        oauth_signature_method: 'HMAC-SHA1',
        oauth_timestamp: String(Math.floor(Date.now() / 1000)),
        oauth_token: X_ACCESS_TOKEN,
        oauth_version: '1.0',
      };
      const meParamStr = Object.keys(meOp).sort().map(k => `${pctEncode(k)}=${pctEncode(meOp[k])}`).join('&');
      const meBaseStr = `GET&${pctEncode(meUrl)}&${pctEncode(meParamStr)}`;
      meOp.oauth_signature = await hmacSha1(`${pctEncode(X_API_SECRET)}&${pctEncode(X_ACCESS_TOKEN_SECRET)}`, meBaseStr);
      const meAuth = 'OAuth ' + Object.keys(meOp).sort().map(k => `${pctEncode(k)}="${pctEncode(meOp[k])}"`).join(', ');

      const meResp = await fetch(meUrl, { headers: { Authorization: meAuth } });
      if (meResp.ok) {
        const meData = await meResp.json();
        const userId = meData.data?.id;
        if (userId) {
          const tweetsUrl = `https://api.twitter.com/2/users/${userId}/tweets`;
          const queryParams = { max_results: '5', 'tweet.fields': 'created_at,text' };
          const tOp = {
            oauth_consumer_key: X_API_KEY,
            oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
            oauth_signature_method: 'HMAC-SHA1',
            oauth_timestamp: String(Math.floor(Date.now() / 1000)),
            oauth_token: X_ACCESS_TOKEN,
            oauth_version: '1.0',
          };
          const allParams = { ...tOp, ...queryParams };
          const tParamStr = Object.keys(allParams).sort().map(k => `${pctEncode(k)}=${pctEncode(allParams[k])}`).join('&');
          const tBaseStr = `GET&${pctEncode(tweetsUrl)}&${pctEncode(tParamStr)}`;
          tOp.oauth_signature = await hmacSha1(`${pctEncode(X_API_SECRET)}&${pctEncode(X_ACCESS_TOKEN_SECRET)}`, tBaseStr);
          const tAuth = 'OAuth ' + Object.keys(tOp).sort().map(k => `${pctEncode(k)}="${pctEncode(tOp[k])}"`).join(', ');

          const qs = new URLSearchParams(queryParams).toString();
          const tResp = await fetch(`${tweetsUrl}?${qs}`, { headers: { Authorization: tAuth } });
          if (tResp.ok) {
            const tData = await tResp.json();
            const latestTweet = tData.data?.[0];
            if (latestTweet) {
              const newItem = {
                platform: '𝕏 X',
                color: '#1DA1F2',
                content: (latestTweet.text || '').slice(0, 500),
                url: `https://x.com/i/status/${latestTweet.id}`,
                datetime: latestTweet.created_at || new Date().toISOString(),
                category: 'social',
              };
              const idx = items.findIndex(i => i.platform?.includes('X') && !i.platform?.includes('Bluesky'));
              if (idx >= 0) {
                if (items[idx].content !== newItem.content) {
                  items[idx] = newItem;
                  updated = true;
                  log.push({ platform: 'x', status: 'updated', content: newItem.content.slice(0, 80) });
                } else {
                  log.push({ platform: 'x', status: 'unchanged' });
                }
              } else {
                items.unshift(newItem);
                updated = true;
                log.push({ platform: 'x', status: 'added', content: newItem.content.slice(0, 80) });
              }
            } else {
              log.push({ platform: 'x', status: 'no_tweets' });
            }
          } else {
            log.push({ platform: 'x', status: 'timeline_error', code: tResp.status });
            console.log('syncSocialFeed X timeline:', tResp.status, '— tier may not support reads');
          }
        }
      } else {
        log.push({ platform: 'x', status: 'me_error', code: meResp.status });
        console.log('syncSocialFeed X /users/me:', meResp.status);
      }
    } else {
      log.push({ platform: 'x', status: 'no_credentials' });
    }
  } catch (e) {
    console.error('syncSocialFeed X failed:', e.message);
    log.push({ platform: 'x', status: 'exception', error: e.message });
  }

  // 寫回 KV
  if (updated) {
    items.sort((a, b) => (b.datetime || '').localeCompare(a.datetime || ''));
    items = items.slice(0, 10);
    await env.TICKER_KV.put('feed_items', JSON.stringify(items));
    console.log('syncSocialFeed: KV updated');
  }

  return { updated, log };
}

/**
 * POST /feed/sync — admin-only manual trigger for syncSocialFeed with diagnostics
 */
export async function handleFeedSync(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'POST required' }, 405, request);
  const auth = await authenticateRequest(request, env, '');
  if (!auth || !auth.isAdmin) {
    // Also allow query param ?code=admin_code
    const url = new URL(request.url);
    const code = url.searchParams.get('code') || '';
    const auth2 = await authenticateRequest(request, env, code);
    if (!auth2 || !auth2.isAdmin) return jsonResponse({ error: 'Admin access required' }, 403, request);
  }
  const result = await syncSocialFeed(env);
  return jsonResponse({ ok: true, ...result, timestamp: twISOString() }, 200, request);
}
