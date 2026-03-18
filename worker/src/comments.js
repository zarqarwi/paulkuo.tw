/**
 * Comments API — paulkuo.tw 留言系統
 * Created: 2026-03-18
 */
import { corsHeaders, jsonResponse, nanoid } from './utils.js';
import { getCurrentUser } from './auth.js';

// GET /api/comments?slug=xxx
export async function handleCommentsGet(request, env) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');
  if (!slug) return jsonResponse({ error: 'slug required' }, 400, request);

  const currentUser = await getCurrentUser(request, env);

  const { results } = await env.AUTH_DB.prepare(`
    SELECT
      c.id, c.article_slug, c.user_id, c.parent_id, c.content,
      c.created_at, c.updated_at, c.is_deleted,
      u.name as user_name, u.avatar as user_avatar, u.provider as user_provider,
      (SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.id) as like_count
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.article_slug = ? AND c.is_deleted = 0
    ORDER BY c.created_at DESC
  `).bind(slug).all();

  let userLikes = new Set();
  if (currentUser) {
    const commentIds = results.map(r => r.id);
    if (commentIds.length > 0) {
      const placeholders = commentIds.map(() => '?').join(',');
      const { results: likes } = await env.AUTH_DB.prepare(
        `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (${placeholders})`
      ).bind(currentUser.id, ...commentIds).all();
      userLikes = new Set(likes.map(l => l.comment_id));
    }
  }

  const comments = results.map(r => ({
    id: r.id,
    articleSlug: r.article_slug,
    parentId: r.parent_id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    user: { id: r.user_id, name: r.user_name, avatar: r.user_avatar, provider: r.user_provider },
    likeCount: r.like_count,
    isLikedByMe: userLikes.has(r.id),
    isMine: currentUser ? r.user_id === currentUser.id : false,
  }));

  return jsonResponse({ comments, total: comments.length }, 200, request);
}

