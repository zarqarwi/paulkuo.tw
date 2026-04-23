# 阿哥拉廣場｜即時會議記錄 — 專案盤點報告

- **產出日期**：2026-04-23
- **產出者**：Cowork session（Opus 4.7）
- **範圍**：程式碼現狀掃描 / 待辦事項總覽 / Phase 2 開發編年史 / 跨子專案影響盤點
- **目的**：給 Paul 一份可 15 分鐘讀完的專案現況總覽，定位卡點與下一步

---

## 0. 三十秒摘要

阿哥拉廣場的核心翻譯器與 TQEF 評測系統自 **2026-03-17 前後結案**，從此進入凍結維運期。Paul 的精力從 3/25 開始全面轉向 Formosa ESG 起駕、4/5 轉向 LLM Wiki、4/14 轉向 AI Ready 優化循環、4/18 開始把大量時間投入治理框架（協作憲法 v0.2 → v0.3、session-handoff skill v4.3 → v5.6）。

翻譯器本體的狀態：**生產穩定、品質 R11 Overall 4.81、成本控制到位、但 Stage B 三軸線（COMET / Kappa / SD）零推進**。這不是出問題，是優先順序問題 — 白沙屯 ESG 起駕把所有資源吸走了。

最值得注意的事：這份 CLAUDE project instructions 寫的是「1.5 個月前的阿哥拉廣場」，跟 repo 實際開發重心已經脫鉤。阿哥拉是獨立 Cowork 專案但 TQEF 功能跑在 paulkuo.tw 的 Worker 上，本報告把兩邊看到的狀態併起來呈現。

---

## 1. 程式碼現狀

### 1.1 主要模組行數（2026-04-23 HEAD）

| 檔案 | 行數 | 說明 | 最近改動 |
|------|------|------|---------|
| `public/tools/translator/index.html` | **3,635** | 翻譯器前端（全部功能單檔） | 基底 commit `d9840a7`（Phase 2 前） |
| `worker/src/translator.js` | **575** | 翻譯邏輯 + prompt + OpenCC 後處理 | 基底 commit `d9840a7` |
| `worker/src/tqef-api.js` | **1,287** | TQEF API（dashboard / corpus / rounds / feedback / eval） | 基底 commit `d9840a7` |
| `worker/src/index.js` | **551** | Worker 路由（含 `/api/tqef/*` 13+ 端點） | 持續變動（受其他子專案影響） |
| `worker/src/auth.js` | **207** | OAuth + invite code + API-key 第三路 | 穩定 |
| `worker/src/costs.js` | **69** | 費用追蹤 | 穩定 |
| `worker/tqef-schema.sql` | **231** | TQEF 12 張表 schema | 穩定 |
| `worker/tqef-channel-c-schema.sql` | **29** | Channel C 音檔上傳 2 張表 | 待前端接 |
| `public/tools/tqef/index.html` | **183** | TQEF Admin 靜態版 | 穩定 |
| `public/tools/tqef/corpus.json` | **176**（行）| R6 測試用 29 句語料 | 穩定 |
| `src/pages/tools/tqef/admin/*.astro` | **1,490**（4 檔 + 2 results 子頁）| Admin 動態版 feedback/meetings/corpus intake | 穩定 |
| `eval_runner.py` | **~500**（14.8 KB）| 本地端評估腳本 | Phase 1 R6 結案時最後動 |

Project instructions 裡記的是 `index.html ~3620 行`、`translator.js ~250 行`、`tqef-api.js ~1277 行`。現值分別是 **3635 / 575 / 1287**，幾乎一致 — 但 `translator.js` 的 575 比 instructions 多 325 行，顯示後來有大幅擴充 prompt builder 與 STT handler（Groq / Google Chirp / Claude streaming），instructions 該條過時了。

### 1.2 程式碼品質訊號

**好的**
- 全 repo `worker/src/` 下 **只有 1 個 TODO**（`formosa.js:1047` 與 translator 無關）
- 沒有 FIXME / XXX / HACK 標記
- `translator.js` 的領域偵測與 OpenCC 後處理實作完整：`detectContext()` + `semiPostProcess()` + `circularPostProcess()` + `generalPostProcess()` + `businessPostProcess()` 五層防護
- P1 session-level domain lock 實作完整（`_sessionDomain` / `_sessionStartMs` / `SESSION_LOCK_WINDOW = 60000`）

