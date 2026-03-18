import { useState, useEffect, useRef, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  avatar: string;
  provider: string;
}

interface Comment {
  id: string;
  articleSlug: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  user: User;
  likeCount: number;
  isLikedByMe: boolean;
  isMine: boolean;
}

interface Props {
  slug: string;
  apiBase: string;
  lang: string;
}

const labels: Record<string, Record<string, string>> = {
  'zh-Hant': { title: '留言討論', login: '登入後留言', reply: '回覆', edit: '編輯', delete: '刪除', cancel: '取消', submit: '送出', placeholder: '分享你的想法...', noComments: '還沒有留言，成為第一個！', edited: '(已編輯)', deleted: '此留言已被刪除', loginWith: '使用以下方式登入：', replyTo: '回覆', loading: '載入中...', delConfirm: '確定要刪除這則留言嗎？', charLimit: '字', total: '則留言' },
  'en': { title: 'Comments', login: 'Login to comment', reply: 'Reply', edit: 'Edit', delete: 'Delete', cancel: 'Cancel', submit: 'Submit', placeholder: 'Share your thoughts...', noComments: 'No comments yet. Be the first!', edited: '(edited)', deleted: 'This comment has been deleted', loginWith: 'Login with:', replyTo: 'Reply to', loading: 'Loading...', delConfirm: 'Delete this comment?', charLimit: 'chars', total: 'comments' },
  'ja': { title: 'コメント', login: 'ログインしてコメント', reply: '返信', edit: '編集', delete: '削除', cancel: 'キャンセル', submit: '送信', placeholder: 'あなたの考えを共有...', noComments: 'まだコメントはありません', edited: '(編集済)', deleted: 'このコメントは削除されました', loginWith: 'ログイン方法：', replyTo: '返信先', loading: '読み込み中...', delConfirm: 'このコメントを削除しますか？', charLimit: '文字', total: 'コメント' },
  'zh-CN': { title: '留言讨论', login: '登录后留言', reply: '回复', edit: '编辑', delete: '删除', cancel: '取消', submit: '提交', placeholder: '分享你的想法...', noComments: '还没有留言，成为第一个！', edited: '(已编辑)', deleted: '此留言已被删除', loginWith: '使用以下方式登录：', replyTo: '回复', loading: '加载中...', delConfirm: '确定要删除这条留言吗？', charLimit: '字', total: '条留言' },
};

function timeAgo(dateStr: string, lang: string): string {
  const now = Date.now();
  const then = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z')).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return lang === 'en' ? 'just now' : lang === 'ja' ? 'たった今' : '剛剛';
  if (diff < 3600) { const m = Math.floor(diff / 60); return lang === 'en' ? `${m}m ago` : lang === 'ja' ? `${m}分前` : `${m} 分鐘前`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return lang === 'en' ? `${h}h ago` : lang === 'ja' ? `${h}時間前` : `${h} 小時前`; }
  if (diff < 2592000) { const d = Math.floor(diff / 86400); return lang === 'en' ? `${d}d ago` : lang === 'ja' ? `${d}日前` : `${d} 天前`; }
  return new Date(then).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
}

function providerIcon(provider: string): string {
  if (provider === 'google') return '🔵';
  if (provider === 'line') return '🟢';
  if (provider === 'facebook') return '🔷';
  return '👤';
}