// POST /api/comments
export async function handleCommentCreate(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Login required' }, 401, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }

  const { slug, content, parentId } = body;
  if (!slug || !content?.trim()) return jsonResponse({ error: 'slug and content required' }, 400, request);
  if (content.trim().length > 2000) return jsonResponse({ error: 'Content too long (max 2000 chars)' }, 400, request);

  // 如果是回覆，確認 parent 存在且屬於同篇文章
  if (parentId) {
    const parent = await env.AUTH_DB.prepare(
      'SELECT id, article_slug, user_id FROM comments WHERE id = ? AND is_deleted = 0'
    ).bind(parentId).first();
    if (!parent || parent.article_slug !== slug) return jsonResponse({ error: 'Invalid parent comment' }, 400, request);
  }

  const id = nanoid();
  await env.AUTH_DB.prepare(
    'INSERT INTO comments (id, article_slug, user_id, parent_id, content) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, slug, user.id, parentId || null, content.trim()).run();

  // === 通知 ===
  // 1. 寫 KV 通知 admin（Paul）有新留言
  const notifKey = `comment_notif:${new Date().toISOString()}:${id}`;
  await env.TICKER_KV.put(notifKey, JSON.stringify({
    commentId: id, slug, content: content.trim().slice(0, 100),
    userName: user.name, createdAt: new Date().toISOString(),
    parentId: parentId || null,
  }), { expirationTtl: 60 * 60 * 24 * 30 });

  // 2. 如果是回覆，查被回覆者的 email 並寫入通知 queue
  if (parentId) {
    const parentComment = await env.AUTH_DB.prepare(
      'SELECT c.user_id, u.email, u.name as parent_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?'
    ).bind(parentId).first();

    if (parentComment && parentComment.user_id !== user.id && parentComment.email && !parentComment.email.includes('@line.user') && !parentComment.email.includes('@facebook.user')) {
      await env.TICKER_KV.put(`email_queue:${nanoid()}`, JSON.stringify({
        to: parentComment.email,
        toName: parentComment.parent_name,
        subject: `paulkuo.tw — ${user.name} 回覆了你的留言`,
        body: `${user.name} 回覆了你在 paulkuo.tw 文章的留言：\n\n「${content.trim().slice(0, 200)}」\n\n前往查看：https://paulkuo.tw/articles/${slug}#comment-${id}`,
        createdAt: new Date().toISOString(),
      }), { expirationTtl: 60 * 60 * 24 * 7 });
    }
  }

  return jsonResponse({ id, success: true }, 201, request);
}

// PATCH /api/comments/:id
export async function handleCommentUpdate(request, env, commentId) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Login required' }, 401, request);

  const comment = await env.AUTH_DB.prepare('SELECT user_id FROM comments WHERE id = ? AND is_deleted = 0').bind(commentId).first();
  if (!comment) return jsonResponse({ error: 'Comment not found' }, 404, request);
  if (comment.user_id !== user.id) return jsonResponse({ error: 'Permission denied' }, 403, request);

  let body;
  try { body = await request.json(); } catch (e) { return jsonResponse({ error: 'Invalid JSON' }, 400, request); }
  if (!body.content?.trim()) return jsonResponse({ error: 'content required' }, 400, request);
  if (body.content.trim().length > 2000) return jsonResponse({ error: 'Content too long' }, 400, request);

  await env.AUTH_DB.prepare("UPDATE comments SET content = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(body.content.trim(), commentId).run();
  return jsonResponse({ success: true }, 200, request);
}

// DELETE /api/comments/:id
export async function handleCommentDelete(request, env, commentId) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Login required' }, 401, request);

  const comment = await env.AUTH_DB.prepare('SELECT user_id FROM comments WHERE id = ? AND is_deleted = 0').bind(commentId).first();
  if (!comment) return jsonResponse({ error: 'Comment not found' }, 404, request);

  if (comment.user_id !== user.id && user.role !== 'admin') {
    return jsonResponse({ error: 'Permission denied' }, 403, request);
  }

  await env.AUTH_DB.prepare("UPDATE comments SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?").bind(commentId).run();
  return jsonResponse({ success: true }, 200, request);
}

// POST /api/comments/:id/like (toggle)
export async function handleCommentLike(request, env, commentId) {
  const user = await getCurrentUser(request, env);
  if (!user) return jsonResponse({ error: 'Login required' }, 401, request);

  const comment = await env.AUTH_DB.prepare('SELECT id FROM comments WHERE id = ? AND is_deleted = 0').bind(commentId).first();
  if (!comment) return jsonResponse({ error: 'Comment not found' }, 404, request);

  const existing = await env.AUTH_DB.prepare(
    'SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?'
  ).bind(commentId, user.id).first();

  if (existing) {
    await env.AUTH_DB.prepare('DELETE FROM comment_likes WHERE id = ?').bind(existing.id).run();
    return jsonResponse({ liked: false }, 200, request);
  } else {
    await env.AUTH_DB.prepare(
      'INSERT INTO comment_likes (id, comment_id, user_id) VALUES (?, ?, ?)'
    ).bind(nanoid(), commentId, user.id).run();
    return jsonResponse({ liked: true }, 200, request);
  }
}

// GET /api/comments/admin/recent
export async function handleCommentsAdminRecent(request, env) {
  const user = await getCurrentUser(request, env);
  if (!user || user.role !== 'admin') return jsonResponse({ error: 'Unauthorized' }, 403, request);

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);

  const { results } = await env.AUTH_DB.prepare(`
    SELECT c.id, c.article_slug, c.content, c.created_at, c.is_deleted,
           u.name as user_name, u.avatar as user_avatar, u.email as user_email
    FROM comments c JOIN users u ON c.user_id = u.id
    ORDER BY c.created_at DESC LIMIT ?
  `).bind(limit).all();

  const notifList = await env.TICKER_KV.list({ prefix: 'comment_notif:' });

  return jsonResponse({ comments: results, unreadCount: notifList.keys.length }, 200, request);
}
