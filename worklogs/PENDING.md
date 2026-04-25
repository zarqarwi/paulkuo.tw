# worklogs/PENDING.md — 跨 Session 待辦佇列

> 這個檔案是 Code ↔ Cowork 的直接溝通管道。
> Paul 不需要手動傳遞——兩個 session 開場時都應該先掃這個檔案。

## 使用規則

- **Code 寫**：需要 Cowork 接手的事項（狀態同步、文件產出、Issue 更新）
- **Cowork 寫**：需要 Code 執行的事項（deploy、DB migration、腳本跑測試）
- **Chat 寫**：立法裁決結果（Accept/Modify/Reject + 理由 + 後續動作）
- 完成後把該項目刪掉或標記 `[x]`，保持這個檔案乾淨

## 五符號 schema（2026-04-24 採納）

| 符號 | 狀態 | 意義 |
|---|---|---|
| `[ ]` | pending | 待處理（任何視窗皆可接手） |
| `[~]` | in-progress | 進行中（有視窗在做，勿搶） |
| `[>]` | delegated | 已裁決授權，等下游視窗執行（例：Chat Accept → 等 Cowork/Code 執行） |
| `[x]` | done | 完成結案（重大里程碑可加 ✅） |
| `[-]` | rejected | 明確拒絕（保留紀錄，避免重提） |

每項格式：`- [符號] {做什麼} → {給誰} ({日期})`

---

## 待 Code 執行

- [x] ✅ **Skill commit 分離偵查與收尾** → 已完成（2026-04-24，force-push `fix/acp-graphql-observability` 裁到 `9310c80`，兩分支驗收通過）

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

- [x] ✅ Git 偵查事件衍生的治理待辦（A+B 兩項）→ 已完成（2026-04-24 Cowork session）
  - working-environment.md rev2.3：新增 §5「操作 SOP」整章（§5.1 多邊偵查切換閾值 + §5.2 Git SSoT 規則），原 §5/§6/§7/§8 順延為 §6/§7/§8/§9
  - constitution-v0.2-quick-reference.md rev2：新增情境 8（force-with-lease 被擋）+ 情境 9（偵查剪貼超兩輪）+ 違憲自檢清單第 7、8 項
  - F5 行數表更新：速記卡 238 行已越軟上限，下次編修前評估抽離情境案例
  - 待 Code：在下次 Code session commit + push 兩份 governance 文件（屬 Cowork 白名單路徑 `docs/governance/`，也可由 Paul 直接 commit）

- [ ] 🟡 H3：auto-memory 跨視窗不對稱寫入 working-environment.md §1.2 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 能寫 `.auto-memory/`，但 Chat 視窗不掛載這個路徑，R1 護欄在 Chat 穿透率 = 0
  - 動作：在 working-environment.md §1.2「跨視窗能力矩陣」明示「auto-memory 只對 Cowork 生效，Chat 不讀」
  - 歸屬：Cowork 司法，工程上無法單邊解決（Chat 不支援 Cowork sandbox 路徑）

- [ ] 🟡 H4：Cowork 新 session 剛性核查補強 → Cowork 司法 (2026-04-20)
  - 問題：Cowork 新 session 答 v4.13，讀 sandbox C 層 mirror 就信，沒觸發憲法第三條剛性核查去 A 層驗
  - 動作：session-handoff SKILL.md「Cowork 驗證盲區」新增一條——版本號/行數/清單項數類問題即使從 sandbox 讀到答案，仍須跑 A 層 git HEAD 核查
  - 歸屬：Cowork 司法（v5.6 已部分處理 R1 觸發句型擴充，但 H4 需要在開場 checklist 也加強制步驟）

## 待 Chat 立法