export default function ArticleComments({ slug, apiBase, lang }: Props) {
  const L = labels[lang] || labels['zh-Hant'];
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/api/comments?slug=${encodeURIComponent(slug)}`, { credentials: 'include' });
      if (res.ok) { const data = await res.json(); setComments(data.comments || []); }
    } catch (e) { console.error('Failed to fetch comments:', e); }
    setLoading(false);
  }, [apiBase, slug]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${apiBase}/auth/me`, { credentials: 'include' });
        if (res.ok) { const data = await res.json(); if (data.authenticated) setCurrentUser(data.user); }
      } catch (e) {}
      setAuthChecked(true);
    };
    checkAuth();
    fetchComments();
  }, [apiBase, fetchComments]);

  const handleSubmit = async (parentId?: string | null) => {
    const content = parentId ? replyContent : newContent;
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, content: content.trim(), parentId: parentId || undefined }),
      });
      if (res.ok) {
        if (parentId) { setReplyContent(''); setReplyTo(null); } else { setNewContent(''); }
        await fetchComments();
      }
    } catch (e) { console.error('Failed to post comment:', e); }
    setSubmitting(false);
  };

  const handleLike = async (commentId: string) => {
    try {
      const res = await fetch(`${apiBase}/api/comments/${commentId}/like`, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const { liked } = await res.json();
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, isLikedByMe: liked, likeCount: c.likeCount + (liked ? 1 : -1) } : c));
      }
    } catch (e) {}
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(L.delConfirm)) return;
    try {
      const res = await fetch(`${apiBase}/api/comments/${commentId}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {}
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/api/comments/${commentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      });
      if (res.ok) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editContent.trim(), updatedAt: new Date().toISOString() } : c));
        setEditingId(null); setEditContent('');
      }
    } catch (e) {}
    setSubmitting(false);
  };

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  };

  // Separate top-level comments and replies
  const topLevel = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);
  const repliesMap = new Map<string, Comment[]>();
  replies.forEach(r => {
    const arr = repliesMap.get(r.parentId!) || [];
    arr.push(r);
    repliesMap.set(r.parentId!, arr);
  });

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    const commentReplies = repliesMap.get(comment.id) || [];

    return (
      <div key={comment.id} id={`comment-${comment.id}`} style={{
        marginLeft: isReply ? 24 : 0,
        borderLeft: isReply ? '3px solid var(--accent-ai)' : 'none',
        paddingLeft: isReply ? 16 : 0,
        marginBottom: 16,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
        }}>
          {/* Header: avatar + name + time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {comment.user.avatar ? (
              <img src={comment.user.avatar} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {providerIcon(comment.user.provider)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{comment.user.name}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                {timeAgo(comment.createdAt, lang)}
                {comment.updatedAt && <span style={{ marginLeft: 4 }}>{L.edited}</span>}
              </span>
            </div>
          </div>

          {/* Content or edit mode */}
          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => { setEditContent(e.target.value); autoGrow(e.target); }}
                maxLength={2000}
                style={{
                  width: '100%', minHeight: 60, padding: '10px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--bg)',
                  color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 14,
                  resize: 'none', lineHeight: 1.6,
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setEditingId(null); setEditContent(''); }} style={btnStyle}>{L.cancel}</button>
                <button onClick={() => handleEdit(comment.id)} disabled={submitting} style={{ ...btnPrimaryStyle, opacity: submitting ? 0.5 : 1 }}>{L.submit}</button>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{comment.content}</p>
          )}

          {/* Actions: like, reply, edit, delete */}
          {!isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
              {authChecked && currentUser && (
                <button onClick={() => handleLike(comment.id)} style={{
                  ...actionBtnStyle,
                  color: comment.isLikedByMe ? '#EF4444' : 'var(--text-muted)',
                }}>
                  {comment.isLikedByMe ? '❤️' : '🤍'} {comment.likeCount > 0 ? comment.likeCount : ''}
                </button>
              )}
              {!currentUser && comment.likeCount > 0 && (
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>❤️ {comment.likeCount}</span>
              )}
              {currentUser && !isReply && (
                <button onClick={() => { setReplyTo(replyTo?.id === comment.id ? null : comment); setReplyContent(''); }} style={actionBtnStyle}>
                  {L.reply}
                </button>
              )}
              {comment.isMine && (
                <>
                  <button onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }} style={actionBtnStyle}>{L.edit}</button>
                  <button onClick={() => handleDelete(comment.id)} style={{ ...actionBtnStyle, color: '#EF4444' }}>{L.delete}</button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Reply input */}
        {replyTo?.id === comment.id && currentUser && (
          <div style={{ marginTop: 8, marginLeft: 24, borderLeft: '3px solid var(--accent-ai)', paddingLeft: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
              {L.replyTo} {comment.user.name}
            </div>
            <textarea
              ref={replyTextareaRef}
              value={replyContent}
              onChange={e => { setReplyContent(e.target.value); autoGrow(e.target); }}
              placeholder={L.placeholder}
              maxLength={2000}
              style={textareaStyle}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 'auto' }}>{replyContent.length}/2000</span>
              <button onClick={() => { setReplyTo(null); setReplyContent(''); }} style={btnStyle}>{L.cancel}</button>
              <button onClick={() => handleSubmit(comment.id)} disabled={submitting || !replyContent.trim()} style={{ ...btnPrimaryStyle, opacity: (submitting || !replyContent.trim()) ? 0.5 : 1 }}>{L.submit}</button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {!isReply && commentReplies.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {commentReplies.map(r => renderComment(r, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 40, marginBottom: 24 }}>
      <h2 style={{
        fontSize: 20, fontWeight: 700, color: 'var(--text-primary)',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        💬 {L.title}
        {comments.length > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({comments.length})</span>}
      </h2>

      {/* New comment input (logged in) */}
      {authChecked && currentUser && (
        <div style={{
          marginBottom: 24, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {providerIcon((currentUser as any).provider || '')}
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{currentUser.name}</span>
          </div>
          <textarea
            ref={textareaRef}
            value={newContent}
            onChange={e => { setNewContent(e.target.value); autoGrow(e.target); }}
            placeholder={L.placeholder}
            maxLength={2000}
            style={textareaStyle}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 'auto' }}>{newContent.length}/2000</span>
            <button onClick={() => handleSubmit()} disabled={submitting || !newContent.trim()} style={{ ...btnPrimaryStyle, opacity: (submitting || !newContent.trim()) ? 0.5 : 1 }}>
              {submitting ? '...' : L.submit}
            </button>
          </div>
        </div>
      )}

      {/* Login prompt (not logged in) */}
      {authChecked && !currentUser && (
        <div style={{
          marginBottom: 24, background: 'var(--bg-card)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)',
          padding: '20px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 12 }}>{L.loginWith}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={`${apiBase}/auth/google/login?redirect=/articles/${slug}`} style={oauthBtnStyle}>
              🔵 Google
            </a>
            <a href={`${apiBase}/auth/line/login?redirect=/articles/${slug}`} style={{ ...oauthBtnStyle, borderColor: '#06C755' }}>
              🟢 LINE
            </a>
            <a href={`${apiBase}/auth/facebook/login?redirect=/articles/${slug}`} style={{ ...oauthBtnStyle, borderColor: '#1877F2' }}>
              🔷 Facebook
            </a>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>{L.loading}</p>}

      {/* No comments */}
      {!loading && comments.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 15 }}>{L.noComments}</p>
      )}

      {/* Comments list */}
      {!loading && topLevel.map(c => renderComment(c))}
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
  width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg)',
  color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 15,
  resize: 'none', lineHeight: 1.6, outline: 'none',
};

const btnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg)', color: 'var(--text-secondary)',
  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
};

const btnPrimaryStyle: React.CSSProperties = {
  padding: '6px 18px', borderRadius: 8, border: 'none',
  background: 'var(--accent-ai)', color: '#fff',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
};

const actionBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', padding: '2px 4px',
  fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer',
  fontFamily: 'inherit',
};

const oauthBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 18px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-card)',
  color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
  textDecoration: 'none', fontFamily: 'inherit', cursor: 'pointer',
};
