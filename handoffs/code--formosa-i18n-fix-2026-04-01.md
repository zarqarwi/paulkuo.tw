# 🔧 Formosa LINE i18n 修復 — mazu.today 路由 + Bot 語言驗證

> **來源**：Cowork session（2026-04-01）
> **類型**：Bug Fix（已診斷完成，附完整根因）
> **嚴格規則**：本工單只修路由和加 diagnostic log，不重寫現有功能。

---

## 背景

LINE i18n 的程式碼全部到位（5 commits 已 deploy），但 Paul 實測兩個功能都不動。
Cowork 已完成完整診斷，根因如下。

---

## 問題 1：LIFF auto-redirect 不動（根因已確認 ✅）

### 根因

`mazu.today` 的 Worker 路由（`handleMazuToday` in `index.js`）**完全沒有 i18n 前綴路徑**。

`autoRedirectByLanguage()`（AuthGate.astro）偵測 LINE 語言為 `en` → 嘗試 redirect 到 `/en/tracker/` → mazu.today Worker 找不到這個路徑 → **404**。

### 證據

```
curl -sI "https://mazu.today/tracker/"                              → 200 ✅
curl -sI "https://mazu.today/en/tracker/"                           → 404 💥
curl -sI "https://mazu.today/en/projects/formosa-esg-2026/tracker/" → 404 💥
curl -sI "https://paulkuo.tw/en/projects/formosa-esg-2026/tracker/" → 200 ✅
```

### 修復位置

`worker/src/index.js` → `handleMazuToday` 函式（約在檔案中段）

### 現有程式碼

```javascript
async function handleMazuToday(request, url) {
  const path = url.pathname;

  // Static assets — fetch from Pages as-is
  if (path.startsWith('/_astro/') || path.startsWith('/fonts/') || ...) {
    return fetch(new URL(path + url.search, 'https://paulkuo.tw'), { ... });
  }

  // Paths that already include the prefix — pass through
  if (path.startsWith('/projects/formosa-esg-2026')) {
    return fetch(new URL(path + url.search, 'https://paulkuo.tw'), { ... });
  }

  // Known formosa short paths — rewrite with prefix
  const formosaRoutes = ['/', '/tracker/', '/my/', '/guide/', '/guide/admin/',
    '/guide/admin-flow/', '/guide/user-flow/', '/privacy/', '/dashboard/',
    '/feedback/', '/data/'];
  let normalized = path;
  if (path !== '/' && !path.includes('.') && !path.endsWith('/')) normalized = path + '/';

  if (formosaRoutes.includes(normalized)) {
    const rewrittenPath = '/projects/formosa-esg-2026' + normalized;
    return fetch(new URL(rewrittenPath + url.search, 'https://paulkuo.tw'), { ... });
  }

  // Non-formosa path — 404
  return new Response(..., { status: 404 });
}
```

### 需要改三處

**改動 1**：在 pass-through 規則加上 i18n 前綴

```javascript
// Paths that already include the prefix — pass through (including i18n versions)
if (path.startsWith('/projects/formosa-esg-2026') ||
    path.startsWith('/en/projects/formosa-esg-2026') ||
    path.startsWith('/ja/projects/formosa-esg-2026') ||
    path.startsWith('/zh-cn/projects/formosa-esg-2026')) {
  return fetch(new URL(path + url.search, 'https://paulkuo.tw'), {
    method: request.method,
    headers: request.headers,
  });
}
```

**改動 2**：在 formosaRoutes 匹配之前，加上 i18n 短路徑處理

```javascript
// i18n short paths: /en/tracker/ → /en/projects/formosa-esg-2026/tracker/
const I18N_PREFIXES = ['/en', '/ja', '/zh-cn'];
const langMatch = I18N_PREFIXES.find(p => path === p || path.startsWith(p + '/'));
if (langMatch) {
  const rest = path.slice(langMatch.length) || '/';
  let normalizedRest = rest;
  if (rest !== '/' && !rest.includes('.') && !rest.endsWith('/')) normalizedRest = rest + '/';

  if (formosaRoutes.includes(normalizedRest)) {
    const rewrittenPath = langMatch + '/projects/formosa-esg-2026' + normalizedRest;
    return fetch(new URL(rewrittenPath + url.search, 'https://paulkuo.tw'), {
      method: request.method,
      headers: request.headers,
    });
  }
}
```

**改動 3**：static assets 也需要處理 i18n 路徑下的 _astro 引用（HTML 裡面會用相對路徑，但 Astro 的 _astro 是絕對路徑所以通常不受影響。保險起見可以不改，先測試看看。）

### 完整改動後的 handleMazuToday

