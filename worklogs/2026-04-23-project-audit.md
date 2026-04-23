# paulkuo.tw 專案現狀深度盤點報告

> 製作日期：2026-04-23
> 製作者：Cowork（Opus 4.7）
> 範圍：整個 monorepo（六個子專案 + 治理體系 + Worker API + AI Ready 引擎）
> 方法：靜態讀檔，無實跑 curl/eval/deploy
> 觸發：Paul 要求深度盤點現狀、代辦、程式碼狀態

---

## TL;DR（一分鐘版）

- **整體狀態**：活躍開發中，近 6 天平均每日 20+ commit，節奏非常快（commit velocity：4/19→23，4/20→28，4/21→22，4/22→16，4/23→27）
- **本週主軸**：AI 味大掃除（featured articles 全數 commit 完成，PENDING 已標 ✅）+ Wiki Enrich E2.5.1 + E3 concept 頁生成
- **最緊急的 3 件事**：
  1. **工作區髒亂**：165 個 untracked + 4 個 modified；其中 4 個 commit 未 push 到 origin/main
  2. **AI Ready eval 卡住**：JSON-LD 缺口 +8 + AI Comprehension Q3 缺口 +2 同時待修，`experiments.json` 現為空檔
  3. **iCloud 衝突副本爆量**：40+ 個「檔名 2.md / 3.md / 4.md」污染 repo
- **治理層**：協作憲法 v0.2 + v0.3 + working-environment rev2.2 都已拍板，但有 4 個未解 H 級議題卡在 Chat 立法 / Cowork 司法
- **風險訊號**：程式碼本身乾淨（無衝突標記、TODO 稀少），風險主要在「工作流程治理」+「跨 session 同步」層

---

## 1. Repo 宏觀結構

### 1.1 子專案列表（六個）

| 子專案 | 路徑前綴 | API 前綴 | Cowork Project | 儀表板 |
|---|---|---|---|---|
| 主站 | `/` `/articles/` | 多個 | Paukuo網站 | #155 |
| Formosa ESG 2026 | `/projects/formosa-esg-2026/` | `/api/formosa/*` | 白沙屯ESG繞境 | #155 |
| LLM Wiki | `/wiki/` | `/api/wiki/*` | LLM Wiki | #157 |
| ACP | `/tools/ai-collab-portfolio/` | `/api/acp/*` | AI Collaboration Portfolio | #155 |
| AI Ready | `/tools/ai-ready-dashboard` | `paulkuo-eval.paul-4bf.workers.dev` | AI Ready（本專案） | #155 |
| TQEF | `/tools/tqef/` | `/api/tqef/*` | 阿哥拉廣場 | — |

### 1.2 技術棧

- **前端**：Astro 5.17.1 + React 19.2.4，部署到 Cloudflare Pages
- **API**：Cloudflare Workers + D1（paulkuo-auth）+ KV（TICKER_KV）+ R2（TQEF_AUDIO, FORMOSA_OG）
- **AI Ready 引擎**：Python（optimize.py 657 行、multi_model_query.py 454 行）
- **Eval Worker**：TypeScript（563 行），獨立部署在 `paulkuo-eval.paul-4bf.workers.dev`
- **套件管理**：pnpm
- **版本**：package.json v2.15.0

### 1.3 內容量規模

| 類型 | 數量 |
|---|---|
| 文章（主檔 md） | 95 篇 |
| Wiki concepts | 38 個 |
| Wiki sources | 300 個 |
| Wiki 總 md 檔 | 488 |
| Worker src 檔案 | 23 支 |
| Worker 總行數 | 9,998 行 |
| scripts/ | 54 支 |
| GitHub Actions | 13 支 |

---

## 2. 代辦事項（PENDING 全盤）

### 2.1 Code 待執行

| 優先 | 項目 | 提出日 | 狀態 |
|---|---|---|---|
| — | Formosa Post-Event Issues 批次修復 | 2026-04-21 | ✅ 完成 |
| — | 文章 AI 味掃描 + 改寫（featured） | 2026-04-23 | ✅ 完成 |
| 🟡 | YouTube transcript Whisper backfill（19/23） | 2026-04-16 | 等 Paul 提供 GROQ_API_KEY |
| 🟡 | YouTube transcript Worker deploy | — | 前置依賴上一項 |
| 🟢 | wiki-youtube-ingest.cjs 加中間檔清理 | 2026-04-19 | 等轉檔批次跑完 |
| 🟡 | **AI Ready JSON-LD 缺口（+8）** | 2026-04-21 | 未動 — 見 §3.1 |
| 🟡 | **AI Ready AI Comprehension Q3 精度修正（+2）** | 2026-04-21 | 未動 — 見 §3.1 |

