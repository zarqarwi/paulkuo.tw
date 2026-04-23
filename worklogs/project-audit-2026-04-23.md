# paulkuo.tw 專案深度盤點報告

> 產出日期：2026-04-23
> 產出方式：Cowork session 全盤掃描（repo 目錄 + worklogs + GitHub issues + 治理文件 + 技術債）
> 範圍：整個 repo（主站 + Worker + Wiki + 六個子專案 + 治理機制）

---

## TL;DR（一分鐘快照）

專案整體健康度 🟢 **良好**，但根目錄與 worklogs 累積了一層該清理的雜物。

- **主線活躍度**：最近 3 天有 24 筆 commit，全部是「去除 AI 味」批次重寫，已清空 `PENDING.md` 裡最大一項
- **Formosa ESG 2026**：🎉 4/12 活動圓滿落幕、Post-event 4/21 merge 完畢，只剩 3 個 long-tail backlog issue
- **LLM Wiki**：Corpus 320 頁（300 sources / 19 concepts / 1 entity），KV seed 昨天剛更新，E3 concept 生成剛跑完
- **AI Ready**：本週從 85 → 90 分，剩 JSON-LD +8 與 AI Comprehension +2 兩個缺口
- **治理框架**：協作憲法 v0.2 + v0.3 實施完畢，working-environment rev2 Accepted
- **本地狀態**：🟡 `main` 分支領先 `origin/main` 4 筆未 push、大量 untracked handoff 檔案、32 個帶「空格 2/3/4」的重複檔案（iCloud 衝突殘留）

**最該優先處理的三件事：**
1. Push `main` 4 筆未推送 commit，並清理 untracked files（handoffs/、worklogs/、pnpm-lock）
2. PENDING.md 裡 `YouTube transcript Whisper backfill`（19 支影片，卡 `GROQ_API_KEY`）
3. AI Ready JSON-LD 缺口修復：`/articles` 301 redirect 讓 eval-worker 抽樣到 0 schemas

---

## 一、Repo 狀態

### 1.1 Git 狀態

| 項目 | 狀態 |
|------|------|
| 當前分支 | `main` |
| 與 origin 差距 | **領先 4 筆 commit**（未 push）|
| Uncommitted 修改 | 4 個檔案（SKILL.md、stock.json、timing.json、worklog-2026-04-22.md）|
| Untracked 檔案 | **約 80+ 個**（詳見下方）|
| 存活分支 | 7 個 local 分支（多為歷史 fix 分支）|

**Local 分支清單：**
```
feat/sedan-gps-tracking
fix/checkin-cors-and-cleanup
fix/formosa-post-event         ← Formosa post-event，2026-04-21 已 merge
fix/issue-90-redirect
fix/issue-92-checkin-count-jump
fix/post-incident-regression
fix/youtube-transcript-pipeline  ← YouTube transcript 修復，待 merge
main *
```

**最近 20 筆 commit（2026-04-23 當日動作）：**
全部都是 `fix(article): 去除 AI 味 [xxx] - 命中 N 項`，共清理約 20 篇文章。這對應 `PENDING.md` 的「AI 味掃描」任務，已完成標記 `[x]`。

### 1.2 Untracked / Stash 技術債

這些檔案堆在 repo 根目錄與 handoffs/ 下，該決定歸檔或 gitignore：

**根目錄雜物（41 個 .md）：**
- `SKILL.paulkuo-writing.v2.4*.md`（4 份，帶「空格 2/3/4」的 iCloud 衝突殘留）
- `cowork--paulkuo.tw-session-resume-2026-04-17*.md`（4 份同樣問題）
- `pnpm-lock 2/3/4.yaml`（3 份 iCloud 衝突殘留）
- 早期 handoff / 設計文件散落在根目錄（應歸檔到 `handoffs/done/` 或 `docs/archive/`）

