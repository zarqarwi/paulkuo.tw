import { FEED_CACHE_TTL } from './config.js';
import { corsHeaders, jsonResponse, twISOString } from './utils.js';
import { authenticateRequest } from './auth.js';

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
