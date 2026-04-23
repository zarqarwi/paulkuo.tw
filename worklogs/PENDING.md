# worklogs/PENDING.md — 跨 Session 待辦佇列

> 這個檔案是 Code ↔ Cowork 的直接溝通管道。
> Paul 不需要手動傳遞——兩個 session 開場時都應該先掃這個檔案。

## 使用規則

- **Code 寫**：需要 Cowork 接手的事項（狀態同步、文件產出、Issue 更新）
- **Cowork 寫**：需要 Code 執行的事項（deploy、DB migration、腳本跑測試）
- 完成後把該項目刪掉或標記 `[x]`，保持這個檔案乾淨
- 每項格式：`- [ ] {做什麼} → {給誰} ({日期})`

---

## 待 Code 執行

- [x] ✅ Formosa Post-Event Issues 批次修復 → 已完成（2026-04-21 merge commit `530b270`，#173/#174/#177/#178/#179 全 closed）

- [x] ✅ paulkuo.tw 文章 AI 味掃描 + 改寫 → 已完成（2026-04-23，featured articles 全部處理完畢）

  **任務目標：** 掃描 `src/content/articles/` 下的中文主檔（排除 en/ja/zh-cn 子目錄），對每篇逐條跑 AI 味十二項自檢，有命中的改寫，改完一篇 commit 一次。

  **工作目錄：**
  ```
  cd ~/Desktop/01_專案進行中/paulkuo.tw
  ```

  **掃描範圍：**
  - `src/content/articles/*.md`（不含子目錄的中文主檔）
  - 優先順序：`featured: true` 的文章 → `confidence: high` → 其餘依字母序

  **AI 味十二項自檢（逐條掃描，命中即改寫）：**

  1. **對仗式否定句**：「她不是 X，她是 Y」「這不是 A，這是 B」—— 用「而」結構加具體脈絡取代
  2. **二元對比句型**：「X 不僅僅是 Y，更是 Z」「真正的關鍵不在 A，而在 B」—— 一篇超過一次就改
  3. **遞進三連（乾淨的甜）**：三個短句排比結論 —— 讀出聲音測試，太工整就拆散
  4. **假主詞**：「數據說出了真相」「市場給出了答案」—— 換成具體的人或行為
  5. **萬用填空體**：「掌握 X 就等於掌握 Y 的核心競爭力」—— 把主詞換掉整句仍成立的就砍
  6. **概念名詞化（軟綿綿）**：「自我的探索」「情感的流動」—— 改成動詞：「找自己」「哭了」
  7. **沒有氣味的抽象金句**：五秒測試：這段文字能拍成電影嗎？不能就改寫加身體感知
  8. **假脆弱開場**：「老實說，我以前也這樣迷惘過」—— Paul 的個人經驗要有具體場景時間人物
  9. **儀式感結尾**：「讓我們拭目以待」「你準備好了嗎」—— 改成有餘韻的意象或問題
  10. **慣用詞黑名單**：「賦能」「底層邏輯」「維度」「格局」「閉環」「破圈」「生態」「躍遷」「範式」「降維」—— 一篇兩次以上就換白話
  11. **段落長度太均勻**：每段都三到五行整整齊齊 —— 主動插入一個只有一行的短段強調轉折
  12. **過度平衡病**：「當然，也有人認為⋯⋯」「這個問題確實有兩面性⋯⋯」—— Paul 有立場，潤稿時被稀釋的立場要還原

  **改寫 SOP：**
  1. `grep -l ""` 列出所有主檔，依優先順序排列
  2. 每篇：Read → 跑十二項自檢 → 列出命中清單 → 逐條改寫
  3. 改寫原則：只動命中的句子，不大幅重構結構；Paul 的個人經驗段落不動
  4. 改完：跑品質清單確認「AI 味自檢通過」checkbox → commit
  5. Commit message 格式：`fix(article): 去除 AI 味 [{slug}] - 命中 {N} 項`
  6. 同步更新 en/ja/zh-cn 三個翻譯版本（相同位置做對應修改）
  7. 每篇結果追加到 `worklogs/worklog-2026-04-23.md`

  **不要動的：**
  - Paul 的第一人稱親身經驗段落（即使有點不完美）
  - 引用他人的段落（那是事實，不是 AI 味）
  - FM frontmatter（除非有 AI 味詞出現在 thesis/subtitle）

  **產出：**
  - 每篇 commit + worklog 記錄（命中哪幾項、改了什麼）
  - 全部掃完後更新 PENDING.md 標記 `[x]`

- [ ] 🟡 YouTube transcript Whisper backfill（19/23 影片）→ Code / Opus 4.6 (2026-04-16)
  - 前提：Paul 提供 `GROQ_API_KEY` 到本機環境（`export GROQ_API_KEY=xxx`）
  - 執行：`node scripts/wiki-youtube-ingest.cjs --backfill`
  - 預估 19 個影片 × Whisper STT，成本約 $0.5-1 USD
  - 1 個影片 (Po6xqJsCook) 已設為 private，無法處理
  - 完成後跑 `node scripts/wiki-kv-seed.cjs` 更新 KV
  - branch: `fix/youtube-transcript-pipeline`，待 merge 到 main

- [ ] 🟡 YouTube transcript Worker deploy → Code (transcript 修復完成後)
  - Worker 的 Innertube 多 client 嘗試改完但 YouTube 全封，實際效果有限
  - 等本機 backfill 跑完確認穩定後再 deploy Worker
  - `cd worker && wrangler deploy --config wrangler.toml`