**worklogs/ 重複檔案：**
- **32 個帶「空格 2/3/4」的重複檔案**（iCloud 衝突殘留，建議一次性刪除）
- 49 份 `worklog-YYYY-MM-DD.md`（正常累積）
- 18 份 `wiki-web-pending-*` + 14 份 `impact-scan-*`（scanner 自動產出，考慮 rotate 到 archive）

**src/content/wiki/raw/clips/：**
- **143 個 untracked 剪報**（從 2026-04-06 到 04-22 的 web collector 抓取結果，待 ingest）
- 這是 `wiki-web-collector` 每日 09:37 排程的輸出，沒被 gitignore 但也沒 commit，處於灰色地帶

**handoffs/ 未歸檔：**
- 71 個檔案在 `handoffs/` 根目錄，只有 3 個在 `handoffs/done/`
- 大量 `cowork--*` / `code--*` session handoff 從 2026-04-14 到 04-21 還在主目錄

### 1.3 目錄大小

| 目錄 | 大小 | 備註 |
|------|------|------|
| `node_modules/` | 1.2 GB | 正常 |
| `worker/` | 262 MB | ⚠️ 含 `backup-2026-03-30.sql` + `.wrangler` 大型本地快取 |
| `dist/` | 97 MB | build 產物，可 gitignore |
| `public/` | 64 MB | 圖片資源 |
| `src/` | 24 MB | |
| `worklogs/` | 2.2 MB | |
| `handoffs/` | 880 KB | |
| `docs/` | 624 KB | |
| `scripts/` | 488 KB | 46 個腳本 |

---

## 二、子專案現況

### 2.1 Paukuo主站 / paulkuo.tw

**技術棧：** Astro + Cloudflare Pages（靜態）+ Workers API
**文章數：** 95 篇中文主檔（不含 en/ja/zh-cn 翻譯版）
**Astro pages：** 164 個 .astro 檔
**最近動作：** 2026-04-23 完成 20 篇文章「去除 AI 味」批次改寫

**當前狀態：**
- ✅ AI Ready 分數 **90/100**（llms.txt 25/25、MCP+A2A 25/25、JSON-LD 17/25、AI Comprehension 23/25）
- 🟡 剩兩個缺口：JSON-LD +8（/articles redirect 問題）+ AI Comprehension +2

**Worker API（worker/src/，9998 行）：**

| 模組 | 行數 | 用途 |
|------|------|------|
| `formosa.js` | 2569 | Formosa ESG 白沙屯 API（最大模組）|
| `tqef-api.js` | 1287 | 阿哥拉廣場翻譯品質評估 |
| `visitors.js` | 1042 | 訪客分析、agentic SEO |
| `scorecard.js` | 748 | ACP 評量 |
| `translator.js` | 575 | 翻譯核心（共用模組）|
| `index.js` | 551 | Worker router |
| `youtube-ingest.js` | 493 | YouTube 字幕 ingest |
| `social.js` | 358 | 社群貼文 dispatch |
| `wiki-api.js` | 334 | Wiki 搜尋/ask API |
| 其他模組 | — | 共 19 支 |

### 2.2 Formosa ESG 2026（白沙屯 ESG 繞境）🎉

**狀態：** 4/12 活動完成、4/21 post-event merge，**進入結案後維護模式**

**Feedback：** 35 筆全結案（28 fixed / 3 wontfix）

**Long-tail backlog（open issues）：**
- #176 🔴 P1：GPS 軌跡停在彰化的回歸問題（#169 修完後又出現）
- #167：LINE 登入逾時 5s 太短
- #162：恢復「今日善足跡」選填區塊（水瓶+住宿）
- #160：LINE 推播 API 200 但使用者收不到
- #159：驗收清單 v1.2 修正（34→35）
- #152：Health check failure（4/8 那筆殘留）
- #141：分眾推播（行為/地理/等級篩選）
- #120：推播圖片 R2 上傳
- #117：志工說明書 Dashboard 網址改 mazu.today

**子目錄結構：** `src/pages/projects/formosa-esg-2026/`（62 個檔案）
- `dashboard/`、`faq/`、`feedback/`、`guide/`、`my/`、`privacy/`、`tracker/`、`verification/`

