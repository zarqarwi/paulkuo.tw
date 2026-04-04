# Code Handoff: RFC #100 程式碼未 push — Worker deploy 被卡住

**日期**：2026-04-05
**來源**：Cowork session 調查
**優先級**：🔴 P0（Worker 無法 deploy，活動倒數 7 天）

---

## 背景

Paul 執行 `wrangler deploy` 失敗，錯誤：

```
No matching export in "src/formosa.js" for import "handleFormosaHealthAlert"
```

Cowork 調查結論：
- `index.js` 第 31 行 import 了 `handleFormosaHealthAlert`（在 4275cc6 commit, Issue #99 時加入）
- `formosa.js` 裡**沒有這個函式**
- 搜遍 GitHub main 分支，只有 index.js 裡出現過這個名稱
- **worklog 記錄 "04-04 15:xx RFC #100 三項全完成"，但對應的 commit 從未 push 到 main**
- Cron 腳本 (v7) 已確認安全，只動 `data/` 資料，不是兇手

## 根本原因

RFC #100 三項功能的程式碼（P0 等級統一 / A1 健康告警 / A2 Service Worker）可能：
1. 在 Code session 的 local 做完但沒有 commit+push
2. commit 了但被 cron 的 `git pull --rebase --autostash` 搞丟（autostash pop 衝突時 silently drop）
3. 只在 Code session 的暫存記憶體裡，session 結束就消失了

---

## Step 0 偵察（在 Paul 本機執行）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw

# 1. 看看有沒有未 push 的 local commit
git log origin/main..HEAD --oneline

# 2. 看看有沒有 stash 殘留
git stash list

# 3. 搜 reflog 找遺失的 commit
git reflog | grep -i "health\|rfc\|#100\|alert" | head -20

# 4. 搜 reflog 看 04-04 下午的活動
git reflog --since="2026-04-04 14:00" --until="2026-04-04 20:00"

# 5. 確認目前 formosa.js 有沒有 handleFormosaHealthAlert
grep -n "handleFormosaHealthAlert" worker/src/formosa.js worker/src/index.js
```

---

## 具體步驟

### 情況 A：找到遺失的 commit
如果 reflog 找到了 RFC #100 的 commit hash：
```bash
git cherry-pick <commit-hash>
git push origin main
```

### 情況 B：找不到，需要重新實作
在 `worker/src/formosa.js` 末尾新增 `handleFormosaHealthAlert` 函式。

**功能規格（來自 RFC #100 A1）：**
- 檢查 D1 + KV 健康狀態（同 /health endpoint 的 formosa 區塊）
- 如果任何子系統異常，透過 LINE Messaging API push 告警給 `env.FORMOSA_ALERT_USER_ID`
- **指數退避**：用 KV 存 backoff 狀態，避免連續告警轟炸
  - key: `formosa:health_alert_backoff`
  - 首次失敗立即告警
  - 之後依序等 10min → 30min → 1hr → 2hr → 4hr
  - 恢復正常時發「恢復通知」並重置 backoff
- 由 cron `handleScheduled` 每 5 分鐘呼叫（index.js 已接好）
- 回傳 `{ checked: true, healthy: boolean, alerted: boolean }` 供 cron log

**index.js 已有的呼叫方式（不需要改）：**
```js
// 在 handleScheduled 裡
try { const r = await handleFormosaHealthAlert(env); console.log('Cron: health alert', JSON.stringify(r)); } catch (e) { console.error('Cron: health alert FAILED:', e.message); }
```

**注意：函式簽名是 `handleFormosaHealthAlert(env)`，不是 `(request, env)`。**

### 其他 RFC #100 項目確認
同時檢查以下是否也遺失（可能一起沒 push）：

1. **P0 等級計算統一**：Dashboard 的 `computeRank()` 應該用全量 haversine 計算 + 雙條件。`grep -n "computeRank" worker/src/formosa.js` 確認函式邏輯。
2. **A2 Service Worker**：`public/sw.js` 和 `public/offline.html` 是否存在。這兩個是前端檔案，可能已透過 Pages deploy 上去了。

---

## 驗證方式

1. `grep -n "export.*handleFormosaHealthAlert" worker/src/formosa.js` — 確認 export
2. `npx wrangler deploy --dry-run --config worker/wrangler.toml` — build 成功
3. `git push origin main`
4. Paul 跑 `wrangler deploy --config wrangler.toml` — 部署成功
5. `curl https://api.paulkuo.tw/health | jq '.formosa'` — 確認 Worker 活著
6. 等 5 分鐘 cron 觸發，查 Worker logs 確認 `Cron: health alert` 有輸出

---

## 注意事項

- **不要改 index.js 的 import 或 handleScheduled 區塊**，它們已經是對的
- LINE push 用 `env.FORMOSA_LINE_TOKEN`（channel access token）
- LINE push API: `POST https://api.line.me/v2/bot/message/push`
- 如果 `env.FORMOSA_ALERT_USER_ID` 未設定，函式應 graceful skip（不要 throw）
- commit + push 要在 cron 間隔內完成（原子操作）
- 清理：根目錄的 `auto_update_data.sh`（v3 舊版）可以刪除，crontab 已不再引用

---

## 回報格式

完成後在 worklog 記錄：
- Step 0 偵察結果（找到遺失 commit / 需要重做）
- commit hash
- `--dry-run` build 結果
- push 完成確認
