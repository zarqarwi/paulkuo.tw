建議模型: Sonnet
Task Sizing: M（20-40 分鐘）
產出來源: PROJECT_AUDIT_2026-04-23.md §7（觀察與建議）
接手方: Code session

---

# Handoff: Translator Dead Code 清理 + Qwen Cost Tracking 修正

## 背景

PROJECT_AUDIT 2026-04-23 盤點發現 translator.js / index.html 自 2026-03-17 後近乎凍結，但有兩類未竟工作累積：

1. **Dead code**：`_qwenAutoSwitched` / `_qwenSwitchPending` 是舊的自動偵測切換邏輯殘留，現在走的是 Deepgram(multi) → speech_final → `switchToQwen()` 新路徑，舊變數和相關 if 分支從未清掉。
2. **Qwen cost tracking 失準**：`dgUtteranceDuration = 0` 在 Qwen 路徑上 cost 沒算進去，`auto-memory/project_qwen_cost_fix.md` 也記錄前端用 $0.00011/sec 但官方是 $0.00009/sec，差 22%。

這兩件事都是 Paul 目前優先度第二低的尾巴，但很適合在 Stage B 啟動前先做收尾——代碼乾淨後再動新東西，比較不會混。

## Step -1：環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
```

## Step 0：偵察（先查再改，低 token 路徑）

```bash
# 1. 找出 dead code 候選的所有引用點
grep -n "_qwenAutoSwitched\|_qwenSwitchPending" public/tools/translator/index.html