### 2.3 LLM Wiki（Karpathy Pattern）

**對應儀表板：** GitHub Issue #157（最後更新 2026-04-22）

**Corpus 現況（雙源數據）：**

| 指標 | Issue #157 | src/content/wiki 實測 |
|------|-----------|----------------------|
| Source 頁 | 300 | 300 |
| Concept 頁 | 19 | **38** |
| Entity 頁 | 1 | 1 |
| raw/clips 待審 | — | **143**（untracked）|
| stats.json total_pages | 250 | — |

> ⚠️ stats.json total_pages 顯示 250 但實際 source 已到 300 —— stats.json 過期，建議重跑 `scripts/wiki_rescan.py`。
> ⚠️ Concept 頁實際 38 個（包含 E3 新建 6 個），Issue #157 標 19 是筆誤，該更新。

**Pipeline 健康度：**
- ✅ E1 / E2 / E2.5 / E2.5.1 enrichment 全線運行
- ✅ 2026-04-22 全量 batch rerun：300 支中 295 成功 / 5 失敗 / 9 wrong_pillar_suspected
- ✅ KV seed 2026-04-23 寫入確認（38 concepts + index + graph + stats）
- ✅ Worker API `api.paulkuo.tw/api/wiki/search` 回應正常

**三條自動化 scheduled tasks：**
- `wiki-ingest-scanner`（每日 10:02，掃 get_筆記）
- `wiki-web-collector`（每日 09:37，搜 pillar 關鍵字）
- `wiki-knowledge-digest`（每 2 天 10:00）

**Pillar 分布：** ai 21 / life 4 / startup 3 / circular 2 / faith 1（不均衡，faith/circular 偏少）
**Visibility 分布：** public 169 / internal 69 / unknown 9

### 2.4 ACP（AI 協作力評量）

**狀態：** Phase 1-3 全完成、Layer 2+3 上線、UX/A11y 修復完、D1 備份已建

**待辦：**
- beyond-man-days en 版本（等 Paul 另討論）
- ACP 視覺審查（手機 RWD、雙層雷達圖）
- ACP 社群推廣

### 2.5 阿哥拉廣場（即時會議翻譯）

**URL：** https://paulkuo.tw/tools/translator/
**翻譯引擎：** R11（Overall 4.81，Semi/Circular/Biz Term 全 5.00）
**核心模組：** `worker/src/translator.js`（575 行，跨專案共用）

**TQEF Phase 2 Stage B ⏳ 進行中：**
- 軸線 1：COMET 交叉驗證（目標 Pearson r ≥ 0.6）
- 軸線 2：人類專家基線（目標 Cohen's Kappa ≥ 0.5）
- 軸線 3：評分穩定性（目標 SD < 0.2）

**功能待辦：** iOS Safari 實機驗證、BRONCI 台語整合、medical OpenCC 詞典

### 2.6 治理 Dashboard

**URL：** https://paulkuo.tw/governance/
**Phase 1-2.5 ✅**、**Phase 3 🟡 未開始**（排程監測 + 異常偵測）
**Auth：** GOVERNANCE_TOKEN Bearer

---

## 三、技術債盤點

### 3.1 程式碼 TODO/FIXME/XXX/HACK

**出奇地少：** 整個 repo 只在以下位置找到：

| 檔案 | 數量 | 內容 |
|------|------|------|
| `worker/src/formosa.js:1047` | 1 | `// TODO: aggregate hotel/water from daily reports separately if needed` |
| `worker/src/rich-menu-image.js:1` | 1 | （檔案只有 1 行，應該是 stub）|
| `scripts/commit-msg-hook.sh` | 1 | (hook 腳本內註解) |
| `scripts/wiki-youtube-ingest.cjs` | 2 | |
| `scripts/wiki-youtube-ingest.cjs.bak` | 2 | ⚠️ **.bak 檔應刪除** |
| `src/pages/projects/formosa-esg-2026/guide/volunteer/_VolunteerGuidePage.astro:1` | 1 | |

