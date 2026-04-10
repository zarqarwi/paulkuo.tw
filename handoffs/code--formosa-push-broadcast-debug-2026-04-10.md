# Handoff: 推播全體用戶未收到訊息排查

> 來源：Cowork session（2026-04-10）
> 目標：Code session
> 風險等級：**L1**（4/12 起駕前必須修好）
> 建議模型：Sonnet + High Effort

---

## 背景

Paul 從 Dashboard 發了一則文字推播，放送對象選「全部加入的人」，但自己沒有收到 LINE 訊息。

Issue #160 的修復（`dc19ced`）已經處理了 admin 推播被 `participant_status` 篩選排除的問題，但這次 Paul 是選「全部」而非「admin」。需要確認：

1. **Worker 是否已重新部署？** 如果 `dc19ced` 沒 deploy，線上還是舊版
2. **「全部」推播的 code path 是否也修到了？** #160 fix 只改了 `isAdminTarget` 的路徑，「all」target 可能走不同的篩選邏輯
3. **其他可能的問題**：LINE multicast 靜默失敗、token 問題等

---

## Step 0 偵察

先查現況再改：

```bash
# 1. 確認線上 Worker 版本
curl -s https://api.paulkuo.tw/api/formosa/health | jq .

# 2. 確認 dc19ced 的修改是否在線上版本
# 如果 health 有 version 欄位，比對 commit hash

# 3. 查 formosa.js 中 handleFormosaPush 的 "all" target 邏輯
grep -n "participant_status" worker/src/formosa.js
grep -n "isAdminTarget\|target.*all\|role.*all" worker/src/formosa.js

# 4. 確認 Paul 的 DB 狀態
# 在 D1 查詢：
# SELECT line_user_id, role, participant_status, display_name FROM formosa_users WHERE role = 'admin';
```

---

## 具體排查步驟

### Step 1: 確認 Worker 部署狀態

如果 health endpoint 回傳的版本不是 `dc19ced` 之後的版本 → **Paul 需要先 deploy**：
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw/worker && wrangler deploy --config wrangler.toml
```

### Step 2: 檢查「all」target 的 participant_status 篩選

`dc19ced` 的修復是：`isAdminTarget` 時跳過 `participant_status` 篩選。
但如果 Paul 選的是「全部用戶」推播，這個 target 可能不是 `isAdminTarget`。

需要確認 `handleFormosaPush()` 中：
- target = "all" 時，query 是否仍然過濾 `participant_status = 'active'`
- Paul 的 `participant_status = 'completed'`，如果 "all" 沒修到，他仍然會被排除

**修復方向**：admin 角色的用戶不論 target 是什麼，都不應該被 `participant_status` 過濾排除。或者「全部」推播本身就不該過濾。

### Step 3: 確認推播實際發送數量

Dashboard 推播後應該有 API 回應。請檢查：
- `sent` 數量是否等於 DB 中全部用戶數
- 如果 sent 少於預期，代表 query 有過濾

### Step 4: LINE multicast 驗證

```bash
# 確認 LINE token 有效
curl -s -H "Authorization: Bearer $FORMOSA_LINE_TOKEN" https://api.line.me/v2/bot/info
```

---

## 驗證方式

1. 修復後重新部署 Worker
2. 從 Dashboard 選「全部用戶」發一則測試推播
3. Paul 確認 LINE 有收到
4. 檢查 API 回應的 `sent` 數量 = DB 用戶總數

---

## 注意事項

- Worker 部署必須帶 `--config`：`cd worker && wrangler deploy --config wrangler.toml`
- 根目錄 `wrangler.jsonc` 是 og-worker，不是 API Worker
- LINE multicast 成功時回 200 + `{}`（空 JSON），不代表每個用戶都收到
- Issue #160 目前仍 open，修完這個一併 close

---

## 回報格式

完成後請更新 `worklogs/worklog-2026-04-10.md`，包含：
- Worker 是否已重新部署（版本 hash）
- 「全部」推播的 participant_status 篩選是否修正
- Paul 實際收到測試推播的確認