### 2.2 Cowork 司法待執行

| 優先 | 項目 | 提出日 |
|---|---|---|
| 🟡 | H3：auto-memory 跨視窗不對稱寫入 working-environment.md §1.2 | 2026-04-20 |
| 🟡 | H4：Cowork 新 session 剛性核查補強（session-handoff SKILL.md） | 2026-04-20 |

### 2.3 Chat 立法待執行

| 優先 | 項目 | 提出日 |
|---|---|---|
| 🔴 | H1：憲法第二條 C 層（Claude.ai Personal Skill）同步機制缺失 | 2026-04-20 |
| 🔴 | H2：Chat 視窗精確事實查詢結構性上限 — 新增憲法實施細則 | 2026-04-20 |

### 2.4 PENDING 狀態觀察

- **閉環率**：2 件標 ✅（AI 味掃描 + Formosa Post-Event），7 件 🟡/🟢/🔴 開放
- **卡關類型**：
  - 🟡 YouTube 系列卡在外部 API Key 待提供
  - 🟡 AI Ready 雙修（JSON-LD +8 / Q3 +2）都已具體分析完但未動
  - 🔴 H1/H2 需要 Chat 主責才能立法，不是 Cowork 能單邊解決
- **跨專案備忘**（2026-04-09 起累積）：主要是 Issue #155 sync-dashboard Action 相關的機制紀錄，非代辦

---

## 3. 「讓 AI 懂我」子專案現狀（本 Cowork 綁定專案）

### 3.1 四層評分現狀（來自 program.md + PENDING）

| 層 | 滿分 | 目前 | 缺口 | 狀態 |
|---|---|---|---|---|
| llms.txt | 25 | 25 | 0 | ✅ 已滿分 |
| JSON-LD | 25 | 12→22 | **+3 待確認** | ⚠️ 2026-04-21 部署 commit b5f604d，待 eval 確認 |
| MCP + A2A | 25 | 25 | 0 | ✅ 已滿分 |
| AI Comprehension | 25 | 23 | +2 | ⚠️ Q3（content pillars 數量）答錯待修 |
| **合計** | 100 | **85→93-95** | 待 eval | — |

### 3.2 關鍵發現

- **`experiments.json` 是空檔**：1 行，無任何實驗紀錄。最近一輪自動化修改是 2026-04-21 的手動 JSON-LD fix（commit b5f604d），之後未跑 optimize.py
- **calibration_report.json 還是 2026-03-22 的資料**：10 次外部校準 mean=50.63 / stddev=5.86，已過一個月未重跑
- **External eval 有 temporal 日報**：最後一次是 `ext-temporal-20260406`，等於 4/6 以後停擺（2 週）
- **Eval Worker 已知問題**：eval-worker/src/index.ts 抽樣 /articles，但 /articles 已 301 redirect 到 /blog，eval 不追蹤 redirect → 0 schemas（PENDING 2026-04-21）
- **已分析但未動手**的兩個選項：
  - A：改 eval-worker 改抽 /blog（改 eval-worker/src/index.ts）
  - B：在 /articles/ 加 CollectionPage schema（不 redirect）

### 3.3 需要 Cowork 做決定的事

1. **JSON-LD +8 選項 A/B 拍板**：兩個都動影響的檔案不同（eval-worker vs siteSchema.ts + 移除 redirect），應先確認 eval 抽樣 URL 實況
2. **experiments.json 空檔策略**：是等 eval 確認 b5f604d 成效再跑，還是直接重啟迴圈？
3. **External eval 是否恢復排程**：`.github/workflows/external-eval.yml` 存在但 4/6 後沒跑過

---

## 4. 治理體系現狀

### 4.1 憲法／規範文件