**明確的 dead code / 已知問題（project instructions §5 記載，程式碼仍存在）**
- `index.html` 裡仍有 `_qwenAutoSwitched` / `_qwenSwitchPending` 舊邏輯未清（本次掃 grep 未命中，可能已清或改名；需人工確認）
- `dgUtteranceDuration` 在 Qwen 路徑回傳 0，導致中文成本計算不準（22% 偏差，以前端 `$0.00011/sec` 對比官方 `$0.00009/sec`；相關 memory `project_qwen_cost_fix.md` 已記）
- Dual AudioContext：volume meter + Qwen 各開一個，手機資源吃緊
- console log prefix 誤用 `[dg]`（應為 `[qwen]`）
- Qwen WebSocket 偶發 close 1005 未查根因（auto-reconnect 接住但不明所以）

### 1.3 Worker 路由（/api/tqef/*）

以下端點在 `worker/src/index.js` 確認存在並分派到 `tqef-api.js`：

```
GET  /api/tqef/dashboard         總覽統計
GET  /api/tqef/corpus            語料列表
POST /api/tqef/corpus            新增語料
POST /api/tqef/corpus/import     批次匯入
GET  /api/tqef/rounds            評測輪次（R6~R11）
POST /api/tqef/eval/upload       本地端 eval 結果回傳
POST /api/tqef/feedback          使用者回饋送出
GET  /api/tqef/feedback          回饋列表
POST /api/tqef/feedback/:id/adopt|reject|defer   審核路由
POST /tqef/claude                Claude 翻譯代理（供 tqef-admin 直打）
```

13+ 端點全接妥，Stage A 通道 A（會議匯出）與通道 B（用戶回饋）API 完備，**通道 C（音檔上傳）schema 存在但前端 UI 未接**。

### 1.4 阿哥拉廣場的最新「實際」改動

Git log 對 translator / TQEF 相關檔案的改動：

| 日期 | commit | 影響模組 |
|------|--------|---------|
| 2026-04-23 | `c48a74f` 以後全部 | 文章 AI 味改寫（不涉及 translator/TQEF） |
| 2026-04-17 | `e551149`, `6fa2a26`, `a1188fb` | Bot 分類三軌重構（analytics，標注 `[影響: ...+TQEF]`） |
| 2026-04-16 | `5c58ee0`, `e6d64a4` | YouTube transcript pipeline（借用 Whisper path，屬 Wiki） |
| 2026-04-09 | `9d5ebc4` | 修 impact map 把 TQEF/阿哥拉廣場歸入 6th sub-project |
| 2026-03-29 | `732543d`, `c4662aa` | Deepgram 付費顯示（dashboard.astro，不是 translator 本體） |

**結論：translator.js / tqef-api.js / index.html (translator) 這三個核心檔案自 Phase 2 第三週（~2026-03-17）起未被 touch。** 這是預期的，Phase 2 Stage A 結案後就進維運期。

---

## 2. Phase 2 編年史（2026-03-14 起，翻譯器視角）

Phase 2 分兩段很清楚：**3/14 ~ 3/17 Stage A 收尾衝刺**、**3/25 以後完全轉移到 Formosa**。

### 2.1 Stage A 結案期（2026-03-14 ~ 2026-03-17）

> 這段期間的 commit 不全在本 repo git log 可見（推論：部分改動在 Phase 2 早期一次性 import，後期才接 `auto_update_data` cron），但 Issue #155、session handoff TQEF R3 文件與 CLAUDE instructions 可交叉佐證。

- **R10 半導體詞典**：`semiPostProcess()` 55+ 組，Semi Term 3.83 → 5.00（滿分）
- **R11 循環科技詞典**：`circularPostProcess()` 80+ 組 + `generalPostProcess()` 8 組通用
- **R11 成績**：Overall **4.81**，Semi / Circular / Biz Term 全 **5.00**
- **P1 Session-level Domain Lock**：前 60 秒命中後整場鎖定，避免中段切換領域提示詞
- **Stage A 五源匯流**：手動 / 用戶回饋 / YouTube / 會議匯出 / STT benchmark 全管道打通，語料庫 **29 句 → 2,369 句**
- **BRONCI 台語評估**：台灣大哥大 B3-20260223 / base-taigi-20251209 測試完成，結論「中文辨識 Qwen 明確勝出（10/13 vs 4/13），BRONCI 定位為台語專用第四條路徑」