- [>] 🔴 H1：cloud 層同步機制缺失 → 已授權 Cowork 起草 ADR（2026-04-24）
  - 原議題：
    - 問題：C 層（Claude.ai Personal Skill）從 2026-04-17 冷凍在 v4.13，repo 已到 v5.5/v5.6。憲法第二條「C 層永遠是下游 mirror」無配套同步機制
    - 建議產出：新 ADR「A→C Personal Skill 同步協議」——誰按 commit / 同步頻率 / 驗證方式 / C2 雲端記憶不可控時的治理原則
    - Cowork 不處理原因：觸及憲法層級立法，Chat 主責
  - **裁決：Accept with specs（2026-04-24 Chat-Opus-4.7）**
  - 理由：憲法第二條若無配套同步機制實質為死條文；目前靠人提醒是人治非法治；與 H2 事實觸達困難共享前提，需同步立法
  - 後續動作：待 Cowork 起草 `adr-cloud-sync-protocol-2026-04-XX.md`
    - 第一條 · 同步協議責任鏈：Code commit → Cowork 開場檢查（git log -20 + 比對 c-layer-snapshot）→ 通知 Paul → Paul 手動更新 cloud → Paul 回報 → Cowork 更新 snapshot
    - 第二條 · 同步頻率：minor 累積 2 版觸發、major 立即、patch 不觸發
    - 第三條 · 驗證方式：版本號比對 + 關鍵條款（護欄清單/四動機/三錨點）spot check，不採 verbatim diff
    - 第四條 · Chat 側止血：讀到 snapshot 落後 ≥ 2 minor 時必須主動提示 Paul「本次裁決/討論可能受影響」
    - 第五條 · 與 H2 口徑統一：cloud 層「版本回答規則」必須引用 H2 ADR 編號雙向綁定，避免邏輯衝突

- [>] 🔴 H2：Chat 精確事實查詢結構性上限（含 A3 併入） → 已授權 Cowork 起草 ADR（2026-04-24）
  - 原議題：
    - 問題：Chat 三模型（Opus 4.7 / Sonnet 4.6 / Opus 4.6）同答 v4.7，比 C 層更舊。版本號/行數/commit hash/清單項數/時序狀態類精確事實在 Chat 系統性不可靠
    - 建議產出：憲法實施細則新增——Chat 不回答此類精確事實問題，應引導用 Cowork 查 A 層或 Code Read 核查
    - **2026-04-24 補充佐證（Cowork 發現）**：Chat 在 `cowork--governance-architecture-review-2026-04-24.md` 的「來源事實（F-ID）」section 引用 SKILL.md 639 行 / 速記卡 238 行 / 憲法 299 行等精確數字——但這些都是從 Cowork artifact 拷貝來的二手資訊，Chat 無法直接 Read 檔案核實。**Chat 在討論治理時，會不自覺地把二手數字當一手事實引用**，此現象本身應寫進 H2 的 ADR 當結構佐證
    - **A3 併入**：Chat 原建議「開場貼 skill 摘要」違反「被動文件不等於主動防線」原則（依賴 Paul 每次手動貼，且 Chat 長對話仍會 context drift）。短期替代方案改為「Chat 收到治理類問題時，reflexively 先說『我的 skill 可能過時，請用 Cowork/Code 核實』」——此即 H2 立法本體
    - Cowork 不處理原因：觸及憲法層級立法，Chat 主責
  - **裁決：Accept with specs（2026-04-24 Chat-Opus-4.7）**
  - 理由：Chat 無 Read 工具為結構事實，需立法化；治理考試 77% 水位若不立法會永遠停留；A3 因違反「被動文件不等於主動防線」併入本條
  - 後續動作：待 Cowork 起草 `adr-chat-factual-query-limit-2026-04-XX.md`，三處同步寫入（WE §X + 速記卡情境 10 + SKILL.md 段落）
    - 第一條 · 觸發句型白名單：版本號、行數、commit hash、清單項數、時序狀態、檔案存在性（共 6 類，Chat 遇到必拒答並引導）
    - 第二條 · 例外清單：憲法五條條文本身、對話內已出現事實、公開穩定外部事實、原則非可變量
    - 第三條 · 標準回應模板：「此問題涉及 A 層精確事實，Chat 結構性不可靠（依 ADR §一）。建議 Cowork wc -l / Code Read / GitHub MCP 繞道（有 ~20KB 截斷風險）」
    - 第四條 · 裁決層級特殊規則：結構性立法優先（立規則不立具體數字）；必須引用時標註「二手待核實」；絕不拿 Cowork artifact 當源頭
    - 第五條 · GitHub MCP 地位：繞道非原生能力；明確承認；大檔警告 user；不取代 H1 cloud 同步機制