```javascript
async function handleMazuToday(request, url) {
  const path = url.pathname;

  // Static assets (Astro bundles, fonts, images, favicon) — fetch from Pages as-is
  if (path.startsWith('/_astro/') || path.startsWith('/fonts/') || path.startsWith('/images/') ||
      path.startsWith('/styles/') || path === '/favicon.svg' || path === '/favicon.ico') {
    return fetch(new URL(path + url.search, 'https://paulkuo.tw'), {
      method: request.method,
      headers: request.headers,
    });
  }

  // Paths that already include the full prefix — pass through (including i18n)
  if (path.startsWith('/projects/formosa-esg-2026') ||
      path.startsWith('/en/projects/formosa-esg-2026') ||
      path.startsWith('/ja/projects/formosa-esg-2026') ||
      path.startsWith('/zh-cn/projects/formosa-esg-2026')) {
    return fetch(new URL(path + url.search, 'https://paulkuo.tw'), {
      method: request.method,
      headers: request.headers,
    });
  }

  // Known formosa short paths
  const formosaRoutes = ['/', '/tracker/', '/my/', '/guide/', '/guide/admin/', '/guide/admin-flow/', '/guide/user-flow/', '/privacy/', '/dashboard/', '/feedback/', '/data/'];

  // i18n short paths: /en/tracker/ → /en/projects/formosa-esg-2026/tracker/
  const I18N_PREFIXES = ['/en', '/ja', '/zh-cn'];
  const langMatch = I18N_PREFIXES.find(p => path === p || path.startsWith(p + '/'));
  if (langMatch) {
    const rest = path.slice(langMatch.length) || '/';
    let normalizedRest = rest;
    if (rest !== '/' && !rest.includes('.') && !rest.endsWith('/')) normalizedRest = rest + '/';

    if (formosaRoutes.includes(normalizedRest)) {
      const rewrittenPath = langMatch + '/projects/formosa-esg-2026' + normalizedRest;
      return fetch(new URL(rewrittenPath + url.search, 'https://paulkuo.tw'), {
        method: request.method,
        headers: request.headers,
      });
    }
  }

  // Default (zh-Hant): rewrite short path with prefix
  let normalized = path;
  if (path !== '/' && !path.includes('.') && !path.endsWith('/')) normalized = path + '/';

  if (formosaRoutes.includes(normalized)) {
    const rewrittenPath = '/projects/formosa-esg-2026' + normalized;
    return fetch(new URL(rewrittenPath + url.search, 'https://paulkuo.tw'), {
      method: request.method,
      headers: request.headers,
    });
  }

  // Non-formosa path — 404
  return new Response('<!DOCTYPE html><html><head><meta charset="utf-8"><title>mazu.today</title><meta http-equiv="refresh" content="3;url=/"></head><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><p>找不到此頁面，正在返回首頁⋯</p></body></html>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
```

### paulkuo.tw → mazu.today redirect 也要更新

同一個檔案裡，`handleRequest` 函式開頭有：

```javascript
// 302 redirect: paulkuo.tw/projects/formosa-esg-2026/* → mazu.today (HTML only)
if (url.hostname === 'paulkuo.tw' && path.startsWith('/projects/formosa-esg-2026')) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html') && !path.startsWith('/projects/formosa-esg-2026/_astro/')) {
    const shortPath = path.replace('/projects/formosa-esg-2026', '') || '/';
    return new Response(null, { status: 302, headers: { 'Location': 'https://mazu.today' + shortPath + url.search } });
  }
}
```

這段也需要處理 i18n 路徑。`paulkuo.tw/en/projects/formosa-esg-2026/tracker/` 應該 redirect 到 `mazu.today/en/tracker/`：

```javascript
// 302 redirect: paulkuo.tw i18n formosa paths → mazu.today
const formosaI18nMatch = path.match(/^\/(en|ja|zh-cn)(\/projects\/formosa-esg-2026)(\/.*)?$/);
if (url.hostname === 'paulkuo.tw' && formosaI18nMatch) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html')) {
    const lang = formosaI18nMatch[1];
    const shortPath = formosaI18nMatch[3] || '/';
    return new Response(null, { status: 302, headers: { 'Location': 'https://mazu.today/' + lang + shortPath + url.search } });
  }
}

// 302 redirect: paulkuo.tw/projects/formosa-esg-2026/* → mazu.today (existing, unchanged)
if (url.hostname === 'paulkuo.tw' && path.startsWith('/projects/formosa-esg-2026')) {
  // ... existing code unchanged
}
```

### Checkpoint 1

修改完成後，**只 deploy Worker**（前端不用改）：

```bash
cd worker && wrangler deploy --config wrangler.toml
```

驗證：

```bash
curl -sI "https://mazu.today/en/tracker/" | head -5
# 預期：HTTP/2 200

curl -sI "https://mazu.today/ja/tracker/" | head -5
# 預期：HTTP/2 200

curl -sI "https://mazu.today/zh-cn/tracker/" | head -5
# 預期：HTTP/2 200

# 回歸：繁中版不受影響
curl -sI "https://mazu.today/tracker/" | head -5
# 預期：HTTP/2 200
```

---

## 問題 2：Bot 多語回覆（可能已正常，需重新測試）

### D1 查詢結果

```
│ 郭曜郎-Paul     │ zh-Hant  │ 2026-03-31 15:34:56 │  ← language 有值！
│ Raymond汪瑞民   │ null     │ 2026-03-31 15:04:49 │
│ Chris           │ null     │ 2026-03-31 15:00:31 │
```