### 2.2 Phase 2 後期「非翻譯器的阿哥拉相關事件」

自 Stage A 結案後，translator/TQEF 本體沒動，但以下事件與阿哥拉廣場的生態相關：

- **2026-03-29** — Deepgram 從免費額度模式改為付費方案（dashboard.astro 顯示翻新，commit `732543d` → 檔案腐壞 → `c4662aa` 回滾還原）
- **2026-04-09** — 阿哥拉廣場 Cowork Instructions 撰寫完成（本檔開頭的 project_instructions）；影響地圖 `docs/shared-file-impact-map.md` 把 TQEF / 阿哥拉廣場補為第 6 個子專案（commit `9d5ebc4`）
- **2026-04-17** — Bot 分類三軌重構（analytics），標注 `[影響: Wiki + 主站 + Formosa + TQEF]`，屬於跨子專案共用模組（`worker/src/index.js`）的改動，需 TQEF smoke test 但未見異常
- **持續中** — Claude Haiku 4.5 auto-reload $10→$30 運作中，成本追蹤 KV per-record 寫入

### 2.3 Paul 的精力投放（Phase 2 全期）

粗略依 commit 熱度盤：

| 週期 | 主戰場 | 備註 |
|------|--------|------|
| 03-14 ~ 03-17 | TQEF Stage A 結案 | R11 + 五源管道 + BRONCI 評估 |
| 03-25 ~ 04-11 | **Formosa ESG 起駕** | 打卡、地圖、LINE Bot、8 輪 pre-launch audit（R1~R5） |
| 04-05 ~ 04-07 | LLM Wiki Phase 1~3 | 語料 ingest、cross-pillar regen、KV seed |
| 04-10 ~ 04-21 | **治理框架** | projects.json、governance API、Dashboard、憲法 v0.2 → v0.3、session-handoff v4.3 → v5.6 |
| 04-14 ~ 04-23 | AI Ready 優化循環 | eval-worker、llms.txt、AI 味十二項自檢改寫 |
| 04-16 ~ 04-23 | Wiki Phase 4 + E1~E3 | YouTube Whisper backfill、enrich cli、concept 頁面生成 |

阿哥拉廣場自 3/17 以後**幾乎零 commit**，但仍是正式上線的生產服務，使用者端運作正常。

---

## 3. 待辦事項盤點

### 3.1 TQEF Stage B 三軸線（零推進）

專案指令與 Issue #155 儀表板都明白記著但整個 Phase 2 後期完全沒動：

| 軸線 | 目標 | 現狀 | 卡點 |
|------|------|------|------|
| **軸線 1：COMET 交叉驗證** | Pearson r ≥ 0.6 | 0% | 沒人抽樣、沒人跑 COMET |
| **軸線 2：人類專家基線** | Cohen's Kappa ≥ 0.5 | 評分指南 + Excel 模板已產出，未送出 | 沒聯繫翻譯專家 |
| **軸線 3：評分穩定性** | SD < 0.2 | 0% | 沒同批跑 3 次 |

結案條件是三個都達標。目前都卡在第一步「抽樣 100 句 + 跑腳本」。

### 3.2 阿哥拉廣場專屬待辦（從 project_instructions §5）

**Bug / 已知問題（優先順序由上到下）**

- `dgUtteranceDuration=0`（Qwen cost tracking 不準，已有 `.auto-memory` 記錄）
- Qwen WebSocket 偶發 1005（auto-reconnect 有接，根因未查）
- Dead code 清理：`_qwenAutoSwitched` / `_qwenSwitchPending` / auto-detect 舊邏輯（本次 grep 未命中，需人工確認是否已清）
- Dual AudioContext 合併（手機效能）
- console log prefix `[dg]` → `[qwen]`
- Safari 桌面版被誤判為 twitter in-app browser

**功能待辦**