| 文件 | 版本／狀態 | 說明 |
|---|---|---|
| 協作憲法 | v0.2（2026-04-19 拍板）+ v0.3 實施 ADR（2026-04-20） | 五條：SSoT / 載體對等 / 權責分工 / 記憶層次 / 記憶擴充 |
| Working Environment | rev2.2（2026-04-20） | Chat/Cowork/Code 三方職責、源頭事實清單、ADR 欄位、長度管制 |
| Quick Reference | rev1 | 憲法速記卡（含情境 7）181 行 |
| Shared File Impact Map | 2026-04-11 更新 | 跨子專案影響地圖；SSoT 為 `docs/shared-files.json` |
| Rollback Protocol | 存在於 `docs/governance/rollback-protocol.md` | 出事時的通用流程 |
| Skill Ownership ADR | draft（2026-04-20） | A 層為正本，B/C 層為 mirror |

### 4.2 Skill 長度監控（F-ID 化狀態）

依 working-environment §4.2 的三層規則（軟上限 200 / 內部觸發 800 / 硬界 900）：

| 檔案 | 行數 | 軟上限 200 相對值 | 狀態 |
|---|---|---|---|
| `.claude/skills/session-handoff/SKILL.md` | 621 行 | 310% | 🟡 逼近 77% 觸發點 |
| `CLAUDE.md` | 200 行 | 100%（剛好卡線） | 🟡 新規則不再進 CLAUDE.md |
| `docs/governance/constitution-v0.2-quick-reference.md` | 181 行 | 91% | 🟡 接近軟上限 |

⚠️ session-handoff SKILL.md 是近期最需監控的對象。v5.6/v5.7 若再加等量章節會觸發 800 行拆分討論。

### 4.3 Worklog 治理（根目錄 CLAUDE.md 強制）

- 規則：每完成一項有意義工作 → 追加 `worklogs/worklog-{YYYY-MM-DD}.md`，三維度必填（做了什麼 / 決策原因 / 阻礙踩坑）
- Smoke Test：每次 deploy 後立刻跑，結果寫進 worklog
- 今日 worklog（2026-04-23）：已累積 18 篇文章 AI 味修改紀錄 + KV seed 驗證，品質格式符合規範

---

## 5. 程式碼健康度

### 5.1 乾淨訊號 ✅

| 檢查項目 | 結果 |
|---|---|
| 衝突標記（`<<<<<<` / `>>>>>>`） | src/ 與 worker/src/ 皆 0，其他檔案都是文件範例或測試比較語法 |
| TODO/FIXME/XXX/HACK in worker/src | 僅 2 處（formosa.js、rich-menu-image.js） |
| TODO/FIXME/XXX/HACK in src | 僅 1 處（Formosa volunteer guide） |
| .env 安全 | 已 gitignored，無 leak |
| Worker 編譯就緒 | rich-menu-image.js 只有 1 行（可能是 stub 或已停用，需確認） |

### 5.2 注意訊號 ⚠️

| 訊號 | 狀況 |
|---|---|
| console.log in worker/src | 38 處跨 9 支檔（feed.js ×5、index.js ×10、visitors.js ×10） |
| Worker 大檔案 | formosa.js 2,569 行 / tqef-api.js 1,287 行 / visitors.js 1,042 行 |
| disk usage | node_modules 1.2G（正常）；dist 97M（build output）；wiki/articles content 各 3.7-3.8M |

### 5.3 Worker 檔案行數 top 5

1. `formosa.js` — 2,569 行（Formosa ESG）
2. `tqef-api.js` — 1,287 行（TQEF）
3. `visitors.js` — 1,042 行（流量分析）
4. `scorecard.js` — 748 行（跨 Formosa + 主站）
5. `translator.js` — 575 行（Wiki + 主站 + TQEF 共用）⚠️ 共用模組

---

## 6. 風險與技術債

### 6.1 🔴 極高風險

**R1. Git 工作區髒亂（165 untracked + 4 modified + 4 unpushed commits）**