- [ ] 🟢 `scripts/wiki-youtube-ingest.cjs` 加中間檔清理邏輯 → Code / Sonnet 4.6 (2026-04-19)
  - Whisper transcribe 完成後 `fs.rmSync(tmpDir, { recursive: true, force: true })`，再 commit markdown
  - 目標：Cowork workspace 警訊時間間隔延長 3×（目前 wiki-youtube-pull 產出占 workspace 大宗）
  - **前提**：當前轉檔批次跑完再動（Paul 2026-04-19 明示不要打斷進行中的轉檔）
  - 來源：2026-04-19 workspace 警訊 L3 裁決 / `worklogs/cowork--workspace-cleanup-diagnostic-2026-04-19.md` 建議 A

- [ ] 🟡 AI Ready JSON-LD 缺口（+8）→ Code / Sonnet (2026-04-21)
  - 問題 A：eval-worker 抽樣 /articles，但 /articles 301 redirect 到 /blog，eval 不追蹤 redirect → 0 schemas
  - 問題 B：Article property_completeness 顯示 0/0（沒有文章頁被抽樣）
  - 選項 A：讓 eval-worker 改為直接抽樣 /blog（而非 /articles）→ 改 eval-worker/src/index.ts
  - 選項 B：在 /articles/ 直接加 CollectionPage schema（而非 redirect），讓 eval 能抽到
  - 建議先確認 eval-worker 抽樣的 URL 清單再決定

- [ ] 🟡 AI Ready AI Comprehension Q3 精度修正（+2）→ Code / Sonnet (2026-04-21)
  - Q3「content pillars 數量」在 eval 標記為錯誤
  - 確認 llms.txt 目前描述 paulkuo 有幾個 content pillars，和 benchmark_questions.yaml 的答案是否一致
  - 如有不一致：更新 llms.txt 或 benchmark_questions.yaml 答案

## 待 Cowork 執行

- [ ] 🟡 H3：auto-memory 跨視窗不對稱寫入 working-environment.md §1.2 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 能寫 `.auto-memory/`，但 Chat 視窗不掛載這個路徑，R1 護欄在 Chat 穿透率 = 0
  - 動作：在 working-environment.md §1.2「跨視窗能力矩陣」明示「auto-memory 只對 Cowork 生效，Chat 不讀」
  - 歸屬：Cowork 司法，工程上無法單邊解決（Chat 不支援 Cowork sandbox 路徑）

- [ ] 🟡 H4：Cowork 新 session 剛性核查補強 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 新 session 答 v4.13，讀 sandbox C 層 mirror 就信，沒觸發憲法第三條剛性核查去 A 層驗
  - 動作：session-handoff SKILL.md「Cowork 驗證盲區」新增一條——版本號/行數/清單項數類問題即使從 sandbox 讀到答案，仍須跑 A 層 git HEAD 核查
  - 歸屬：Cowork 司法（v5.6 已部分處理 R1 觸發句型擴充，但 H4 需要在開場 checklist 也加強制步驟）

## 待 Chat 立法

- [ ] 🔴 H1：憲法第二條 C 層同步機制缺失 → Chat 立法 (2026-04-20)
  - 問題：C 層（Claude.ai Personal Skill）從 2026-04-17 冷凍在 v4.13，repo 已到 v5.5/v5.6。憲法第二條「C 層永遠是下游 mirror」無配套同步機制
  - 建議產出：新 ADR「A→C Personal Skill 同步協議」——誰按 commit / 同步頻率 / 驗證方式 / C2 雲端記憶不可控時的治理原則
  - Cowork 不處理原因：觸及憲法層級立法，Chat 主責

- [ ] 🔴 H2：Chat 視窗精確事實查詢結構性上限 → Chat 立法 (2026-04-20)
  - 問題：Chat 三模型（Opus 4.7 / Sonnet 4.6 / Opus 4.6）同答 v4.7，比 C 層更舊。版本號/行數/commit hash/清單項數/時序狀態類精確事實在 Chat 系統性不可靠
  - 建議產出：憲法實施細則新增——Chat 不回答此類精確事實問題，應引導用 Cowork 查 A 層或 Code Read 核查
  - Cowork 不處理原因：觸及憲法層級立法，Chat 主責

## 跨專案備忘

> 這個 section 給所有 Cowork 專案共用。
> 不管綁哪個資料夾，開場都應該透過 GitHub MCP 的 `get_file_contents` 讀這個檔案。

- 2026-04-09：Issue #155 新增自動同步機制（sync-dashboard Action），以後更新儀表板改 `worklogs/issue-155-body.md` 即可，push 到 main 會自動 PATCH
- 2026-04-09：Cowork session 一律 Opus 4.6；所有 handoff 必須標注建議模型（跨所有專案）
- 2026-04-09：GitHub MCP 的 `get_issue`/`update_issue` 有 issue_number 型別 bug，暫時不可用。讀 Issue 用 `search_issues`，寫 Issue 用 sync-dashboard Action
- 2026-04-10：專案治理框架 Phase 1+2 完成。Dashboard 在 /governance/（非 /dashboard/，因路由衝突）。API 4 支 endpoint：/api/governance/{summary,projects,metrics/:id,automation}。Auth 用 GOVERNANCE_TOKEN Bearer token
- 2026-04-11：Phase 2 已部署上線。Phase 3 程式碼完成（851dd58），待 Paul 部署。新增 `/api/governance/audit` endpoint + Dashboard 稽核面板

---

## 格式說明

```
待 Code / Cowork 執行：
- [ ] {做什麼} → {給誰} / {建議模型} ({日期})

跨專案備忘：
- {日期}：{決策或狀態變更}
```

---

## Scanner 自動產出（最新在上）