- [ ] 🔴 H5：長度邊緣文件拆分計畫（Modified） → Chat 立法完成，執行層待 Cowork（2026-04-24）
  - 原議題：
    - 問題：三份治理文件同時在長度邊緣——速記卡 rev2 已超軟上限（238/200，119%）、session-handoff SKILL.md 639/800（77%）、CLAUDE.md 200/200（卡軟上限）。WE §4 定義了 200/800/900 三層閾值，但「超軟上限自動開 ADR」規則尚未正式立法
    - 建議產出：
      1. 新建 `docs/governance/length-budget-status.md`（列當前行數 + 軟/硬上限 + 距離百分比）
      2. 憲法實施細則新增「超過軟上限 X% 自動開拆分 ADR」觸發規則（X 由 Chat 決定，候選 10%/15%/20%）
      3. 對三份文件各產出拆分方案草稿（SKILL.md 結構重組、速記卡情境分類拆檔、CLAUDE.md 強制走子文件）
    - 來源：`cowork--governance-architecture-review-2026-04-24.md` A1
    - Cowork 不處理原因：觸發規則設計屬立法層級，Chat 主責；Cowork 可在 Chat 裁決後協助起草拆分方案草稿
  - **裁決：Modify（2026-04-24 Chat-Opus-4.7）**
  - 修改條目：
    1. 規則層（Chat 立即立法）：三段式觸發線
       - Soft limit 200 行（既有定義保留）
       - 拆分 ADR 自動觸發線 = 軟上限 × 1.15 = 230 行
       - 硬上限前 20% 警戒線：SKILL.md 640 行、CLAUDE.md 720 行
       - 觸硬上限：凍結該文件寫入，所有新規則走子文件
    2. 觸發後誰開 ADR：≥ 230 行 Cowork 兩週內；觸警戒線 Cowork 一週內並 handoff Chat；觸硬上限立即凍結
    3. 建立 `docs/governance/length-budget-status.md`，pre-commit hook 自動更新；狀態符號：✅ 🟡 🔶 🔴 ⛔
    4. 執行層（Delegate Cowork）：下次開場執行 `wc -l` 核實三份文件當前行數，依規則自動判斷是否起草各文件的拆分 ADR
    5. **明確禁止**：Cowork 不可直接採用本 handoff/原議題記載的 238/639/200 二手數字起草 ADR，必須核實後使用當下真實行數
  - 規則層後續：Cowork 寫入 WE §4（長度閾值條款）
  - 執行層後續：Cowork 下次開場按規則自動判斷處置

- [x] ✅ H6：A/B/C 命名衝突消歧 → 已解決（2026-04-24 β 方案採納）
  - 問題：paulkuo 體系內「A/B/C」有兩套意義並存（憲法三視窗映射 vs skill 儲存位置）
  - 解決：Paul 拍板 β 方案 — skill 儲存層改用描述性命名 `repo 層 / cache 層 / cloud 層`，A/B/C 保留給三視窗（憲法第二條不動）
  - 執行結果：
    - ADR 已歸檔：`docs/governance/adr-naming-conflict-resolution-2026-04-24.md`
    - 源頭檔案已改：`reference_skill_storage_layers.md` + MEMORY.md 索引
    - grep 驗收：0 生效文件殘留（8 處殘留全是 ADR/PENDING/memory 的合法歷史引用段落）
    - 治理架構 artifact 已同步更新
  - 影響範圍：衝突源頭僅 1 個 memory 檔，其他 40 個檔案（憲法、WE、速記卡、CLAUDE.md、SKILL.md 等）**無需改動**