這很健康——專案的未完成事項主要透過 PENDING.md / GitHub issues / worklogs 管理，而不是靠 inline TODO。

### 3.2 可疑檔案 / 殘留物

- `worker/backup-2026-03-30.sql`（SQL 備份，該搬去 archive 或 gitignore）
- `worker/src/rich-menu-image.js`（只有 1 行，功能未完或已廢）
- `scripts/wiki-youtube-ingest.cjs.bak`（.bak 檔）
- `.git-corrupt/`（2026-03-20 git 損毀救援殘留，可評估刪除）
- `scripts/auto_update*.log`（6 個 log 檔在 scripts/ 目錄，該挪走）
- 根目錄 41 個 .md（設計文件、handoff、草稿雜處，該歸檔）

### 3.3 重複分支

7 個 local feature/fix 分支，其中 `fix/formosa-post-event` 已 merge 到 main，可以刪除：

```bash
# 建議清理（確認 merge 狀態後）
git branch -d fix/formosa-post-event
git branch -d fix/issue-90-redirect
git branch -d fix/issue-92-checkin-count-jump
# fix/youtube-transcript-pipeline 還在用（PENDING 任務）
```

---

## 四、PENDING.md 跨 Session 佇列

共 **10 個 `[ ]` 未完成項目**，按優先級分：

### 4.1 待 Code 執行（6 項）

| 優先級 | 項目 | 建議模型 | 備註 |
|-------|------|---------|------|
| 🟡 | YouTube transcript Whisper backfill（19/23 影片）| Opus 4.6 | 卡 `GROQ_API_KEY`，成本 $0.5-1 |
| 🟡 | YouTube transcript Worker deploy | — | 前項完成後才做 |
| 🟢 | `wiki-youtube-ingest.cjs` 加中間檔清理 | Sonnet 4.6 | 等當前批次跑完 |
| 🟡 | AI Ready JSON-LD 缺口（+8）| Sonnet | /articles 301 redirect 讓 eval 抽到 0 schemas |
| 🟡 | AI Ready Q3 精度修正（+2）| Sonnet | llms.txt vs benchmark_questions.yaml 不一致 |

### 4.2 待 Cowork 執行（2 項，司法層）

- H3 🟡 auto-memory 跨視窗不對稱寫入 `working-environment.md §1.2`
- H4 🟡 Cowork 新 session 剛性核查補強（session-handoff SKILL.md）

### 4.3 待 Chat 立法（2 項）

- H1 🔴 憲法第二條 C 層同步機制缺失（需新 ADR）
- H2 🔴 Chat 視窗精確事實查詢結構性上限（憲法實施細則）

---

## 五、GitHub Issues 儀表板

### 5.1 總計

- **Open issues：82**
- 其中 **social-review 類 39 個**（社群摘要排程待審核，低優先）
- **非 social-review 只有 11 個**（真實需要處理的）

### 5.2 非 social-review 清單（11 個）

| # | Label | Title | 優先級 |
|---|-------|-------|-------|
| 152 | formosa-esg, health-check | 🚨 Health check failure 2026-04-08 | — |
| 155 | dashboard | 🎛️ 專案狀態儀表板（持續更新，勿關）| — |
| 157 | dashboard | 📚 LLM Wiki 知識管線儀表板 | — |
| 176 | bug, formosa-esg, P1 | GPS 軌跡停在彰化回歸 | 🔴 P1 |
| 167 | — | LINE 登入逾時 5s 太短 | — |
| 162 | enhancement | 恢復「今日善足跡」選填區塊 | — |
| 160 | bug | LINE 推播 API 200 但未收到 | — |
| 159 | Phase 3 | 驗收清單 v1.2 修正 | — |
| 141 | — | 分眾推播（行為/地理/等級）| — |
| 120 | enhancement | 推播圖片 R2 上傳 | — |
| 117 | documentation, Phase 3 | 志工說明書 Dashboard 網址改 mazu.today | — |