- 中文 Speaker Diarization（Qwen 不支援 `spk=-1`，研究 Qwen3.5-Omni 是否可補；memory 記「Qwen3.5-Omni 是 LLM 不是 ASR，diarization 仍不支援」，這條可以收掉）
- iOS Safari 實機 AudioContext resample 驗證
- Qwen 繁體直出（試 zh-TW 或 mapping table 省翻譯 API 成本）
- 自動化測試腳本（Node.js PCM → WS → WER regression）
- BRONCI 台語整合（等前端加台語選項）
- regenerative_medicine 分數 4.64 偏低 → 可建醫療 OpenCC 詞典
- 靜態版 TQEF（`public/tools/tqef/index.html`）unicode escape placeholder 修復
- TQEF Admin：通道 C（音檔上傳 UI）設計

### 3.3 跨專案備忘中與 TQEF 無關但值得知道的

來自 `worklogs/PENDING.md`，不是阿哥拉廣場的事，但 Cowork session 開場應該知道：

- **YouTube transcript Whisper backfill** — 19/23 影片，要 Paul 設 `GROQ_API_KEY` 後跑（Wiki 子專案）
- **AI Ready JSON-LD 缺口** +8 — `/articles` redirect 到 `/blog` 讓 eval-worker 抽不到 schemas
- **AI Ready AI Comprehension Q3** — llms.txt 的 content pillars 數量與 benchmark 不一致
- **憲法層級議題** — H1 ~ H4（C 層同步 / Chat 精確事實上限 / auto-memory 不對稱 / Cowork 繞過剛性核查）等 Chat/Cowork 司法處理

### 3.4 根本「沒寫進待辦但該想的」事

本次盤點發現 project_instructions §5 的「功能待辦」從 Phase 2 Stage A 結案起**完全沒有更新**。以下幾件事該決策：

1. **Stage B 要不要真的做？** 如果白沙屯 ESG 起駕已過（4/21 有 `530b270` merge，應已結束），有無可能排個 session 給 COMET 抽樣腳本
2. **阿哥拉廣場還在持續被使用嗎？** 若 DAU > 0，Qwen cost 22% 偏差會放大；若 DAU = 0，這個 bug 可以晾著
3. **Instructions 本身需要更新** — 檔案中「行數」「最近狀態」「已知問題」有多處與 repo 現狀脫節
4. **LinkedIn API 申請（social-poster）** 在舊 instructions 寫「待串接」，現在阿哥拉上下文應該與 social 無關，建議從這份 instructions 移除

---

## 4. 跨子專案影響盤點

### 4.1 阿哥拉廣場的共用依賴

引用 `docs/shared-file-impact-map.md`：

| 模組 | 共用範圍 | 對阿哥拉廣場的意義 |
|------|---------|--------------------|
| `worker/src/index.js` | 全部子專案 | 路由改動可能壞 `/api/tqef/*` |
| `worker/src/config.js` | 全部 | PRICING / STT_RATE_LIMIT 等 |
| `worker/src/utils.js` | 全部 | corsHeaders / jsonResponse |
| `worker/src/auth.js` | 全部受保護端點 | OAuth + invite code 雙層驗證 |
| `worker/src/translator.js` | Wiki + 主站 + **TQEF** | OpenCC / prompt / domain detect |
| `AUTH_DB` (paulkuo-auth) D1 | 主站 + Formosa + ACP + TQEF | Schema 變更風險 |
| `TICKER_KV` | 全部 | 邀請碼 / 費用 / 時間追蹤 |
| `TQEF_AUDIO` R2 | 只 TQEF | Channel C 音檔 |

### 4.2 Phase 2 後期波及阿哥拉的事件

從 commit message 標注的 `[影響: ...+TQEF]` 過濾：

| 日期 | commit | 事件 | 影響評估 |
|------|--------|------|---------|
| 04-17 | `e551149` | `/analytics/reclass` 一次性歷史回填 endpoint | TQEF analytics 可能受益，無破壞 |
| 04-17 | `6fa2a26` | Bot 分類三軌 LLM/Search/SEO-Tool 重構 | TQEF feedback 回傳來源分類可能改寫 |
| 04-17 | `a1188fb` | topCrawlers 百分比分母修正 | 不影響 TQEF 本體 |

以上三個都是 analytics 模組，對 TQEF 本體邏輯零改動。Smoke test 未見異常（從 worklog 反推）。

### 4.3 阿哥拉廣場反過來會影響誰

翻譯器本體不動其他子專案。但：

