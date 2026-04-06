# Handoff: Wiki 概念頁 — 來源引用加連結 + 社群分享按鈕

> 來源：Cowork session 2026-04-06
> 目標：Code session 執行
> 風險：L1（UI 改動，不影響 data）

---

## 背景

Paul 上線看了 /wiki/ 概念頁，提了兩個需求：
1. 「來源引用」區的 article 類型 source 應該要能點擊連回 paulkuo.tw 原文
2. 概念頁需要社群分享按鈕（複製連結 / X / LINE / Threads）

---

## Step 0 偵察

```bash
# 確認 article source 的 raw_source_path 格式
grep -m5 'raw_source_path' src/content/wiki/sources/article-*.md

# 確認有多少 article source
ls src/content/wiki/sources/article-*.md | wc -l

# 看 [slug].astro 的 source-item 渲染邏輯
grep -A5 'source-item' src/pages/wiki/\[slug\].astro

# 看有沒有現成的 share component
grep -rn 'share' src/components/ --include="*.astro" --include="*.tsx" -l
```

---

## Task A: Article Source 加連結

### 目標
在概念頁「來源引用」區，article 類型的 source title 要能點擊，連到 `/articles/{slug}/`。

### 邏輯
article source 檔名格式是 `article-{slug}.md`，所以文章路徑 = `/articles/{slug}/`（去掉 `article-` 前綴）。

例如：
- source 檔案：`article-ai-agent-planning-guide.md`
- 對應文章：`/articles/ai-agent-planning-guide/`

也可以從 `raw_source_path` 取：`src/content/articles/{slug}.md` → `/articles/{slug}/`

### 修改位置
`src/pages/wiki/[slug].astro` — source-item 渲染區塊

### 修改內容

把目前的純文字 `<span class="source-title">`，改成條件式連結：

```astro
{(() => {
  const sourceSlug = s.data.slug || s.id.replace(/\.md$/, '');
  const isArticle = s.data.raw_source_type === 'article';
  const articleSlug = isArticle ? sourceSlug.replace(/^article-/, '') : null;
  return isArticle && articleSlug ? (
    <a href={`/articles/${articleSlug}/`} class="source-title source-link">
      {s.data.title}
    </a>
  ) : (
    <span class="source-title">{s.data.title}</span>
  );
})()}
```

### 新增 CSS

```css
.source-link {
  color: var(--accent-ai, #2563eb);
  text-decoration: none;
}
.source-link:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}
```

### 注意
- 只有 `raw_source_type === 'article'` 的才加連結
- getnote 和 clip 類型不加連結（沒有公開路由）
- 不需要改 data layer，純 template 層改動

---

## Task B: 社群分享按鈕

### 目標
在概念頁 header 下方（meta 區塊旁或下面）加一排分享按鈕。

### 按鈕
1. **複製連結** — 點擊後複製 `https://paulkuo.tw/wiki/{slug}/` 到剪貼簿，按鈕文字短暫變成「已複製！」
2. **分享到 X** — 開新視窗 `https://twitter.com/intent/tweet?url={url}&text={title}`
3. **分享到 LINE** — 開新視窗 `https://social-plugins.line.me/lineit/share?url={url}`
4. **分享到 Threads** — 開新視窗 `https://www.threads.net/intent/post?text={title} {url}`

### 修改位置
`src/pages/wiki/[slug].astro` — 在 `<header class="concept-header">` 結尾後面加

### HTML 結構

```astro
<div class="wiki-share-bar">
  <button class="share-btn share-copy" data-url={`${SITE.url}/wiki/${slug}/`}>
    <svg>...</svg> 複製連結
  </button>
  <a class="share-btn share-x" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(SITE.url + '/wiki/' + slug + '/')}&text=${encodeURIComponent(title + ' — Paul Kuo 知識圖譜')}`} target="_blank" rel="noopener">
    X
  </a>
  <a class="share-btn share-line" href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE.url + '/wiki/' + slug + '/')}`} target="_blank" rel="noopener">
    LINE
  </a>
  <a class="share-btn share-threads" href={`https://www.threads.net/intent/post?text=${encodeURIComponent(title + ' ' + SITE.url + '/wiki/' + slug + '/')}`} target="_blank" rel="noopener">
    Threads
  </a>
</div>
```

### CSS 風格

```css
.wiki-share-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.8rem;
}
.share-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  border: 1px solid var(--border, #e2e8f0);
  border-radius: 999px;
  background: var(--bg-subtle, #f8fafc);
  color: var(--text-secondary, #64748b);
  text-decoration: none;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.share-btn:hover {
  border-color: var(--accent-ai, #2563eb);
  color: var(--text-primary, #0f172a);
}
```

### 複製連結 JS

```html
<script is:inline>
document.querySelectorAll('.share-copy').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var url = btn.dataset.url;
    navigator.clipboard.writeText(url).then(function() {
      var orig = btn.textContent;
      btn.textContent = '已複製！';
      setTimeout(function() { btn.textContent = orig; }, 1500);
    });
  });
});
</script>
```

### 設計原則
- 按鈕低調、不搶概念頁內容的焦點
- 跟現有 pillar badge / confidence badge 風格一致（小圓角 pill 形狀）
- 手機上正常 wrap

---

## 驗證

| 項目 | 驗證方式 |
|------|---------|
| Article 連結 | 點概念頁裡任一 article source → 正確導航到 /articles/{slug}/ |
| 非 article 不連結 | getnote / clip 類型仍為純文字 |
| 複製連結 | 點「複製連結」→ 貼到其他地方確認 URL 正確 |
| X 分享 | 點 X 按鈕 → 新視窗開 twitter intent → 預填正確 URL + 標題 |
| LINE 分享 | 點 LINE → 新視窗開 LINE share |
| Threads 分享 | 點 Threads → 新視窗開 Threads intent |
| OG 預覽 | 分享出去的連結有正確的 OG image（Phase 3C 已做） |
| build 通過 | `npm run build` 成功 |

---

## 完成後回報格式

```
Tasks A+B 完成
- commit: {hash}
- 變更：src/pages/wiki/[slug].astro
- 驗證：build 成功 + 截圖
- 待 Paul：git push origin main
```
