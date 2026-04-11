# Handoff → Code：Issue #161 分享足跡連結對方無法使用

> 日期：2026-04-11
> 來源：Cowork（Paul 指示活動前修復）
> 風險等級：**L2**（LIFF + 前端路由）
> 模型建議：**Sonnet / Standard effort**（單一頁面修復，邏輯不複雜）
> ⚠️ 4/12 起駕，必須今天修完

---

## 背景

用戶分享進香足跡連結給朋友，對方打開後頁面空白/無法使用。
4/2 和 4/9 都有回報（Feedback #4、#24），跨 iOS LINE WebView 和 Win32 Chrome。

Issue #130（Tracker 404 + 分享空白）在 4/10 closed，但那次修的是 redirect 問題（mazu.today domain + _redirects）。
Issue #161 是殘留的不同根因——**分享連結本身能到頁面，但頁面載入後功能失效**。

---

## Step 0 偵察

```bash
# 1. 查看分享頁面主檔案
cat src/pages/projects/formosa-esg-2026/my/_MyPage.astro | head -300

# 2. 查 LIFF 初始化流程
grep -n "liff.init\|liff.login\|liff.isLoggedIn\|liff.ready" src/pages/projects/formosa-esg-2026/my/_MyPage.astro

# 3. 查公開檢視邏輯（?u= 參數）
grep -n "viewUserId\|urlParams\|searchParams" src/pages/projects/formosa-esg-2026/my/_MyPage.astro

# 4. 查 API endpoint 回應
curl -s "https://api.paulkuo.tw/api/formosa/health" | head -5

# 5. 查分享 URL 產生邏輯
grep -n "shareUrl\|shareFB\|shareLine\|shareNative\|generateShareImage" src/pages/projects/formosa-esg-2026/my/_MyPage.astro
```

---

## 根因分析方向（三個最可能的原因）

### 假說 A：LIFF 初始化擋住公開檢視

`/my/` 頁面同時處理「自己的 dashboard」和「看別人的分享」（透過 `?u={lineUserId}`）。
如果頁面一開始就做 `liff.init()` → `liff.login()`，而收到分享連結的人：
- 沒裝 LINE → LIFF init 失敗 → 頁面卡死
- 在一般瀏覽器開 → LIFF 環境偵測失敗 → 白屏

**修法**：公開檢視路徑（有 `?u=` 參數且不是自己）不應該依賴 LIFF 登入。
偵測到 `?u=` 時，跳過 LIFF auth，直接走公開 API fetch。

### 假說 B：LIFF redirect 吃掉 query params

LIFF URL（`https://liff.line.me/2009588321-rXVntTKg`）redirect 到 `/my/` 時，
可能把原始 `?u=xxx` 參數吞掉了。分享者產生的 URL 如果是 LIFF URL + query param，
對方開了之後 LIFF redirect 丟掉 `?u=`，變成空的 `/my/`，沒登入就什麼都看不到。

**修法**：
1. 確認分享 URL 用的是直接 URL（`mazu.today/my/?u=xxx`）而非 LIFF URL
2. 如果必須走 LIFF，確保 `liff.init()` 後保留 original query params

### 假說 C：公開 API 回 401/403

`/api/formosa/user/{userId}` 可能加了 auth 檢查（比如要求 X-Admin-Token 或 LINE access token），
導致未登入的訪客打這支 API 拿不到資料 → 頁面空白。

**修法**：公開檢視的 API 不應該要求 auth（只回公開資料：暱稱、里程、等級、GPS 軌跡）。

---

## 具體步驟

### 1. 確認分享 URL 格式
找到 `shareFB()` / `shareLine()` / `shareNative()` 裡產生的 URL，
確認是用 `https://mazu.today/my/?u={userId}` 還是 LIFF URL。
如果是 LIFF URL → 改成直接 URL。

### 2. 分離公開檢視與私有 dashboard
在 `/my/` 頁面的 JS 初始化邏輯裡：
```javascript
const urlParams = new URLSearchParams(window.location.search);
const viewUserId = urlParams.get('u');

if (viewUserId) {
  // 公開檢視模式：不做 LIFF login，直接 fetch 公開 API
  await loadPublicProfile(viewUserId);
} else {
  // 自己的 dashboard：走 LIFF auth 流程
  await initLiffAndLogin();
}
```

### 3. 確認公開 API 不擋未登入
測試：
```bash
curl -s "https://api.paulkuo.tw/api/formosa/user/TEST_USER_ID"
```
如果回 401 → Worker 端要加判斷：帶 `?public=1` 或特定 path 時只回公開欄位。

### 4. 錯誤 fallback
如果公開 API 回 404（用戶不存在）或其他錯誤，顯示友善提示而非白屏：
「找不到這位香客的足跡資料，可能連結已過期。」

---

## 驗證方式

1. 用已有帳號產生分享連結（FB / LINE / 原生分享）
2. 在**未登入狀態**（無痕視窗）開啟分享連結 → 應該看到對方的足跡
3. 在**LINE 外部瀏覽器**（Safari / Chrome）開啟 → 同樣能看
4. 在 LINE 內建瀏覽器開啟 → 也能看
5. 測試不存在的 userId → 應顯示友善錯誤訊息

---

## 注意事項

- **已知陷阱**：LINE in-app browser 和 Safari 的 localStorage 是隔離的（memory 有記）
- **已知陷阱**：`leafletImage` 0.4.0 無法截取 Canvas renderer，已改用 html2canvas
- 分享頁面的地圖如果依賴 localStorage 的 GPS 點，公開檢視看不到（只有 server 端的點）→ 這是預期行為，不需修
- CDN 快取 max-age=3600，部署後最多等 1 小時生效
- Issue #130 修的是 redirect 路由問題（已 closed），這次是頁面邏輯問題，不同根因

---

## 回報格式

```markdown
## Issue #161 完成
- commit: {hash}
- 根因：{實際發現的原因}
- 修法：{實際做了什麼}
- 驗證：{跑了哪些測試}
- 待 Paul 執行：Worker deploy（如有改 Worker）/ 前端 git push 即 auto-deploy
```