- 改 `worker/src/translator.js`（例如加醫療 OpenCC 詞典）會影響 **Wiki + 主站 + TQEF** 三個
- 改 `worker/src/auth.js`（例如 Qwen streaming auth 調整）會影響**全部子專案**
- 改 `AUTH_DB` schema（例如 TQEF 加新 column）會影響 Formosa + ACP

動任何一個核心模組前先查 `docs/shared-file-impact-map.md` 的「最低驗證」指令。

---

## 5. 文件體系狀態

### 5.1 阿哥拉相關文件清單

| 路徑 | 類型 | 狀態 |
|------|------|------|
| `session-handoff-tqef-r3.md`（repo root） | R6 結案 handoff | 凍結 |
| `data/tqef-archive/*.json` | R6~R11 歷史評測結果 | 只增不改 |
| `tqef-2026-03-15-dryrun.json` | Stage A dryrun 結果 | 凍結 |
| `scripts/tqef-migrate-direct.mjs` | D1 migration 腳本 | 凍結 |
| `worklogs/code--commit-impact-map-tqef-fix-2026-04-09.md` | TQEF 加入影響地圖的 handoff | 凍結 |
| `docs/shared-file-impact-map.md` | 跨子專案影響地圖 | **活文件**，最近 04-11 更新 |
| `worklogs/issue-155-body.md` | 專案狀態儀表板（SSoT） | **活文件**，最近 04-20 更新，TQEF 區塊未動 |
| Cowork project_instructions | 阿哥拉廣場 Cowork 專案指示 | **1.5 個月未更新** |

### 5.2 Issue #155 儀表板中的阿哥拉區塊（2026-04-20 未動）

```
## 阿哥拉廣場｜即時會議記錄
**翻譯引擎：** R11 ✅（Overall 4.81，Semi/Circular/Biz Term 全部 5.00）
**TQEF Phase 1 ✅** 已結案（7輪評測 R6→R11，語料庫 29 句）
**TQEF Phase 2 Stage A ✅** 語料庫 2,369 句，五源匯流管道完成
**TQEF Phase 2 Stage B ⏳ 進行中**
- [ ] 軸線 1：COMET 交叉驗證
- [ ] 軸線 2：人類專家基線
- [ ] 軸線 3：評分穩定性
- [ ] BRONCI 台語整合
```

這段是唯一同時兼具「Paul 認定的現狀」與「活文件」屬性的敘述。**Stage B 四個 checkbox 全空**是最關鍵的 signal。

---

## 6. 觀察與建議

### 6.1 值得慶幸的事

- 翻譯器本體非常穩定：R11 Overall 4.81、三個專業領域 Term 5.00 是會議記錄類產品裡少見的水準
- 成本結構優秀：中文 $0.40/hr、英文 $0.04/hr、日文商務 ~$0.96/hr，比競品便宜一個數量級
- 架構設計經得起考驗：四路 STT 路由、領域偵測 + OpenCC 後處理、session-level domain lock 都是正確抽象
- 治理框架成熟：commit 影響標注、PENDING.md 跨 session 佇列、Issue #155 單一事實來源

### 6.2 風險與盲區

1. **Stage B 零推進已 5 週** — 如果「商用工具 80%」這個定位要立住，COMET / Kappa / SD 的三把尺必須真的量過；否則 R11 4.81 只是 Paul 自評，對外無法開口
2. **Instructions 漂移** — Cowork 每次開場都讀 1.5 個月前的指令，session 會基於過時的認知決策
3. **生產監控真空** — worklog 裡沒看到任何阿哥拉廣場的 DAU / 錯誤率 / 成本曲線追蹤。Qwen 的 22% cost 偏差、Qwen WS 1005 斷線的根因如果沒人盯著，實際發生時只有使用者抱怨才會知道
4. **Channel C（音檔上傳）懸空** — schema 寫了、API 沒寫、前端更沒寫。要嘛結案拿掉，要嘛排一個 session 做掉，擺著最糟

### 6.3 具體建議（優先順序）

**本週可做（低投入）**
- 更新 Cowork project_instructions（改行數、改狀態、拿掉已處理完的 Qwen3.5-Omni 評估項、加上 2026-04 後的「什麼都沒動」一句）
- 跑一次阿哥拉廣場 smoke test：`curl https://paulkuo.tw/tools/translator/`、`curl https://api.paulkuo.tw/api/tqef/rounds`，把結果寫到 worklog