- [>] 🟡 H7：governance-lint.sh 他律防線 → 已授權 Cowork 起草 ADR（2026-04-24）
  - 原議題：
    - 問題：目前違憲救濟只有自律（速記卡自檢清單 8 項），缺他律（機器檢查）。配合 `project_guardrail_structural_hole.md` 記載的「對話瞬時判斷無書面痕跡」盲點，純自律在 N=1 時已失靈
    - 建議產出：
      1. 盤點憲法五條 + WE §1-§9 中「可機器化檢查」的條款（Handoff ADR Status/Consequences 欄位必填、F-ID 格式、skill frontmatter pillar 白名單等）
      2. 產出 `scripts/governance-lint.sh`，整合成 pre-commit hook
      3. 新增到 `install-hooks.sh`
      4. WE §3 補註「檢查由 governance-lint.sh 強制」
    - 需 Chat 決策：攔截策略——直接擋 commit 還是只警告？
    - 來源：`cowork--governance-architecture-review-2026-04-24.md` A4
  - **裁決：Accept with specs（2026-04-24 Chat-Opus-4.7）**
  - 理由：N=1 自律盲點已成既成事實（SB 253 教訓），他律必要；但須跟 H2 錯開避免重工
  - 後續動作：待 Cowork 起草 `adr-governance-lint-he-lu-2026-04-XX.md`，Code 分 Phase 實作腳本
    - 第一條 · 檢查 5 項:Handoff ADR 欄位完整性、F-ID 格式（F-{kebab}-{YYYY-MM-DD}）、skill pillar 白名單（ai|circular|faith|startup|life）、PENDING.md 五符號系統、length-budget-status.md 時效
    - 明確排除：源頭事實跨載體一致性（需語義理解，機器做不到，硬做會產大量 false positive）
    - 第二條 · 攔截策略（兩級制）：Strict 擋 commit（結構性錯誤：Handoff 欄位缺、pillar 違反、五符號違反）；Warning 允許但警告（時效性問題：length-budget 過期、F-ID 非致命格式錯）
    - 第三條 · 掛載點：pre-commit hook 主要 + CI 次要（防 --no-verify 溜上 GitHub），不掛 commit-msg（避免與既有 hook 干擾）
    - 第四條 · 跳過機制：Paul 可 --no-verify 跳過，但下次 commit message 須標 [skip-lint-recovery] 並在 worklog 寫明跳過原因 + 補救
    - 第五條 · 實作 Phase：P0 Handoff 欄位+pillar / P1 F-ID+五符號 / P2 length-budget（待 H5 規則落地）
    - 第六條 · 與 H2 邊界明文：H2 prompt-time（Chat 對話行為）vs H7 commit-time（檔案結構），兩者互補無重疊

- [>] 🟡 H8：Worklog 加第四維度 abandoned → 已授權 Cowork 起草 ADR（2026-04-24）
  - 原議題：
    - 問題：現行 worklog 三維度（做了什麼 / 決策 / 踩坑）缺「放棄了什麼 + 為什麼放棄」，導致被否決的方案無紀錄，容易重複提案
    - 建議產出：
      1. 修改 `docs/governance/worklog-format.md` 改為四維度（sub-sub-item 加 abandoned）
      2. 更新 session-handoff SKILL.md 中 Worklog 說明段落
      3. 更新速記卡 rev2 如有提到 worklog 的情境
      4. CLAUDE.md「Worklog 自動記錄」段落同步
    - 來源：`cowork--governance-architecture-review-2026-04-24.md` A5
  - **裁決：Accept（2026-04-24 Chat-Opus-4.7）**
  - 理由：最便宜的改動最穩定的收益；避免重複提案 + 保留決策脈絡斷裂
  - 後續動作：待 Cowork 起草 `adr-worklog-abandoned-dimension-2026-04-XX.md`
    - 第一條 · 四維度：done / decisions / pitfalls / abandoned，皆必填（無則寫「無」）
    - 第二條 · abandoned 範圍界定：納入本 session 放棄 + 跨 session Reject + 改優先級延後；排除閒聊未認真評估 + 已在 decisions 的反面選項
    - 第三條 · 強制性：強制寫「無」（區分「忘寫」vs「確實沒有」，為未來語義檢索精度）；短 session 可用縮寫格式
    - 第四條 · 格式範本寫進 `docs/governance/worklog-format.md`（SSoT）；同步引用位置：session-handoff SKILL.md、速記卡 rev2、CLAUDE.md 若有 worklog 段落
    - 第五條 · 與 H7 綁定：worklog 四維度檢查作為 H7 Phase 2 增量項目（Warning 級，不擋 commit）