- 4 個 modified：`.claude/skills/paulkuo-writing/SKILL.md`、`data/stock.json`、`data/timing.json`、`worklogs/worklog-2026-04-22.md`
- 本地 main 比 origin/main 多 4 個 commit（未 push）
- Untracked 涵蓋：handoffs/（大量 2026-04-17 到 2026-04-21 的未加入版控）、cowork session resume 副本、舊 draft 文章、新 svg、`.env.example.bak`
- **影響**：
  - 下次 pull --rebase 風險增加
  - handoffs/ 內的重要決策紀錄未入 git，如果 local 檔案丟了就沒了
  - CLAUDE.md 規定 commit + push 要原子操作避免 cron 衝突，但目前累積了 4 commit 未 push

**R2. iCloud 衝突副本大量污染**

- 40+ 個「檔名 2.md / 3.md / 4.md / 5.md」分布在 dist/、worklogs/、handoffs/、scripts/、tests/、根目錄
- 根目錄有 4 份 `SKILL.paulkuo-writing.v2.4` 系列
- scripts/ 有 `auto_update 2.log` 到 `auto_update 6.log`
- worklogs/ 有 `worklog-2026-04-15 2.md` 到 `worklog-2026-04-17 3.md` 系列
- **影響**：grep / find 結果會重複，commit 時若誤加進去會污染 git 歷史

**R3. AI Ready 自動化停擺**

- `experiments.json` 空檔
- external-eval 最後一次 2026-04-06（2 週前）
- JSON-LD +8 與 AI Comprehension +2 都待修，但沒人動
- **影響**：專案目標停滯，Cloudflare 重建後的分數無人驗

### 6.2 🟡 中等風險

**R4. Chat 立法債積壓（H1 + H2）**

- H1 的 C 層冷凍在 v4.13，repo 已到 v5.5/v5.6 — 憲法第二條「載體對等」無配套同步機制
- H2 的 Chat 精確事實查詢不可靠 — 憲法實施細則有缺口
- **影響**：跨視窗溝通誤差會持續累積（類似 4/18 的「1085 vs 522」踩坑）

**R5. 共用模組監控成本**

- translator.js 575 行，Wiki + 主站 + TQEF 三個子專案共用；改一次要驗三個 API
- worker/src/index.js 551 行為路由分派；改動涉及所有子專案 smoke test
- 目前沒有自動化的跨專案 smoke test runner，都靠 worklog 自律記錄

**R6. YouTube transcript 卡在外部依賴**

- Whisper backfill 19/23 支影片，等 GROQ_API_KEY
- 已兩週未動（2026-04-16 提出）
- worker 側 Innertube 多 client 嘗試效果有限（YouTube 全封）

### 6.3 🟢 較低風險但值得留意

- session-handoff SKILL.md 621 行（軟上限 310%），下次 major 升級前需評估拆分
- CLAUDE.md 200 行剛好卡軟上限，新規則必須走 working-environment §4.3 判斷樹
- Wiki sources 300 個 + concepts 38 個，成長速度快，未來索引/搜尋效能待觀察

---

## 7. 本週活動熱力（2026-04-18 以來）

| 日期 | commits | 主要活動 |
|---|---|---|
| 2026-04-18 | 4 | 工作環境定義 rev2 落地 |
| 2026-04-19 | 23 | Wiki 相關（E2、YouTube backfill）+ 憲法 v0.3 籌備 |
| 2026-04-20 | 28 | 憲法 v0.3 實施 + skill-ownership ADR + T-3 事故配套 |
| 2026-04-21 | 22 | Formosa post-event 批次修復 + AI Ready JSON-LD 部署 |
| 2026-04-22 | 16 | Wiki E2.5 / E2.5.1 prompt 強化 + E3 concept 頁生成 |
| 2026-04-23 | 27 | AI 味掃描 + 改寫（featured articles 全數）+ KV seed 驗證 |

近 6 天合計 120 個 commit。活動密集但聚焦。

---

## 8. 下一步建議

### 8.1 本週內（高優先，低風險）

**A. 把工作區整理乾淨（~30 分）**

1. 165 個 untracked 分類處理：
   - handoffs/ 下有紀錄價值的 → `git add` + commit
   - 根目錄舊 draft、cowork resume 副本 → 移到 `archive/` 或刪
   - iCloud 衝突副本（`* 2.md`、`* 3.md`）→ 確認主檔是對的就刪
2. 4 個 modified 檔 → 確認並 commit
3. `git push` 把 4 個 unpushed commit 推上去
4. 跑一次 `git status --porcelain | wc -l`，確認降到個位數