**下個月可做（中投入）**
- 排一個 Cowork session 推 Stage B 軸線 1：寫 COMET 抽樣腳本 → D1 抽 100 句 → 跑翻譯 + GPT-4o ref → COMET 評分（這是三軸裡最容易動的）
- 清 dead code（grep 搜 `_qwenAutoSwitched` 等，確認是否已清，未清則清）
- dgUtteranceDuration Qwen 路徑改用 `performance.now()` 追蹤（本次 grep 發現 L1360 附近已經用，需確認是否已修但 memory 未更新）

**季度可做（高投入）**
- 軸線 2 找翻譯專家評分
- 軸線 3 重複跑 3 次算 SD
- Channel C 音檔上傳完整做掉或結案拿掉
- BRONCI 台語整合排進 major version

### 6.4 最重要的一件事

> **決定阿哥拉廣場在 2026 Q2 的戰略位置。**

如果它是「已結案的作品集」，那 instructions 應該改成凍結狀態、把 Stage B 從 Issue #155 儀表板刪掉或加註「已擱置」。

如果它是「還在演進中的產品」，那 Stage B 三軸至少動一條，不然「1% 成本做到商用 80%」就是口號。

目前的狀態是「兩邊都不像」 — Issue #155 說「進行中」但 5 週零 commit，Instructions 寫「待辦 8 項」但 session 沒被排。建議 Paul 挑一邊做選擇。

---

## 7. 附錄：關鍵檔案速查

### 7.1 當機時去看這裡

| 症狀 | 先看 |
|------|------|
| `/api/tqef/*` 500 | `worker/src/tqef-api.js` + `wrangler tail` |
| 翻譯品質退化 | `worker/src/translator.js` 的 `detectContext` + OpenCC 後處理 |
| STT 失敗 | `worker/src/translator.js` 的 Groq / Google / Qwen 對應 handler |
| 認證失敗 | `worker/src/auth.js` 三路驗證（OAuth / invite / API-key） |
| 前端白屏 | `public/tools/translator/index.html` 的 auth gate |
| D1 schema 衝突 | `worker/tqef-schema.sql` + `worker/tqef-channel-c-schema.sql` |

### 7.2 部署指令

```bash
# Worker（必帶 --config）
cd worker && npx wrangler deploy --config wrangler.toml

# 前端（CI/CD）
git push origin main

# D1 查詢
wrangler d1 execute paulkuo-auth --remote --config worker/wrangler.toml --command "SELECT count(*) FROM tqef_corpus"
```

### 7.3 最低 smoke test

```bash
# 前端頁面
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/tools/translator/
curl -s -o /dev/null -w "%{http_code}" https://paulkuo.tw/tools/tqef/

# API 端點
curl -s -o /dev/null -w "%{http_code}" https://api.paulkuo.tw/api/tqef/rounds
curl -s -o /dev/null -w "%{http_code}" https://api.paulkuo.tw/api/tqef/dashboard
```

---

## 8. 盤點方法說明

本報告基於：

- 直接讀 `worker/src/*.js`、`public/tools/translator/index.html`、`public/tools/tqef/` 的實際程式碼
- `git log --all --since="2026-03-14"` 的 commit 紀錄（1,975 個 commit）
- `worklogs/` 下 Phase 2 期間的所有 worklog（~150 份）
- `worklogs/issue-155-body.md` 單一事實來源儀表板
- `worklogs/PENDING.md` 跨 session 待辦佇列
- `docs/shared-file-impact-map.md` 跨子專案影響地圖
- Cowork project_instructions（含 Paul 設定的阿哥拉廣場 SOP）
- `.auto-memory/` 相關記憶（Qwen cost fix / Qwen3.5-Omni 評估）

盤點未做的事：
- 實際 curl 打線上 API 驗證（需 deploy 授權，未執行）
- D1 實際資料量查詢（`PRAGMA` 或 `SELECT count(*)`，未執行）
- 跑 `eval_runner.py` 重跑 R11（本次只讀不執行）
- BRONCI / Qwen 實機 WER 測試

如需追加以上任一，告訴我要哪一塊。

---

**報告結束。**

*產出者：Cowork session（Opus 4.7） / 2026-04-23*