> 扣除兩個儀表板 Issue 與 social-review，實際 backlog = 9 個 issue，全集中在 Formosa ESG post-event long-tail。

---

## 六、治理機制現況

### 6.1 協作憲法 v0.2 + v0.3（2026-04-19 ~ 04-20）

- ✅ 五條核心條文全部 Accepted（SSoT / 載體對等 / 權責分工 / 記憶層次 / 記憶擴充）
- ✅ v0.3 四軌落地（commits b0860dd → eb91a9e → 6ed20f8 → 3c2f3a8）
- ✅ Quick reference 版本給跨視窗 session 快速載入用

**核心文件：**
- `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`（299 行）
- `docs/governance/adr-constitution-v0.3-implementation-2026-04-20.md`（298 行）
- `docs/governance/working-environment.md`（521 行，rev2 Accepted）
- `docs/governance/constitution-v0.2-quick-reference.md`
- `docs/governance/adr-skill-ownership-layer-draft-2026-04-20.md`（Draft）

### 6.2 跨視窗考試結果（2026-04-20）

來自 `project_cross_window_exam_findings.md` memory：
- **Code：97%** 正確
- **Chat：77%**
- **Cowork：70%**

揭露 memory lag + 憲法五條知識死角，對應 PENDING.md 的 H1-H4 四個需立法/司法修補項。

### 6.3 三層跨專案防線

從 memory `project_cross_project_defense.md`：
1. **Commit-msg hook**（`scripts/commit-msg-hook.sh`，需 `bash scripts/install-hooks.sh` 安裝）
2. **Skill 層** `.claude/skills/cross-project-impact/`
3. **Daily scanner**（每日 impact-scan-*.md 產出）

### 6.4 CLAUDE.md 分布

| 位置 | 行數/大小 | 用途 |
|------|-----------|------|
| `./CLAUDE.md` | 根目錄（6.8 KB）| 全 repo 共用、規則總匯 |
| `./src/content/wiki/CLAUDE.md` | — | Wiki 專屬 |
| `./src/pages/projects/formosa-esg-2026/CLAUDE.md` | — | Formosa 專屬 |

> ⚠️ CLAUDE.md 根據自己注記「目前 200 行剛好卡官方軟上限」，但實測 6.8 KB 沒到 200 行。新規則入檔前要跑 working-environment.md §4.3 判斷樹。

### 6.5 Skill 層（.claude/skills/）

共 10 個 skill：
- `cross-project-impact`、`formosa-feedback`、`formosa-feedback-triage`
- `organize-downloads`、`paulkuo-social`、`paulkuo-writing`
- `session-handoff`、`wiki-ingest`、`wiki-lint`

> 檢查點：憲法第二條要求 A 層（repo）→ C 層（使用者級）同步，這是 H1 的立法缺口（Chat 主責）。

---

## 七、建議行動清單（按優先級）

### 🔴 本週內處理