# 2. 找出 Qwen cost 相關計算位置
grep -n "dgUtteranceDuration\|0.00011\|0.00009\|qwenCost\|qwen.*cost" public/tools/translator/index.html worker/src/*.js

# 3. 確認 switchToQwen 目前的觸發路徑（確認舊 auto-detect 分支確實已無作用）
grep -n "switchToQwen\|speech_final" public/tools/translator/index.html | head -30

# 4. 看最後一次 translator.js / index.html 的 commit，確認基線
cd worker && git log --oneline -5 src/translator.js
cd .. && git log --oneline -5 public/tools/translator/index.html
```

**偵察預期結果**：
- `_qwenAutoSwitched` / `_qwenSwitchPending` 出現在 5-15 處，大多在舊 auto-detect 的 if 分支
- `dgUtteranceDuration` 在 Qwen 路徑上確實 = 0（約 5-10 個引用點）
- 最後 commit 應該是 2026-03-17 前後

## Step 1：Dead Code 清理

**範圍**：只清掉 `_qwenAutoSwitched` 和 `_qwenSwitchPending` 兩個變數 + 所有只依賴它們的 if 分支。

**不要**：
- 不要改 `switchToQwen()` 函式本身
- 不要改 `speech_final` 偵測邏輯
- 不要改其他變數（保持最小改動範圍）

**做法**：
1. 逐一 Read 引用點前後 10 行
2. 確認該分支是 dead（永遠不會觸發 / 被新邏輯取代）
3. 刪除變數宣告 + 相關 if 分支
4. 保留的邏輯要跑通

**驗證**：
```bash
# 前端靜態語法檢查（node 跑一次 index.html 的 inline script）
node -e "const fs = require('fs'); const html = fs.readFileSync('public/tools/translator/index.html', 'utf-8'); const scripts = html.match(/<script[^>]*>([\s\S]*?)<\/script>/g); console.log('Scripts found:', scripts?.length)"

# 應該仍能跑起本地測試（開 http://localhost:8788/tools/translator/）
npx wrangler pages dev --port 8788 &
sleep 3
curl -s http://localhost:8788/tools/translator/ | head -20
kill %1
```

## Step 2：Qwen Cost Tracking 修正

**兩件事**：

**2a. Qwen 路徑用 performance.now() 取代 dgUtteranceDuration**：
- 在 Qwen WebSocket 連線建立處記 `_qwenStartMs = performance.now()`
- 每段句子完成（收到 final 結果）時計算 `(performance.now() - _qwenStartMs) / 1000` 作為 seconds
- 把該 seconds 送到 `/log-cost` endpoint 或前端 cost 累計

**2b. Qwen 費率修正**：
- 搜尋 `0.00011`（前端推測的 Qwen rate）
- 改成 `0.00009`（DashScope 官方 $0.00009 USD/sec）
- auto-memory `project_qwen_cost_fix.md` 有紀錄來源

**注意**：
- 這不改 Deepgram / Groq / Chirp 3 的 cost 邏輯，只動 Qwen 路徑
- Worker 端如果也有 Qwen 費率常數，一起改（`worker/src/costs.js` 或 `index.js`）

**驗證**：
```bash
grep -n "0.00011\|0.00009" public/tools/translator/index.html worker/src/*.js
# 應該只剩 0.00009，0.00011 應已消失
```

## Step 3：Commit 三態宣告（護欄 #14）

每次 commit 後明確宣告狀態：

```
commit {SHA} — fix(translator): 清理 _qwenAutoSwitched dead code [影響: 主站]
commit {SHA} — fix(translator): Qwen cost tracking 改用 performance.now() + 費率修正 0.00011→0.00009 [影響: 主站]
```

⚠️ 因為改動 `public/tools/translator/index.html`（跨專案影響地圖標 ⚠️），commit message 必須附上 `[影響: 主站]` 標注。
⚠️ 但這兩個改動不會波及 Wiki / TQEF / Formosa，Deepgram / Groq / Chirp 3 路徑完全不動。

## Step 4：部署 + Smoke Test

```bash
# 前端 deploy
cd ~/Desktop/01_專案進行中/paulkuo.tw
npm run build && wrangler deploy

# 如果 Worker 也有改
cd worker && wrangler deploy --config wrangler.toml
```

**Smoke Test**（結果寫進 worklog）：
```bash
# 主頁要能載入
curl -s https://paulkuo.tw/tools/translator/ | grep -c "阿哥拉" # 應 >= 1

# Worker health
curl -s https://api.paulkuo.tw/ | head -5

# Qwen WebSocket endpoint 要還在
curl -s -I https://api.paulkuo.tw/ws/stt-qwen 2>&1 | head -3
```

**手動驗證**（Paul 在瀏覽器跑）：
- 開 https://paulkuo.tw/tools/translator/ → 用中文錄 30 秒
- 確認 Qwen 切換正常（console 看 `[dg] → [qwen] switched`）
- 確認沒有 JS error
- 確認 cost 顯示數字（不是 0 或 NaN）

## 回報格式

完成後回到 worklog + PENDING.md 更新：

```markdown
# worklogs/worklog-2026-04-23.md（追加）

## 完成日誌
- {HH:MM} translator dead code 清理 + Qwen cost fix（commit {SHA1} + {SHA2} pushed）Code

## 狀態變更
- translator `_qwenAutoSwitched` / `_qwenSwitchPending`: Dead code → ✅ 清除
- Qwen cost rate: 0.00011 (推測) → 0.00009 (官方)
- Qwen cost tracking: dgUtteranceDuration=0 → performance.now() 時差

## 決策紀錄
- 為何先做清理而非 Stage B：Paul 在 audit 中表態優先做 portfolio 收尾，Stage B 看他決定是否啟動
- 為何 Qwen 路徑用 performance.now() 不用 server-side：前端已有 WebSocket 連線時戳，不需要額外 round-trip

## 阻礙與踩坑
- {遇到什麼 / 無}

## Smoke Test
- ✅ 前端載入正常
- ✅ Worker health 200
- ✅ Qwen 切換流程 Paul 瀏覽器實測通過
- ✅ cost 顯示正常（從 0 變成合理數字）
```

PENDING.md 更新：
```markdown
- [x] ✅ translator dead code + Qwen cost tracking → 已完成（2026-04-23，commit {SHA1}+{SHA2}）
```

同步更新 `.auto-memory/project_qwen_cost_fix.md` → 標記為 `resolved`。

## 本輪 metrics

- 2 個 commit / ~50 行增刪 / 估 30 分鐘
- 影響範圍僅主站 translator 頁面，不動 Wiki / TQEF / Formosa

## 注意事項

- ⚠️ 不要順手改 STT 路由邏輯（那是更大改動，要另開 handoff）
- ⚠️ 不要動 Deepgram / Groq / Chirp 3 的 cost 計算
- ⚠️ 如果發現 `_qwenAutoSwitched` 還有 active 引用（不是 dead），停下來寫到 worklog 阻礙區塊，不要硬刪
- Cron `auto_update_data.sh` 每 10 分鐘跑 git，要 chain 成一行（`edit && git add && git commit && git push`）避免被沖掉
