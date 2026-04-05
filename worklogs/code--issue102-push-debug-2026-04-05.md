# Handoff: Issue #102 — Dashboard 推播通知發送失敗

**來源**: Cowork → Code
**日期**: 2026-04-05
**Issue**: https://github.com/zarqarwi/paulkuo.tw/issues/102
**優先級**: P1（4/12 起駕前必修）

---

## 背景

Paul 在管理後台（mazu.today/projects/formosa-esg-2026/dashboard/）測試「📤 推播通知」功能，選「全部」對象發送給 44 人，點擊「發送推播」後推播未送達。Paul 確認 LINE OA 額度充足（57/3000 則），且之前推播成功過，所以基本設定應該沒問題。懷疑是最近的程式碼變更破壞了推播功能。

---

## Step 0：偵察（先查再改）

請依序執行以下偵察，把結果貼在 Issue #102 的 comment 裡：

### 0-1. 確認 handleFormosaPush 完整性

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 確認 handleFormosaPush export 存在
grep -n "export async function handleFormosaPush" worker/src/formosa.js

# 確認 multicastLineMessage 函式存在且是 async
grep -n "function multicastLineMessage" worker/src/formosa.js

# 確認 TRACKER_URL 有定義
grep -n "TRACKER_URL" worker/src/formosa.js | head -5
```

### 0-2. 檢查 bc6d711 改了什麼

```bash
# 這是今天稍早 RFC #100 修復的 commit，最可疑
git diff bc6d711~1..bc6d711 -- worker/src/formosa.js
```

重點看：有沒有不小心刪除或覆蓋 `multicastLineMessage`、`TRACKER_URL`、`handleFormosaPush` 相關的程式碼。

### 0-3. curl 實測推播 API

```bash
# 用真實 admin token 打推播 API，只發給 admin role（避免打擾所有人）
curl -s -X POST https://api.paulkuo.tw/api/formosa/push \
  -H "Content-Type: application/json" \
  -H "X-Admin-Token: $(grep FORMOSA_ADMIN_TOKEN worker/wrangler.toml 2>/dev/null || echo '從 Cloudflare Dashboard 查')" \
  -d '{"role":"admin","title":"測試推播","text":"Code session 測試中"}' | jq
```

**關鍵欄位**：
- `line_results[].status` — 200 = LINE 收了, 400 = 格式錯, 401 = token 錯, 429 = 超額
- `sent` — 實際發了幾人
- `error` — 如果有的話

### 0-4. 檢查 Cloudflare Worker 即時 log

```bash
# 開另一個終端跑 tail（需要 wrangler login）
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker
wrangler tail --config wrangler.toml --format pretty
```

然後在第一個終端重跑 0-3 的 curl，觀察 Worker log 有沒有 error 輸出。

---

## 偵察完後的判斷分支

### 情況 A：curl 回傳 `line_results: [{status: 200}]`

LINE API 成功了，問題不在後端。可能是：
- D1 中 `line_user_id` 存的是 LINE Login channel (2009588321) 的 user ID，不是 Messaging API channel (2009576607) 的
- 確認方式：
  ```sql
  -- 透過 wrangler d1 查看
  wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml \
    --command "SELECT line_user_id, display_name FROM formosa_users WHERE line_user_id IS NOT NULL LIMIT 5"
  ```
  然後用 LINE Messaging API validate 這些 user ID 是否屬於 Messaging API channel

### 情況 B：curl 回傳 `line_results: [{status: 400, error: ...}]`

訊息格式有問題。最可能是：
- `TRACKER_URL` 未定義（導致 template action URI = `undefined`）
- template message 的 text/title 欄位超過 LINE 限制（title ≤ 40 字, text ≤ 60 字含 title）
- 修復：確認 `TRACKER_URL` 定義正確指向 `https://mazu.today/tracker/`

### 情況 C：curl 回傳 `line_results: [{status: 401}]`

Token 問題。檢查 Cloudflare Dashboard → Workers → paulkuo-ticker → Settings → Variables，確認 `FORMOSA_LINE_TOKEN` 的值是 Messaging API channel (2009576607) 的 Channel access token。

### 情況 D：curl 回傳 `{error: "Unauthorized"}`

Admin token 不對。檢查 `requireAdmin` 函式怎麼驗證，以及 `FORMOSA_ADMIN_TOKEN` 在 Worker secret 裡的值。

### 情況 E：curl 回傳 `{error: "Internal server error"}`

Worker 拋了 exception。看 0-4 的 wrangler tail log 裡的 error stack trace。最可能是 `multicastLineMessage` 函式不是 async 但裡面用了 await。

---

## 預計修改方式

根據偵察結果對症下藥：
- 如果是 `TRACKER_URL` 未定義 → 在 formosa.js 頂部補上定義
- 如果是 `multicastLineMessage` 被覆蓋或缺 async → 修復函式宣告
- 如果是 bc6d711 commit 的副作用 → 精確 revert 受影響的段落

修改範圍預期只在 `worker/src/formosa.js` 一個檔案內。

---

## 可能影響

- `handleFormosaPush`（手動推播）和 `handleFormosaScheduledPush`（定時推播 4/12 起駕後啟用）共用 `multicastLineMessage`，修一個兩個都修好
- `handleFormosaHealthAlert`（RFC #100 剛加的健康告警）也可能用到 LINE push，要確認不會互相干擾
- 修完後需要 `wrangler deploy --config wrangler.toml` 部署 Worker

---

## 驗證方式

1. curl 打 `/api/formosa/push` 帶 `role: "admin"`，確認 `line_results[0].status === 200`
2. Paul 的 LINE 收到推播訊息
3. 到 Dashboard 頁面實際點「發送推播」→ 選 admin → 確認收到

---

## 回報格式

完成後請在 Issue #102 留 comment，包含：

```
## 偵察結果
- 0-1 handleFormosaPush: {存在/缺失}
- 0-2 bc6d711 diff: {是否影響 push 相關程式碼}
- 0-3 curl 結果: {完整 JSON response}
- 0-4 Worker log: {有無 error}

## 根因
{一句話說明根因}

## 修復
- commit: {hash}
- 改了什麼: {描述}

## 驗證
- curl 測試: {status}
- LINE 收到推播: {是/否}

## 需要 Paul 做的事
- [ ] wrangler deploy（如果 Code 無法部署）
- [ ] 其他
```

---

## 注意事項

- `formosa.js` 有 98KB / 2400+ 行，Cowork 透過 GitHub MCP 讀取時**會截斷**，所以 Cowork 無法確認函式是否完整。Code 請用本機 grep 做最終確認。
- Worker deploy 必須帶 `--config wrangler.toml`（根目錄的 `wrangler.jsonc` 會覆蓋）
- commit + push 要原子操作（cron 每 10 分鐘跑 git stash/pop）
