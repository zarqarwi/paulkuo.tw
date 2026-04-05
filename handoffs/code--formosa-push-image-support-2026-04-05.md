# Handoff: Issue #105 — Dashboard 推播支援 image message + URL 預覽強化

**來源**: Cowork  
**目標**: Code session  
**Issue**: https://github.com/zarqarwi/paulkuo.tw/issues/105  
**風險等級**: L1（Cowork 驗證）  
**日期**: 2026-04-05

---

## 背景

Issue #104 已完成 Dashboard LINE 推播功能（text mode + template mode）。
Paul 希望下一步讓後台能發送**圖片訊息**和**帶連結的訊息**。
這是功能擴充，不影響現有 text/template mode。

---

## Step 0：偵察（先查再改）

```bash
# 1. 確認 handleFormosaPush 目前的 mode 分支邏輯
grep -n 'handleFormosaPush\|mode.*text\|mode.*template\|multicastLineMessage' worker/src/formosa.js

# 2. 確認前端推播區塊在哪個檔案
#    Issue 說 dashboard.astro，但也可能在 _DashboardPage.astro
grep -rn 'pushSection\|sendPush\|push-mode\|pushMode\|推播' src/pages/

# 3. 確認 multicastLineMessage 的 messages 參數目前是怎麼傳的
grep -n 'multicastLineMessage' worker/src/formosa.js

# 4. 確認現有 mode 選擇器 UI（如果有的話）
grep -rn 'mode.*select\|push.*mode\|text.*template' src/pages/
```

⚠️ **重要**：Issue 說前端是 `src/pages/dashboard.astro`，但搜尋發現 `pushSection` 同時出現在：
- `src/pages/dashboard.astro`
- `src/pages/projects/formosa-esg-2026/dashboard/_DashboardPage.astro`
- i18n 翻譯檔（en.ts, zh-Hant.ts 等）

請用 Step 0 偵察結果確認**實際要改哪個檔案**。

---

## Step 1：Backend — `worker/src/formosa.js`

在 `handleFormosaPush` 函式中新增兩個 mode：

### 1a. 新增 `mode: 'image'`

```javascript
// 在現有的 if (mode === 'text') { ... } else { /* template */ } 之間插入

if (mode === 'image') {
  // 驗證 image_url
  if (!body.image_url) {
    return jsonResponse({ error: 'image_url is required for image mode' }, 400);
  }
  message = {
    type: 'image',
    originalContentUrl: body.image_url,
    previewImageUrl: body.preview_url || body.image_url
  };
}
```

### 1b. 新增 `mode: 'image+text'`

```javascript
else if (mode === 'image+text') {
  if (!body.image_url) {
    return jsonResponse({ error: 'image_url is required for image+text mode' }, 400);
  }
  if (!customText) {
    return jsonResponse({ error: 'text is required for image+text mode' }, 400);
  }
  // messages 陣列改為多則（LINE multicast 支援最多 5 則）
  messages = [
    { type: 'text', text: customText },
    {
      type: 'image',
      originalContentUrl: body.image_url,
      previewImageUrl: body.preview_url || body.image_url
    }
  ];
}
```

### 1c. 確認 multicastLineMessage 呼叫

目前應該已經用 `[message]` 陣列格式。`image+text` 模式需要傳多則 messages，
確認呼叫端能接受陣列（而非只包一層 `[message]`）。

如果目前是：
```javascript
await multicastLineMessage(userIds, [message], env);
```

改為：
```javascript
const msgs = messages || [message];
await multicastLineMessage(userIds, msgs, env);
```

### LINE image message 規格限制（務必在 validation 中檢查）

- URL 必須 HTTPS（TLS 1.2+），最長 2000 字元
- 格式：JPEG 或 PNG
- originalContentUrl 最大 10 MB
- previewImageUrl 最大 1 MB
- 如未提供 previewImageUrl，以 originalContentUrl 作為預覽

建議加上基本 URL 驗證：
```javascript
if (body.image_url && !body.image_url.startsWith('https://')) {
  return jsonResponse({ error: 'image_url must be HTTPS' }, 400);
}
```

---

## Step 2：Frontend — Dashboard pushSection

在推播區塊新增 UI 元素：

### 2a. Mode 選擇器

把現有的 text/template 選擇改為四選一：
- text（現有）
- image（新增）
- image+text（新增）
- template（現有）

### 2b. 圖片 URL 輸入欄位

