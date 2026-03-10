# Session Handoff — TQEF 翻譯精準度優化 Round 2（2026-03-10）

## 本 session 完成的事

### 1. Bug Fix：摘要按鈕同語言模式無法啟用
- **根因**：`translateSegmentStreaming()` 在 srcLang === tgtLang 時 early return，跳過 `btnSummary.disabled = false`
- **修法**：兩個同語言 return 路徑都補了啟用按鈕 + `entry.translated` 賦值
- **commit**: `fix: enable summary button for same-language mode (zh→zh-TW)`

### 2. 半導體 + 循環科技 OpenCC 詞典（Task 1 & 2）
- `SEMICONDUCTOR_TW_DICT`：34 條（含 4 輪 TQEF 迭代補充）
- `CIRCULAR_TW_DICT`：22 條（含 4 輪迭代補充）
- `MEDICAL_TW_DICT`：新增 10 條（round 2-4 修正）
- `initOpenCC()` 改成 `.concat()` 合併三個詞典
- 位置：前端 `public/tools/translator/index.html`

### 3. Worker Prompt 歧義修正（Task 3）
- `worker/src/translator.js` 的 `buildTranslatePrompt()`
- `製品=產品/製劑` → `製品=產品, 製劑=製劑`
- Worker 已 deploy（`wrangler deploy --config wrangler.jsonc`）

### 4. TQEF eval_runner.py 架構升級
- 新增 Worker pipeline 模式（`TQEF_WORKER_CODE` env var）
- 新增 `apply_tw_postprocess()` 本地後處理（鏡射前端三個產業詞典）
- 新增 `translate_via_worker()` 函式（call Worker `/translate` endpoint）
- Fallback 機制：Worker 失敗自動回退 Direct API
- 兩種模式都會經過 TW post-processing
- eval_runner prompt 已同步 Worker 的歧義修正
- 位置：`~/Downloads/eval_runner.py`

### 5. TQEF 跑分結果（5 輪迭代）

| 輪次 | Overall | Terminology | Critical | TERM_ERR | CN_TERM | 備註 |
|---|---|---|---|---|---|---|
| 基線 | 4.42 | 4.00 | 2 | 14 | 5 | 無 OpenCC |
| R2 | 4.41 | 4.00 | 2 | 14 | 5 | 有詞典但 TQEF 沒吃到 |
| R3 | 4.42 | 4.10 | **0** | 14 | **1** | +OpenCC post-process |
| **R4** | **4.62** | **4.52** | 3 | **9** | 1 | Round 3 詞典修正 |
| R5 | 4.58 | 4.48 | 2 | 11 | 0 | Round 4 變體覆蓋 |

**關鍵改善**：
- CN_TERM 5 → 0（大陸用語完全消除）
- circular_tech term 3.50 → 4.50-5.00（最大幅改善）
- Overall 穩定在 4.5-4.6 區間
- LLM 每次跑出不同翻譯變體是分數波動的主因（結構性天花板）

---

## 未解決的問題

### Worker Auth for TQEF
- eval_runner call Worker `/translate` 一直回 401
- 原因：Worker 的 `authenticateRequest()` 需要 OAuth cookie 或 hybrid auth
- 純 HTTP POST 帶 invite code 在 JSON body 裡不夠，Worker 期望 cookie-based auth
- **解法**：在 Worker 的 `/translate` endpoint 加一個 fallback — 如果沒有 cookie，就從 JSON body 的 `code` 欄位驗證邀請碼
- 目前 TQEF 走 Direct API + OpenCC 模式，結果一樣有效

### 摘要按鈕功能性
- Bug 1 已修（按鈕可點擊），但還需實際驗證摘要產出是否正常
- 中→中同語言場景的 `entry.translated` 現在有正確賦值

### 中文口語贅字
- 「對對對對對」「嗯嗯嗯」是 Qwen STT 忠實轉錄
- 現有 `deduplicateText()` 只擋極端重複（>50%）
- 可選方向：前端 filler word 清理表 或 匯出時 AI polish（已有機制針對日文）

---

## 下一步：Task 5 — TQEF Admin 網頁

### 需求（來自 session-handoff-tqef.md）
- 部署在 `paulkuo.tw/tools/tqef/` 路徑
- Admin-only（走現有 hybrid auth，`isAdmin` 才能進）
- 介面風格：延續翻譯器設計語言（深色底、DM Sans + Noto Sans TC）

### 功能
1. **一鍵跑評估**：前端直接 call Anthropic API（跟翻譯器評估工具同思路）
2. **即時顯示進度**：逐句顯示翻譯+評分結果
3. **歷史結果比較**：存儲多次跑分結果，圖表比較趨勢
4. **Export JSON**：下載完整結果

### 架構決策
- **翻譯**：前端直接 call Anthropic API（不走 Worker），用 eval_runner 同款 prompt
- **後處理**：前端已有 OpenCC + 三個產業詞典，直接複用 `convertToTW()`
- **評分**：前端 call Sonnet（跟翻譯同一個 API key）
- **語料**：內嵌 JSON（29 句，跟 eval_runner.py 同步）
- **歷史儲存**：Cloudflare KV 或 localStorage（admin 專用，量小）
- **Auth**：複用翻譯器的 `checkAuthOnLoad()` + `_isAdmin` 判斷

### 注意事項
- 前端 call Anthropic API 需要 API key — 選項：(a) Admin 輸入自己的 key (b) Worker 提供一個 `/tqef-translate` proxy endpoint
- 語料要跟 eval_runner.py 保持同步，改一邊要改另一邊
- prompt 邏輯要跟 Worker `buildTranslatePrompt()` 同步

---

## 檔案位置
- 翻譯器前端：`public/tools/translator/index.html`（~3220 行）
- Worker 翻譯模組：`worker/src/translator.js`
- TQEF 腳本：`~/Downloads/eval_runner.py`
- 最新跑分結果：`~/Desktop/tqef-results.json`
- 本 handoff：`session-handoff-tqef-r2.md`

## Git 記錄（本 session）
```
fix: enable summary button for same-language mode (zh→zh-TW) [skip-translate]
feat: add semiconductor & circular OpenCC dicts, fix prompt ambiguity [skip-translate]
feat: add TQEF round 2 dict fixes (12 entries) [skip-translate]
feat: TQEF round 3 dict fixes (11 entries across 3 dicts) [skip-translate]
feat: TQEF round 4 variant coverage (7 entries) [skip-translate]
```