Paul 的 `language = zh-Hant` — 表示 webhook 的 language 儲存邏輯**是通的**。
其他用戶 `null` 是因為他們的互動發生在 i18n deploy 之前。

### 分析

Bot 回中文的原因很可能是：Paul 測試時 LINE 語言「還是繁中」，所以 getProfile 回傳 zh-TW → mapLineLanguageToLocale → zh-Hant → 回中文。這是**正確行為**。

### 驗證步驟

1. Paul 把 LINE App 語言切成 English
2. 對 Bot 傳任意訊息（觸發 webhook → getProfile 拿到 en → upsert language=en）
3. 查 D1 確認 language 更新了：

```bash
wrangler d1 execute paulkuo-auth --remote --config wrangler.toml \
  --command "SELECT display_name, language, updated_at FROM formosa_users WHERE display_name LIKE '%Paul%'"
# 預期：language = en
```

4. 再傳 "help" → 預期收到英文回覆

**如果 language 仍然是 zh-Hant**（LINE App 已經切英文但 getProfile 還是回 zh-TW），
那需要加 diagnostic log 到 webhook：

```javascript
// handleFormosaWebhook 裡，upsert 前加：
console.log(`[webhook-i18n] userId=${userId}, profileLang=${profile?.language}, eventLang=${event.source?.language}`);
```

Deploy 後用 `wrangler tail --config wrangler.toml` 看 log。

---

## 問題 2 備選修復（如果 getProfile 確實不回 language）

### 方案 A：從 webhook event.source 取語言

LINE webhook event 的 `source` 物件可能帶 `language`（也是 optional，但多一個來源）：

```javascript
const userLang = event.source?.language || profile?.language || null;
```

### 方案 B：LIFF sync 帶語言（最穩）

AuthGate.astro 的 `/api/formosa/user/sync` 已經會在 LIFF 環境打 API，可以在前端帶 language：

```javascript
// AuthGate.astro — showProfile 裡的 sync fetch
var liffLang = (window.__liffReady && typeof liff !== 'undefined' && typeof liff.getAppLanguage === 'function')
  ? liff.getAppLanguage() : null;

fetch(WORKER + '/api/formosa/user/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    line_user_id: profile.userId,
    display_name: profile.displayName,
    picture_url: profile.pictureUrl || '',
    language: liffLang || navigator.language || null   // ← 新增
  })
})
```

Worker 端的 `handleFormosaUserSync` 也要接收並存 language。

**⚠️ 方案 B 只在確認 getProfile 不回 language 時才做，否則不需要。**

---

## Smoke Test

### LIFF 自動導向（修完問題 1 後測）

- [ ] LINE 語言設英文 → 打開 `https://liff.line.me/2009588321-rXVntTKg` → 導向 `/en/tracker/` 版本
- [ ] LINE 語言設日文 → 打開 LIFF URL → 導向 `/ja/tracker/` 版本
- [ ] LINE 語言設繁中 → 打開 LIFF URL → 留在 `/tracker/`（不 redirect）
- [ ] 外部瀏覽器打開（非 LINE in-app）→ 不 redirect

### Bot 多語（驗證步驟完成後測）

- [ ] LINE 語言英文 → 傳 "help" → 英文回覆
- [ ] LINE 語言日文 → 傳 "ヘルプ" → 日文回覆
- [ ] LINE 語言繁中 → 傳 "打卡" → 中文回覆（回歸）

### mazu.today 路由回歸

- [ ] `mazu.today/tracker/` → 200，繁中 tracker 頁面
- [ ] `mazu.today/en/tracker/` → 200，英文 tracker 頁面
- [ ] `mazu.today/ja/tracker/` → 200，日文 tracker 頁面
- [ ] `mazu.today/zh-cn/tracker/` → 200，簡中 tracker 頁面
- [ ] `mazu.today/dashboard/` → 200（回歸）
- [ ] `mazu.today/guide/` → 200（回歸）
- [ ] `paulkuo.tw/en/projects/formosa-esg-2026/tracker/` → 302 redirect 到 `mazu.today/en/tracker/`

---

## 注意事項

1. **只改 `index.js` 的 `handleMazuToday` 和 redirect 邏輯**，不動 `formosa.js` 或 `AuthGate.astro`（除非 Bot 問題需要 diagnostic log）
2. **deploy 前必查**：`grep -rn "<<<<<<" worker/src/`
3. **Worker deploy 才夠**，前端不用重新 build（路由是 Worker 層）
4. **CDN 注意**：Worker 路由改動即時生效，不受 CDN cache 影響

---

## 回報格式

```
## i18n 路由修復結果

### Worker 路由
- commit：{}
- mazu.today/en/tracker/ → {200/404}
- mazu.today/ja/tracker/ → {200/404}
- mazu.today/zh-cn/tracker/ → {200/404}
- mazu.today/tracker/ → {200/404}（回歸）

### Bot 語言驗證
- Paul language 更新：{zh-Hant → en / 未更新}
- help 回覆語言：{en / zh-Hant}
- 需要 diagnostic log：{是/否}

### Smoke Test
- LIFF 導向：{pass/fail}
- Bot 多語：{pass/fail}
- 路由回歸：{pass/fail}
```