- [>] 🟢 H9：L3 操作 SOP 定位釐清 → 已授權 Cowork 起草 ADR（2026-04-24）
  - 原議題：
    - 問題：治理架構圖 L2 WE 與 L3 操作 SOP 內容重疊（WE §5 本身就是「操作 SOP」章節），歸屬模糊
    - 建議產出：`adr-layer-3-positioning-2026-04-XX.md`，含三選項利弊分析：
      - 選項 A：L3 併回 L2，五層治理架構改四層
      - 選項 B：L2 拆成「原則篇」+「操作篇」兩份文件
      - 選項 C：維持現狀，明確定義 L2/L3 寫作規則（L3 只收「跨三窗的操作流程」）
    - 來源：`cowork--governance-architecture-review-2026-04-24.md` A6
  - **裁決：Accept · 選項 C（2026-04-24 Chat-Opus-4.7）**
  - 理由：選項 A 合併會讓 L2 踩 H5 新立 230 行觸發線（立法矛盾）；選項 B 拆分重構成本遠大於痛點；選項 C 治標但成本最低
  - 後續動作：待 Cowork 起草 `adr-l3-positioning-2026-04-XX.md`
    - 第一條 · L2/L3 定位差異表：L2 寫「為什麼 + 原則性怎麼做」（WE §1-§4、§6-§9）；L3 寫「跨三窗協作的具體步驟流程」（WE §5）
    - 第二條 · 寫作判斷規則（三題測試）：(1)涉及 Chat/Cowork/Code 交接？ (2)是可執行步驟流程？ (3)離開這條下游會壞？ 三是 → L3；三否 → L2；混合 → 預設 L2（寬進嚴出）
    - 第三條 · 架構圖呈現調整：明確標註「L3 是 L2 功能子集（§5），不是獨立檔案」，避免未來讀者誤以為 L3 是獨立文件
    - 第四條 · 重新評估觸發條件：WE 超 H5 軟上限（230 行）/ 出現第三條跨三窗協作 SOP / 新 SOP 與 §5 衝突
  - 主要修改位置：`docs/governance/working-environment.md` 開頭新增「L2/L3 寫作規則」段落

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

## 觀察期項目（2026-04-25 起，2026-06-25 盤點）

以下項目來自 2026-04-25 治理研究 v2.0 / v2.1 兩份報告，經 Paul 裁決擱置兩個月，
不預先立規則，兩個月後用實證決定是否動作。狀態統一為 `[-]`（暫緩）。

> Tag 註記（2026-04-26 重審）：`platform-wait` = 依賴 Anthropic 平台原生 feature 出現後再評估，自搭恐踩 `feedback_avoid_reinventing_solved_problems`；`self-govern` = paulkuo.tw 內部治理流程議題，不會因平台進化自動消失，6/25 盤點主軸。

- [-] v2.0 疏漏 1 · 修憲→handbook 變更 framing 切換 · tag:self-govern
- [-] v2.0 疏漏 3 · auto-memory 升格 ADR 觸發規則 · tag:self-govern
- [-] v2.0 疏漏 4 · cloud 層 snapshot 維護者明文化 · tag:platform-wait
- [-] v2.0 疏漏 5 · H13 handoff 格式（含時間 budget metadata） · tag:self-govern
- [-] v2.0 疏漏 6 · 月度 ADR 產出上限規則 · tag:self-govern
- [-] v2.0 疏漏 7 · Paul 在治理體系的明文位置 · tag:self-govern
- [-] Branch protection PR 閘門啟用（待 2026-06-25 用實例重議） · tag:self-govern

### 明確排除（不進觀察期）

- v2.0 疏漏 2「跨 session 衝突解決」**不進觀察期**
  - 理由 1：與 Code feedback D4「多 session race condition」是同議題不同切面（疏漏 2 切治理流程，D4 切工程面 race condition）
  - 理由 2：v2.0 提的解法（GitLab MR review、ADR 預設 Proposed）已被 v2.1 §1 質疑為「另一種修辭移植」，2026-06-25 前不重啟此 framing 爭論
  - 理由 3：v2.0 列的解法工程面已部分運作——憲法 v0.2 預設 Proposed 概念、v5.1 D 軌 verifier 二次審查（worklogs/code--v5-1-D-cross-cowork-retro-2026-04-18.md）、working-environment.md §1 起草／裁決分離、branch protection force-push 防護
  - 6/25 盤點時若 D4 議題有實例，與此項合併重議

#### 2026-04-25 (c) ADR 階段裁決排除（不立法、不進觀察期）

以下四條候選經 Cowork (c) 階段三維度評分後 Reject。完整裁決見 `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md` §2。

- **C1 · Chat 自我糾正流程的觸發條件與邊界** — Reject
  - 理由：v2.1 §1 已質疑為「另一種修辭遷移」；立 ADR 等於用 ADR 把修辭制度化
  - 緩解：靠憲法第三條剛性核查 + H7 lint + retro 累積 auto-memory，無需專屬 ADR
  - 綁定 memory：`feedback_reject_symptomatic_workflow_suggestions`

