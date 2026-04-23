# Session Handoff — TQEF 翻譯精準度優化 Round 3（2026-03-10 深夜）

## 本 session 完成的事

### 1. Worker Auth fix — API-only 模式
- **根因**：`authenticateRequest()` 要求 session cookie + invite code 雙重驗證，純 HTTP POST（eval_runner）沒有 cookie 所以一律 401
- **修法**：`worker/src/auth.js` 加第三條路 — 沒有 session 但有合法 **admin 級** invite code → 放行
- `type: 'api-key'`，userId 合成為 `'api:' + inviteCode`，budget tracking 走 admin bypass
- 一般 user 級 invite code 仍需搭配 OAuth session，安全性不變
- **驗證**：`curl -X POST .../translate -d '{"text":"テスト","targetLang":"zh-TW","code":"Agora2026"}'` → `{"translated":"測試"}` ✅

### 2. 半導體 + 循環科技 Prompt 增強（translator.js）
- 新增 `SEMICONDUCTOR_TRIGGERS`（35 個關鍵字）+ `CIRCULAR_TRIGGERS`（24 個關鍵字）
- 新增 `detectContext(glossary, sourceText)` — 同時掃 glossary + source text（不再只看 glossary）
- `buildTranslatePrompt()` 新增半導體 / 循環專業 prompt blocks
- 兩個 call site 都更新：`handleTranslate` + `handleTranslateStream`
- **效果**：半導體 Terminology 從 **3.83 → 5.00**（六題全滿分）

### 3. TQEF 語料抽成獨立 JSON
- `public/tools/tqef/corpus.json`（29 句，17KB）
- 同步拷貝 `~/Downloads/corpus.json`（eval_runner.py 旁邊）
- eval_runner.py 的 `load_corpus()` 自動搜尋多個路徑

### 4. eval_runner.py Prompt 同步
- 新增 `SEMICONDUCTOR_TRIGGERS`、`CIRCULAR_TRIGGERS`、`detect_context()` 
- `build_translate_prompt()` 加 `source_text` 參數 + 半導體/循環 blocks
- 呼叫端傳 `source_ja` 給 prompt builder
- 語法驗證通過

### 5. TQEF R6 跑分結果（Worker pipeline + OpenCC）

| 指標 | R5 | **R6** | 變化 |
|---|---|---|---|
| Overall | 4.58 | **4.63** | +0.05 |
| Terminology | 4.48 | **4.55** | +0.07 |
| Fidelity | — | **4.62** | — |
| Critical Data | — | **4.90** | — |
| Critical errors | 2 | 2 | 持平 |
| CN_TERM | 0 | 1 | +1 |

**By Industry：**
| 產業 | R5 term | R6 term | R6 score |
|---|---|---|---|
| semiconductor | 3.83 | **5.00** | **4.90** |
| circular_tech | ~4.50 | 4.83 | 4.73 |
| mixed | — | 5.00 | 4.90 |
| regenerative_medicine | — | 4.25 | 4.42 |
| business_general | — | 3.80 | 4.30 |

---

## 未解決的問題

### 兩個 Critical Error（R6）
1. **MED-002**：「藥物運輸系統」→ 應為「藥物遞送系統」
   - 修法：醫療 prompt terms 加 `薬物送達システム=藥物遞送系統`
2. **BIZ-005**：NDA 被翻成「保密協議」→ 商務場景應保留英文縮寫
   - 修法：考慮加 business context detection，或在 base prompt 加 "preserve common abbreviations (NDA, MOU, LOI)"

### BIZ-003 的 CN_TERM 誤判
- judge 判「契約書」是大陸用語，建議改「合約」
- 實際上台灣兩者都用，「契約書」比「合約」更正式
- 可考慮調整 judge prompt 或 reference 答案

### business_general 是新的最弱項
- term=3.80，score=4.30，拉低整體
- 不像半導體/醫療有專業 prompt 加持
- 考慮加 business context prompt（敬語處理、常見商務術語台灣用法）

### eval_runner.py 的 prompt 同步維護
- 目前 eval_runner 有自己一份 `build_translate_prompt()`，跟 Worker 的要手動保持同步
- Worker 模式已通（auth fix），未來跑 TQEF 可以直接走 Worker pipeline，不需要 eval_runner 自己的 prompt
- 長期方向：eval_runner 只用 Worker 模式，移除本地 prompt 複製

---

## 重要發現

### Worker Deploy 指令澄清
- **API Worker**：`wrangler deploy --config worker/wrangler.toml`（部署 **paulkuo-ticker**，~102 KiB）
- **靜態前端**：`wrangler deploy --config wrangler.jsonc`（部署 **paulkuo-tw**，靜態資源）
- ⚠️ 之前 memory 寫的 `-c` 短旗標有時不穩定，建議統一用 `--config`
- 上個 session 發現用錯 config 會 deploy 到錯的 Worker 而不報錯

---

## 下一步建議（優先序）

1. **修 2 個 critical**：醫療 prompt 加「遞送系統」、base prompt 加 abbreviation preservation
2. **business_general 改善**：加 business context detection + 商務用語 prompt
3. **跑 R7 驗證**
4. **TQEF admin 網頁接 corpus.json**：目前語料還是內嵌，應改成 fetch corpus.json
5. **長期**：eval_runner 全面走 Worker 模式後，移除本地 prompt 複製

---

## 檔案位置
- 翻譯器前端：`public/tools/translator/index.html`（~3220 行）
- Worker 翻譯模組：`worker/src/translator.js`
- Worker Auth：`worker/src/auth.js`
- TQEF 語料：`public/tools/tqef/corpus.json`（29 句）+ `~/Downloads/corpus.json`
- TQEF 腳本：`~/Downloads/eval_runner.py`
- TQEF Admin：`public/tools/tqef/index.html`
- R6 跑分結果：`~/Desktop/tqef-results.json`
- 本 handoff：`session-handoff-tqef-r3.md`

## Git 記錄（本 session）
```
209c970 feat: auth API-key mode, semiconductor/circular prompts, TQEF corpus.json [skip-translate]
```

## 環境備忘
- TQEF 跑分指令：`export ANTHROPIC_API_KEY=sk-ant-... && export TQEF_WORKER_CODE=Agora2026 && python3 ~/Downloads/eval_runner.py`
- Admin 邀請碼：`Agora2026`（role: admin）
- Worker deploy：`wrangler deploy --config worker/wrangler.toml`