當 mode 包含 image 時顯示：
```html
<!-- 圖片 URL（mode 含 image 時顯示） -->
<div id="imageUrlGroup" style="display:none">
  <label>圖片 URL（HTTPS, JPEG/PNG, max 10MB）</label>
  <input type="url" id="pushImageUrl" placeholder="https://example.com/image.jpg" />
  
  <label>預覽圖 URL（選填，max 1MB）</label>
  <input type="url" id="pushPreviewUrl" placeholder="留空則同上" />
  
  <!-- 即時預覽 -->
  <div id="imagePreview" style="display:none">
    <img id="previewImg" style="max-width:200px;max-height:200px;border-radius:8px" />
  </div>
</div>
```

### 2c. 顯示/隱藏邏輯

```javascript
// mode 切換時
function onPushModeChange(mode) {
  const imageGroup = document.getElementById('imageUrlGroup');
  const textGroup = document.getElementById('pushTextGroup'); // 現有文字輸入區
  
  imageGroup.style.display = (mode === 'image' || mode === 'image+text') ? 'block' : 'none';
  textGroup.style.display = (mode === 'text' || mode === 'image+text') ? 'block' : 'none';
}
```

### 2d. 即時預覽

```javascript
// 圖片 URL 輸入時預覽
document.getElementById('pushImageUrl').addEventListener('input', (e) => {
  const url = e.target.value;
  const preview = document.getElementById('imagePreview');
  const img = document.getElementById('previewImg');
  if (url && url.startsWith('https://')) {
    img.src = url;
    img.onload = () => { preview.style.display = 'block'; };
    img.onerror = () => { preview.style.display = 'none'; };
  } else {
    preview.style.display = 'none';
  }
});
```

### 2e. 送出時組裝 payload

```javascript
// sendPush 函式修改
const payload = {
  mode: currentMode,
  role: selectedRole,
  dry_run: isDryRun
};

if (currentMode === 'text' || currentMode === 'image+text') {
  payload.text = pushText;
}
if (currentMode === 'image' || currentMode === 'image+text') {
  payload.image_url = document.getElementById('pushImageUrl').value;
  const previewUrl = document.getElementById('pushPreviewUrl').value;
  if (previewUrl) payload.preview_url = previewUrl;
}
if (currentMode === 'template') {
  payload.template = selectedTemplate;
}
```

---

## Step 3：i18n（如果推播 UI 有用到翻譯 key）

偵察 Step 0 如果發現 pushSection 有 i18n key，需要在以下檔案新增對應翻譯：
- `src/i18n/translations/zh-Hant.ts`
- `src/i18n/translations/en.ts`
- `src/i18n/translations/ja.ts`
- `src/i18n/translations/zh-Hans.ts`

---

## 驗證方式

### 自動驗證（Code 做）

1. `dry_run: true` + `mode: 'image'` → API 回 200，確認接受新 mode
2. `dry_run: true` + `mode: 'image+text'` → API 回 200
3. 缺少 `image_url` 時 → API 回 400
4. `image_url` 非 HTTPS → API 回 400
5. 現有 `mode: 'text'` 和 `mode: 'template'` 不受影響（regression check）

### 手動驗證（待部署後 Cowork 驗）

1. 發送 image message 到 admin role → LINE 收到圖片
2. 發送 image+text 到 admin role → LINE 同時收到文字和圖片
3. Dashboard UI 操作流程順暢（mode 切換、圖片預覽）

---

## 部署

- **前端**：git push 自動部署（Cloudflare Pages）
- **Worker**：Paul 本機執行 `cd worker && wrangler deploy --config wrangler.toml`

---

## 注意事項

1. **不要動到現有 text/template 的邏輯**，純加新 mode 分支
2. `multicastLineMessage` 的 messages 陣列上限是 5 則，image+text 只用 2 則，安全
3. 前端 mode 選擇器要考慮 Astro template script 延遲問題（等 `formosa-unlocked` 事件）
4. Dashboard 的 pushSection 可能在 `dashboard.astro` 或 `_DashboardPage.astro`，Step 0 偵察後再決定改哪個

---

## 回報格式

完成後請在 worklog 回報：
```
- {HH:MM} Issue #105: Dashboard push image support ({commit hash}) Code
```

待 Paul 執行：
- [ ] Worker deploy → 驗證: curl https://api.paulkuo.tw/formosa/health 確認 version