**B. 清 iCloud 衝突副本（~15 分）**

一條指令掃完，確認後批次刪：

```bash
find . -name "* [0-9].md" -o -name "* [0-9].yaml" -o -name "* [0-9].log" -not -path "./node_modules/*"
```

### 8.2 本週內（中優先）

**C. AI Ready 恢復心跳**

先判斷 JSON-LD 選項 A/B（建議 A — 改 eval-worker 抽 /blog，風險較低不動前端），再做：

1. 跑一次 eval 確認 b5f604d（2026-04-21）的 JSON-LD 分數變化
2. 根據結果決定是否啟動 optimize.py
3. 重啟 external-eval.yml 排程（或手動跑一次）
4. 修 AI Comprehension Q3（檢查 llms.txt content pillars 數量與 benchmark 是否一致）

**D. 等 Paul 給 GROQ_API_KEY**

這件事已經兩週，建議主動 ping。YouTube backfill + Worker deploy 是連動的一組。

### 8.3 本月內（治理層）

**E. Chat 主責的 H1 + H2 落地（需要 Chat session）**

這兩件 Cowork 做不了，建議 Paul 開一個 Chat session 專門處理：
- H1 → 新 ADR「A→C Personal Skill 同步協議」
- H2 → 憲法實施細則新增

**F. Cowork 司法 H3 + H4（Cowork 可做）**

- H3 — working-environment.md §1.2 加一列明示 auto-memory 只對 Cowork 生效
- H4 — session-handoff SKILL.md 「Cowork 驗證盲區」加剛性核查條款

### 8.4 觀察項（不急但要留意）

- session-handoff SKILL.md（621 行）是否再膨脹到 800 行觸發點
- Wiki concepts（38）與 sources（300）的成長趨勢與搜尋效能
- Worker formosa.js 2,569 行，若再加功能考慮拆模組
- `experiments.json` 恢復寫入後，分數趨勢是否真的撿到 JSON-LD 的 +8

---

## 9. 驗證與限制

### 9.1 這份報告驗了什麼

- 讀檔：根目錄結構、子專案目錄、治理文件（憲法 / WE / 影響地圖 / AI Ready program.md / calibration / CLAUDE.md × 3）
- Grep：衝突標記、TODO/FIXME、console.log
- Bash（讀取類）：ls、wc、du、git log、git status、find

### 9.2 這份報告沒驗什麼

- ❌ 沒跑 curl production（沒驗 API 實際回傳）
- ❌ 沒跑 eval 確認 JSON-LD 真實分數
- ❌ 沒跑 Perplexity 多模型驗證
- ❌ 沒跑 Cloudflare build / deploy 驗證
- ❌ 沒讀 GitHub Issue #155 最新狀態（無 MCP 連線假設）

### 9.3 假設與已知盲點

- 假設 worklogs/、handoffs/ 的紀錄描述準確（沒有交叉驗證）
- 假設 PENDING.md 是最新狀態（但 scanner 自動產出段落是空的，可能 scanner 本身停擺）
- 本地 repo 與 origin/main 狀態有差（本地 4 commit 未 push），報告以本地為準

---

## Consequences（依 WE §3.2 規範）

- **若決策正確（本報告作為行動依據）**：Paul 依 §8.1 清工作區 + §8.2 恢復 AI Ready 心跳，一週內能把 R1/R2/R3 三大風險降下來
- **若決策錯誤的連鎖影響**：若先動 AI Ready 沒先清工作區，可能在髒 git state 下動 siteSchema.ts 觸發跨專案影響而不自知
- **可逆性**：報告本身只是盤點，沒有動任何程式碼或配置；§8 建議都是可逆的（清檔案可從 git 回復，eval 可重跑）
- **驗證收斂條件**：一週後（2026-04-30）檢查：(1) `git status --porcelain` 降到個位數；(2) `experiments.json` 有新紀錄；(3) external-eval.yml 最後執行日期更新到 4 月下旬

---

**上游**：
- `CLAUDE.md`（根目錄）
- `docs/shared-file-impact-map.md`
- `docs/governance/working-environment.md` rev2.2
- `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`
- `ai-ready-opt/program.md`
- `worklogs/PENDING.md`
- `worklogs/worklog-2026-04-{22,23}.md`