1. **Push `main` 4 筆未推送 commit**
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw
   git push origin main
   ```

2. **清理 iCloud 衝突殘留**（一次清掉 32+7 個帶「空格 2/3/4」的重複檔）
   ```bash
   find . -name "* [0-9].md" -not -path "./node_modules/*" | xargs ls -la  # 先確認
   find . -name "* [0-9].md" -not -path "./node_modules/*" -delete
   find . -name "pnpm-lock [0-9].yaml" -delete
   find . -name "SKILL.paulkuo-writing.v2.4 [0-9].md" -delete
   ```

3. **更新 Issue #157 Concept 數**：19 → 38（實測數）、stats.json total_pages 250 → 300

4. **處理 Formosa #176 P1 回歸 bug**（GPS 停在彰化的問題，#169 修完又出現）

### 🟡 兩週內處理

5. **YouTube transcript backfill**（19 支，等 Paul 提供 GROQ_API_KEY）
6. **AI Ready JSON-LD 修復**（/articles redirect 讓 eval 抽樣 0，選項 A 或 B）
7. **歸檔 handoffs/ 根目錄 71 個檔**（已完成的移到 handoffs/done/）
8. **歸檔根目錄 41 個 .md**（移到 docs/archive/ 或對應位置）
9. **刪除已 merge 的 local 分支**（`fix/formosa-post-event` 等）

### 🟢 長期 / 結構性

10. **處理 H1-H4 四個立法/司法項**（PENDING.md 裡 Chat/Cowork 待處理）
11. **wiki stats.json 自動化重跑**（目前顯示 250 但實際 300，scheduled task 可以補一條）
12. **scripts/ 下的 auto_update*.log rotate 機制**（每次 run 不要積 log 到 scripts/）
13. **.git-corrupt/ 評估是否可刪**（2026-03-20 救援殘留）

---

## 八、觀察與風險提示

### 8.1 專案活躍度健康

- 2026-04-17 到 04-23 七天內：49 份 worklog（含重複）、18 份 wiki-web-pending、14 份 impact-scan、71 份 handoff
- 但**治理文件與自動化沒跟上 cleanup 節奏**——worklogs/ 堆積著大量 scanner 自動產出，該設 rotation

### 8.2 Pillar 不均衡

Wiki corpus 的 pillar 分布：ai 21 / life 4 / startup 3 / circular 2 / faith 1
→ 如果 Paul 想讓 Wiki 的 circular 跟 faith pillar 更有深度，需要主動補 source 或調整 ingest 排程的關鍵字權重。

### 8.3 治理成本開始顯現

協作憲法 + working-environment.md + ADR + exam 回答 + retrospective 已經累積到 10+ 份 governance 文件（624 KB）。好處是規則清晰，但：
- **新 session 開場的 context 成本變高**（特別是 Chat/Cowork 要載入五條憲法）
- **跨視窗考試 Cowork 才 70% 通過**——文件沒保證理解，需要精簡或再抽象化

對應 memory `feedback_avoid_reinventing_solved_problems.md`：未來治理機制擴展前，建議先搜業界現有方案。

### 8.4 單一事實來源（SSoT）分裂風險

目前追蹤專案狀態的來源有：
1. GitHub Issue #155（主）+ #157（Wiki）
2. `worklogs/PENDING.md`（跨 session 佇列）
3. `worklogs/worklog-YYYY-MM-DD.md`（每日日誌）
4. `docs/shared-file-impact-map.md`（跨子專案影響）

雖然 sync-dashboard Action 會自動把 `worklogs/issue-155-body.md` PATCH 到 Issue，但 **#157 還是手動更新**，今天就觀察到 Issue #157 的 concept 數（19）跟實測（38）不一致。建議把 #157 也接上 sync-dashboard Action。

---

## 附錄 A：掃描方法

本報告由以下掃描步驟產出：
1. `git status` / `git log` / `git branch -a`
2. `ls` + `find` 列目錄結構與檔案數
3. GitHub MCP `search_issues` 拉 open issue 清單與 #155/#157 儀表板內文
4. Grep `TODO|FIXME|XXX|HACK` 全 repo
5. 讀 `worklogs/PENDING.md`、`worklog-2026-04-22.md`、`worklog-2026-04-23.md`
6. 讀 `src/content/wiki/stats.json`
7. 參照 auto-memory（`project_cross_project_defense.md`、`project_constitution_v02_facts.md` 等）

## 附錄 B：未檢查項目（留待深挖）

- Worker API 各 endpoint 的 smoke test 結果（沒實際打 API 驗證）
- ACP D1 實際資料量與 schema
- `dist/` build 產物是否與 `src/` 同步
- `.env` 裡的 secrets 是否有過期（GROQ_API_KEY、GOVERNANCE_TOKEN 等）
- `functions/` 下的 Pages Functions 實作
- `eval-worker/` 獨立 Worker 的狀態
- `tests/` 目錄下的測試通過率
- 最近一週的 CI / GitHub Actions 執行結果

如需深挖以上任一項，請另開 session 指定範圍。