- **C2 · 多視角挑戰機制 + v2.2 缺軌補正規則** — Reject
  - 理由：流程儀式制度化過度；frontmatter 自填欄位剛性核查近乎為零
  - 緩解：Q2 Code handoff 限定 D1-D4 落地檢查（不再做 framing），個案紀律處理
  - 綁定：本批次 Q2 Code handoff（`handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md`）

- **C4 · 事實基礎報告 vs 修辭遷移的判別準則** — Reject
  - 理由：屬定義戰無解題；制度化「Chat 主觀判斷」是無解題
  - 緩解：靠 retro 案例累積成 auto-memory，已有 `feedback_avoid_reinventing_solved_problems`、`feedback_chat_secondhand_citation_blind_spot` 在處理

- **C5b · Chat 模擬 X-session 視角的合法性判別準則** — Reject
  - 理由：與 C2 同源（流程儀式制度化）；本批次 Code feedback 自承「Chat 於 Code 視角模擬」+ 標 Status: Feedback 即為揭露緩解
  - 緩解：個案紀律 + 揭露機制，無需通用規則

### 觀察期項目（2026-04-25 起，2026-06-25 盤點）· 補

8. **跨 session 紀律遷移落差**
   - 觀察事件：Chat 跟 Paul 在對話中達成的紀律共識（如「方向性判斷由 Paul」「起草/裁決分離」），是否會自動遷移到 Cowork/Code session
   - 已知事件（2026-04-25）：
     - Cowork 在前一輪自行越權產出 (c) 階段 handoff 設計流程
     - Cowork 一條龍跑完 Step 1+2，原本 handoff 寫 Step 1 應由 Chat 主導
     - Cowork 起草 H11 給 Cowork 自己鬆綁的規則（self-serving 風險）
   - 預期：兩個月內這類事件 ≤ 1 次
   - 觸發行動：若超過，考慮立 ADR / 改 handoff 模板 / 加其他剛性核查機制
   - **本項目不立法、只觀察**

9. **H7 lint 護欄實效 + grandfather 引用情況**
   - 觀察事件 1：H7 governance-lint.sh Phase 1 通過後（commit `24d7a03`），pre-commit hook 是否真實攔截到違規 commit
   - 觀察事件 2：`.governance-lint-grandfathered` 清單內的 95 份歷史 handoffs 是否還被當前 worklog/ADR 引用
   - 觀察事件 3：Cowork 寫新 handoff 是否一次到位含 frontmatter `status` + `## Consequences`（依 cleanup-pass-2 立的紀律）
   - 預期：
     - 攔截觸發 ≥ 1 次（代表護欄真有用，否則設計需重審）
     - 95 份歷史 grandfathered 引用率 ≤ 5 份（多數應是「已死檔案」，可永久 grandfather）
     - Cowork 新 handoff 100% 合規（依 memory `feedback_cowork_handoff_template_h7_compliance`）
   - 觸發行動：
     - 若護欄 0 觸發 → 評估規則設計是否過嚴或實際需求低
     - 若 grandfathered 仍頻繁被引用 → 該批次需補規範而非永久 grandfather
     - 若 Cowork 新 handoff 違規 → 模板紀律失效，考慮 lint Phase 2 自動檢查
   - **本項目不立法、只觀察**

10. **iCloud 衝突副本清理**
    - 觀察事件：handoffs/ 下 4 份檔名含「 [0-9].md」尾綴的衝突副本（依 memory `feedback_icloud_duplicate_files_not_git_issue`）
    - 已 grandfather 進 lint 跳過清單，但屬技術債
    - 觸發行動：等 Paul 評估原檔（不含尾綴版本）內容是否需保留 → Code session 處理刪除（憲法第二條）
    - **本項目不立法、只觀察 + 待 Paul 排程清理**

### 觀察指標（2026-06-25 盤點）

1. 這兩個月新增幾份 ADR（預期 ≤ 2 份）
   - **2026-04-25 已用 2 份**：H10（治理研究報告 git 紀律）+ H11（立法零產量合法收尾），皆 status: Proposed，等下一輪 Chat 裁決
   - 配額已滿，6/25 前不再起草新 ADR（除緊急例外）
2. 幾份 ADR 真的被後續 session 引用（預期 ≥ 50%）
3. Chat 還會不會主動發類似 v3.0 的 meta-report（預期：不會）

兩個月後 Paul 重讀 v2.0 / v2.1 兩份報告，用實際數據決定
哪些觀察項目要升級為 ADR，哪些直接永久擱置。

---

## Scanner 自動產出（最新在上）

