# Handoff: Issue #160 — LINE 文字推播 API 回 200 但用戶未收到

## 背景

從 Dashboard 或直接打 API 發文字推播給 admin（4 人），API 回 `{ ok: true, sent: 4, line_results: [{status: 200}] }`，但沒有任何人收到 LINE 訊息。之前**圖文模式（image+text）測試有成功過**，代表 LINE token 和 multicast 管道基本正常。Paul 的 role 確認是 `admin`。

## 風險等級

**L1** — 推播是活動核心功能，4/12 起駕前必須修好。

## Step 0：偵察（先查再改）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 確認 push handler 的 text mode 邏輯
grep -n "mode.*text\|customText\|messages.*push" worker/src/formosa.js | head -30

# 2. 確認 multicast 函式
grep -n "multicastLineMessage\|api.line.me.*multicast" worker/src/formosa.js | head -10

# 3. 確認 LINE token 環境變數名
grep -n "FORMOSA_LINE_TOKEN\|LINE_TOKEN" worker/src/formosa.js | head -10

# 4. 用 wrangler 查 D1 的 admin 用戶
cd worker && npx wrangler d1 execute formosa-db --config wrangler.toml --command "SELECT line_user_id, role, display_name FROM formosa_users WHERE role = 'admin'"
```

## Step 1：加 debug log 確認實際發送 payload

在 `worker/src/formosa.js` 的 `handleFormosaPush()` 裡，找到實際呼叫 multicast 的位置（~Line 780 附近），在呼叫前加 log：

```javascript
console.log('[PUSH DEBUG] mode:', mode, 'messages:', JSON.stringify(messages), 'validIds count:', validIds.length);
```

在 `multicastLineMessage()` 函式（~Line 1747+）裡，成功時也讀 response body：

```javascript
// 原本：
const result = { status: resp.status };
if (!resp.ok) { ... }

// 改成：
const result = { status: resp.status };
try { result.body = await resp.json(); } catch(e) { result.body = null; }
if (!resp.ok) {
  console.error('LINE multicast error:', JSON.stringify(result));
}
console.log('[PUSH DEBUG] LINE multicast result:', JSON.stringify(result));
```

## Step 2：驗證 LINE token 是否有效

```bash
# 在 worker/ 目錄下，用 wrangler secret 檢查 token
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker

# 或直接打 LINE API（需要 Paul 提供 token 值，或從 Cloudflare Dashboard 取得）
curl -s -H "Authorization: Bearer <FORMOSA_LINE_TOKEN>" https://api.line.me/v2/bot/info
```

如果 token 過期或無效，需要到 LINE Developers Console 重新 issue。

## Step 3：比對圖文 vs 文字模式差異

圖文模式成功但文字模式失敗，重點比對 `handleFormosaPush()` 中 ~Line 740-780：
- text mode → `messages = [{ type: 'text', text: customText }]`
- image+text mode → 可能用 flex message 或多個 message object

確認 `customText` 變數在 text mode 下有正確賦值（不是 undefined 或空字串）。

## Step 4：部署 debug 版並測試

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler deploy --config wrangler.toml
```

部署後用以下 curl 測試：

```bash
# Dry run 確認人數
curl -s -X POST https://api.paulkuo.tw/api/formosa/push \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: gf-admin" \
  -d '{"dry_run": true, "mode": "text", "text": "debug 測試", "role": "admin"}'

# 真的發送
curl -s -X POST https://api.paulkuo.tw/api/formosa/push \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: gf-admin" \
  -d '{"mode": "text", "text": "debug 測試推播", "role": "admin"}'
```

然後到 Cloudflare Dashboard → Workers → formosa-worker → Logs 查看 `[PUSH DEBUG]` 輸出。

## 驗證 Checklist

- [ ] D1 查到的 admin line_user_id 格式正確（U + 32 hex）
- [ ] LINE token 有效（`/v2/bot/info` 回 200）
- [ ] debug log 顯示 messages payload 正確
- [ ] LINE multicast response body 無錯誤
- [ ] Paul 的 LINE 實際收到測試推播

## 注意事項

- Worker 部署指令：`cd worker && wrangler deploy --config wrangler.toml`（必須帶 --config）
- 根目錄的 `wrangler.jsonc` 是 og-worker，不是主 Worker
- LINE multicast 上限每批 500 人，目前 admin 只有 4 人不會觸發分批
- LINE multicast API 即使 user ID 無效也回 200，不會報錯
- debug log 確認完後記得移除，不要留在 production
