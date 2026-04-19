# ADR: paulkuo.tw 協作憲法 v0.2

**Status**: Accepted
**Date**: 2026-04-19
**Deciders**: Paul（憲法主體）、Cowork session claude-opus-4-7（草擬顧問）
**Supersedes**: 無（首版正式憲法）
**Related**:
- `handoffs/cowork--skill-sync-long-term-plan-briefing-2026-04-19.md`（觸發 meta 討論的 briefing v2）
- `docs/skill-storage-inventory-2026-04-19.md`（階段 1 偵察報告）
- `docs/governance/working-environment.md`（既有工作環境規範，將於 v0.3 逐步統整）
- `.auto-memory/MEMORY.md`（16 條記憶，含護欄 C1-C5 與 #8-#11）

---

## 1. Context

### 1.1 為什麼需要「憲法」而不是再加一條護欄

過去一年累積的治理文件已經很多：`CLAUDE.md`、各 `SKILL.md`、`docs/governance/working-environment.md`、`worklogs/`、`handoffs/`、Issue #155 儀表板、`.auto-memory/`。這些是**散落的規範**，沒有一個上層 framing 說明各規範怎麼配合、誰讀誰寫、版本衝突時怎麼裁定。

2026-04-19 處理 briefing v2「skill 四層分裂長期規劃」時，一次撞到三條獨立戰線同時出問題：

1. **Skill 四層分裂**：`session-handoff` 在 A/B/C 層版本 v5.3 / v5.3 / v4.13 分岔；其他 4 個 Personal skills（paulkuo-writing、paulkuo-social、formosa-feedback、organize-downloads）只住 C 層，沒有任何 git 副本
2. **空中樓閣第 N 次**：Code 單一來源聲稱 cp 成功 → worklog → PENDING.md → briefing v2 → Cowork 接手，整條傳遞鏈沒獨立驗證點
3. **記憶層次重疊與漏接**：auto-memory、CLAUDE.md、Issue #155、Chat memory、worklog、PENDING 之間沒有明文邊界，有重覆存、有單點漏接

三件事同時出問題代表：**治理需要的不是再加一條護欄，而是把散落規範升級到憲法層次**——一個能統管 SSoT、記憶、角色分工的 meta 設計。Paul 在對話中把這個 meta framing 命名為「協作憲法」（Collaboration Constitution）——比「治理框架」更精確，因為它同時涵蓋身份與權限、資訊流動規則、異議處理機制三件事，結構上與真實憲法同構。

### 1.2 Anthropic 官方與市場生態（2026-04 調研結果）

本次在落憲法前先做了官方與業界調研，三條決定性事實：

**A. Anthropic 官方明確不 roadmap「skill 跨載體同步」**

官方 API Docs（`platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`）直接寫：

> Custom Skills do not sync across surfaces. Skills uploaded to Claude.ai must be separately uploaded to the API, and skills uploaded via the API are not available on Claude.ai... You'll need to manage and upload Skills separately for each surface where you want to use them.

並另外註明 Claude.ai 的 Team/Enterprise 方案「**does not currently support centralized admin management or org-wide distribution of custom Skills**」——連付費方案都沒解決。

**B. 業界 2026 年已收斂在 Git-first + 本機 CLI pull**

社群生態（`github.com/runkids/skillshare`、`github.com/AJBcoding/claude-sync`、`dot-claude-sync` 等）已至少三款成熟 GitOps 同步工具。Medium 有長文 `How We Sync Custom AI Skills Across 100+ Repos` 談業界實踐。**所有工具方向一致**——git 是 SSoT，CLI/hook 拉到本機 `~/.claude/skills/`。沒有任何工具能推到 Claude.ai 雲端，因為 Anthropic 不開 API。

**C. Anthropic blessed 的跨 repo 分發路徑是 Claude Code plugin marketplace**

官方文件明確：

> Claude Code: Personal (`~/.claude/skills/`) or project-based (`.claude/skills/`); can also be shared via Claude Code Plugins.

Plugin marketplace 是 2026 唯一官方認可的「一處發布、多處安裝」機制。

**對憲法設計的結構性啟示**：

- `git repo 必然是 SSoT` 不是設計選擇，是**市場與官方雙重 blessed 的唯一路**
- `Claude.ai 雲端永遠是人工同步的下游 mirror`——到 Anthropic 開 API 前不會變
- 記憶系統（Chat memory）也是分立的——Anthropic 自動維護、不可程式化控制

### 1.3 既有工作方式盤點（四視窗 × 多層記憶）

本輪對話前 Paul 已經在多視窗（Chat / Claude Code / Cowork / Claude.ai Web UI）與多層記憶（auto-memory / CLAUDE.md / Issue #155 / PENDING / worklog / handoff / Chat memory）之間建立了隱性分工。憲法要做的不是重造，而是**把實踐明文化、補結構破口**。

---

## 2. Decision — 協作憲法 v0.2

### 第一條（SSoT 原則）

> **paulkuo.tw repo 的 git HEAD 是所有規則、skill、治理文件、記憶、佇列的唯一事實來源。任何載體讀到的版本如果低於 HEAD，視為失效，必須先 pull。**

**實施細則**：

- 寫入後必驗證（現有護欄 #15「MCP 寫後驗證」升格為第一條的必然推論，不再是散落護欄）
- Cowork / Chat session 開場時先 `git log --oneline -5` 確認在最新 HEAD；如本機落後 origin，先 `git pull`
- Code session 由 Claude Code CLI 的 filesystem-based 機制自動管理，無需額外動作
- Claude.ai Web UI 不在主幹，不適用本條

### 第二條（載體對等原則）

> **Claude.ai 雲端（C 層）永遠是下游 mirror，不進協作主幹。Chat memory、Claude.ai Personal skill 的同步節奏由人工控制，接受非即時性。**

**實施細則**：

- C 層獨點 skill（paulkuo-writing、paulkuo-social、formosa-feedback、organize-downloads）必須 export 到 A 層（paulkuo.tw repo 的 `.claude/skills/`）才合憲
- A → C 同步為人工作業，列入 CLAUDE.md 工程慣例：每次 SKILL.md 變更 commit 後，提醒 Paul 到 Claude Desktop App → Customize → Skills 手動更新
- Chat memory 接受存在但不依賴（詳見第四條）

### 第三條（權責分工原則）

> **主責分工為解釋原則，允許適度遊走；跨權輸出的核查義務為剛性。**

**主責（彈性）**：

| 視窗 | 主責 | 典型產出 |
|---|---|---|
| **Chat** | 立法 | `docs/governance/` 文件、ADR、憲法本身、meta 規劃、briefing 草擬 |
| **Claude Code CLI** | 行政 | 改 code、跑 test、deploy、修 bug |
| **Cowork** | 司法 / 協調 | 消化 handoff、更新 Issue #155、裁定跨 session 狀態、worklog 收尾 |
| **Claude.ai Web** | 只讀 mirror | 輕量查詢，不在協作主幹 |

**核查義務（剛性，不可退讓）**：

- **司法對行政**：Cowork 接收 Code 產出時，必須有獨立來源查證（git log、grep、file stat、PRAGMA、curl 等），**不信行政自述**。例：Code 在 worklog 寫「cp 同步完成」，Cowork 必須用獨立指令驗 mtime / diff，不能直接轉發到 Issue #155
- **行政對立法**：Code 接收 Chat handoff 時，必須先驗環境前提（cd、絕對路徑、依賴），才開始執行。例：Chat 的 handoff 必須含完整路徑（feedback memory #3）

**越界處理**：順手小動作可（例：Cowork 發現 typo 順手修一個字），但如果成為常態，應在 worklog 記錄並回歸主責 session。

### 第四條（記憶層次原則）

> **記憶採用「分層明確 + 職能分隸」模型。每層責任邊界寫入該層檔案頭部。任何事實只在主責層存一份。**

| 層 | 路徑 / 位置 | 職能 | 寫入者 |
|---|---|---|---|
| Auto-memory | `.auto-memory/MEMORY.md` | user profile、穩定事實、偏好 | Claude session 自動 |
| 專案指令 | `CLAUDE.md`（含子目錄） | 工程慣例、部署規則、陷阱 | Paul / Code |
| 狀態儀表板 | GitHub Issue #155 | 進行中專案狀態 SSoT | Cowork（主要） |
| 跨 session 佇列 | `worklogs/PENDING.md` | 未完成任務的交接 | Code / Cowork |
| 事件歷史 | `worklogs/worklog-{date}.md` | 三維度歷史（做了什麼 / 決策 / 阻礙） | Code / Cowork |
| 一次性交接 | `handoffs/*.md` | session-to-session briefing | 當前 session 任一者 |
| Claude.ai Chat memory | Anthropic 雲端 | 冗餘、不依賴但不關閉 | 不可控 |

**規則**：

- 任何事實只在主責層存一份
- 跨層引用允許（例：worklog 提到 Issue #155 用 hyperlink）
- **跨層複製禁止**（例：user profile 不可同時寫在 auto-memory 和 CLAUDE.md）
- **補款（同層文件內部原子化）**：同一記憶層文件內，如有多區塊表達同一事實的不同視角（例：worklog 的「狀態變更」vs「待辦快照」），寫入時必須原子化傳遞，禁止單區塊更新。建議用 commit-msg hook 或 lint script 檢查

### 第五條（記憶擴充原則）

> **記憶層次允許加入新載體——外掛記憶引擎（Mem0、Letta、Graphiti）、MCP memory server、自建 KV——但需走 ADR 流程。**

**流程**：

1. **實驗期**：產物暫存 `docs/governance/memory-experiments/{tool-name}-{date}.md`，不進憲法主幹，不納入第四條
2. **正式採用**：走 ADR 流程，通過後納入第四條並賦予邊界定義、寫入職能分隸表
3. **汰除**：已納入的外掛如失敗或停用，走 ADR 除名，檔案移到 `docs/governance/memory-archive/`

---

## 3. Consequences

### 3.1 益處

**A. Skill 四層裁定立刻清楚**：C 層 4 個獨點 skill 按第一、二條「違憲」——migration path 不再是開放問題，而是**執行憲法**。這直接化解 briefing v2 Q4 的決策模糊。

**B. 空中樓閣防止升級為結構義務**：第三條核查義務剛性條款把「Cowork 獨立驗證」從散落的 C4 邊界護欄提升為憲法義務。未來 Cowork 接手時有憲法依據可拒絕信任行政自述。

**C. 記憶統整有邊界**：第四條明文化「一事實一主責層」，曝露 auto-memory 和 CLAUDE.md 潛在重覆，為未來 refactor 提供判斷依據。

**D. 外掛記憶開放但有門檻**：第五條讓 Paul 可以實驗新記憶技術（Mem0、Letta），不用為此改憲法主幹，但正式採用前會被 ADR 門檻過濾，避免盲目引入。

**E. 護欄重新整合**：既有散落護欄（C1-C5 paulkuo.tw 特化、#8-#11 業界通用、#12-#15）可以在憲法骨架下重新分類為「第 X 條實施細則」，不再互相孤立。

### 3.2 代價

**A. v0.2 不解決 briefing v2 Q1-Q4 的具體執行問題**：session-handoff 兩棵樹（A/B v5.3 特化線 vs C v4.13 通用線）怎麼合？C 層 4 個 skill 具體 export schema？這些留到 v0.3 ADR 個別處理。

**B. 第三條核查義務剛性**可能增加 Cowork 開場驗證成本（每次接 Code 產出都要驗）。折衷方案：常態性高頻核查項目寫成 script 自動化（例：`scripts/cowork-openpage-verify.sh`）。

**C. 記憶邊界強制化**可能需要 refactor 現有 PENDING.md / auto-memory 的重疊內容。不急，可在 v0.3 之後逐步遷移。

### 3.3 遷移步驟

| # | 動作 | 責任 session | 時程 |
|---|---|---|---|
| 1 | 本 ADR commit 進 git | Cowork（本輪階段 3） | 今日 |
| 2 | Issue #155 加一條完成日誌指向本 ADR | Cowork（本輪階段 3） | 今日 |
| 3 | `CLAUDE.md` 加指向本 ADR 的引用區段 | Code 或 Cowork | 下一輪 |
| 4 | 各記憶層檔案頭部加 `# 本檔職能邊界` 區塊 | Code | 下一輪 |
| 5 | C 層 4 個獨點 skill export 到 A 層（individual ADR）| Code + Paul | v0.3 排程 |
| 6 | session-handoff 兩棵樹合併策略（briefing v2 Q1-Q3）| Chat → ADR → Code | v0.3 排程 |
| 7 | `commit-msg` hook 加 worklog 內部一致性檢查 | Code | v0.3 排程 |
| 8 | `docs/governance/working-environment.md` 統整進憲法系列 | Chat → ADR | v0.3 排程 |

---

## 4. 痛點回測（驗證憲法覆蓋度）

### 痛點 1：Skill 四層分裂

**場景**：4 個 Personal skills 只住 C 層，無 git 副本。

**憲法裁定**：第一條 + 第二條 → 違憲。必須 migrate 到 A 層。

**益處**：化解決策模糊，「要不要 export」變成「怎麼 export」。

**破口**：憲法沒給 migration schema 細節。這是**實施缺口**（v0.3 填），不是憲法破口。

### 痛點 2：空中樓閣第 N 次

**場景**：Code 單一來源聲稱 → 整條傳遞鏈無獨立驗證點。

**憲法裁定**：第三條核查義務剛性 → Cowork 必須獨立驗。

**益處**：把散落護欄升格為結構義務。

**v0.2 修正點**：第三條原本寫「不鎖硬邊界」太寬鬆，必須把「核查義務」從主責分工抽出來獨立剛性化。這是本輪對話最大發現。

### 痛點 3：worklog 內部矛盾

**場景**：同一份 worklog 的「狀態變更」區塊寫「完成」，「待辦快照」區塊寫「未完成」。

**憲法裁定**：第四條補款 → 同層文件內跨區塊表達同事實的寫入必須原子化。

**益處**：過去這類矛盾只能靠人工發現；憲法給了工具層支點（commit hook / lint script 可以依此檢查）。

**v0.2 補款**：第四條原本只管跨層，沒管同層內。這是第二大發現。

---

## 5. Alternatives Considered

### Alt-A：繼續修修補補現有護欄（拒絕）

**論點**：每發現一個新痛點加一條護欄（C6、#16、#17...），不做 meta 整合。

**為什麼拒絕**：
- 護欄增加 → 認知負擔增加 → 新 session 難以完整讀懂
- 護欄之間潛在衝突無仲裁層
- 本輪三條戰線同時出問題證明已經到「個別護欄解決不了」的閾值

### Alt-B：全面採用 Claude Code plugin marketplace（拒絕）

**論點**：把所有 skill 包成 plugin，用 `zarqarwi/paulkuo.tw` 當 marketplace repo，其他 repo 用 `claude plugin install` 拉取。官方 blessed 路徑。

**為什麼拒絕**（至少 v0.2 階段）：
- Paul 目前專案節奏還沒到需要 plugin marketplace 的規模（單人開發、跨專案 copy 可接受）
- Plugin 化要重新打包、測試、維護 marketplace manifest，一次性成本高
- 未來如果擴展到團隊或 open-source，再走 Alt-B

**保留條款**：第五條允許未來實驗；如果 skill 數量成長到維護成本超過 plugin 打包成本，就走 ADR 升級。

### Alt-C：立即關掉 Chat memory 以避免不可控記憶（拒絕）

**論點**：Chat memory 不可見不可控，是第一條 SSoT 原則的潛在污染源。關掉最乾淨。

**為什麼拒絕**：
- Chat memory 對 token 成本有正向作用（Paul 不用每次重講身份）
- 關掉的副作用（Claude 「忘記」Paul 是非全職工程師、token 敏感等）比維持冗餘嚴重
- 第四條已經給解法：「**不依賴但不關閉**」，當冗餘用，不當真相來源

---

## 6. Revision History

- **v0.1 (2026-04-19, 16:xx)**：Cowork session claude-opus-4-7 與 Paul 對話擬出五條骨架（SSoT / 載體對等 / 權責分工 / 記憶層次 / 記憶擴充）
- **v0.2 (2026-04-19, 17:xx)**：三個痛點回測後發現兩個結構缺口，採納修正案：
  - 第三條補「核查義務剛性」子條款
  - 第四條補「同層文件內部原子化」子條款

---

## 7. 下游影響與未決議題

### 7.1 對既有文件的影響

- **`CLAUDE.md`**：需加「參見 `docs/governance/adr-collaboration-constitution-v0.2-2026-04-19.md`」引用。本檔已 233 行、超 200 行官方軟上限，v0.3 可考慮抽部分到 `docs/governance/` 獨立文件
- **`docs/governance/working-environment.md`**：v4.18 rev2 的三視窗職責、源頭事實清單、handoff ADR 欄位規範，與本憲法第三、四條高度重疊。v0.3 統整
- **散落護欄 C1-C5、#8-#15**：可在憲法骨架下重新歸類為「第 X 條實施細則」。v0.3 整理
- **`.auto-memory/MEMORY.md`**：16 條記憶多數與第三、四條對齊，不需大動。但「護欄結構盲區」（memory `project_guardrail_structural_hole.md`）可考慮升級為正式 ADR

### 7.2 未決議題（排入 v0.3）

1. **session-handoff 兩棵樹合併**（briefing v2 Q1-Q3）
   - A/B 層 v5.3 paulkuo.tw 特化線
   - C 層 v4.13 業界通用線
   - 選項：合併成 v6.0 / 明確分工 / 重構

2. **C 層 4 個 skill export schema**（briefing v2 Q4 的真實問題）
   - paulkuo-writing、paulkuo-social、formosa-feedback、organize-downloads
   - 需要 individual ADR

3. **Handoff 結構升級**（working-environment.md §4.2 已提）
   - 統整進本憲法第三條實施細則

### 7.3 Out of scope（非本憲法管轄）

- paulkuo.tw 前端架構、Worker API 設計、D1 schema、KV namespace 規劃——這些是**代碼治理**，不是**協作治理**
- 子專案（Formosa ESG 2026、get_筆記 ingest、Wiki 管線）的 domain-specific 決策——屬於各專案自己的治理範疇
- Paul 個人生產力工具、生活工作流（Notion、Apple Notes、Spotify）——不在 paulkuo.tw repo 治理範圍

---

## 8. 附錄：快速索引

| 想查什麼 | 看哪一條 |
|---|---|
| 哪個檔案是真相？ | 第一條 |
| Claude.ai 編的 skill 怎麼處理？ | 第二條 |
| 誰該寫 governance 文件？ | 第三條主責表 |
| Cowork 看 Code 的 worklog 能直接信嗎？ | 第三條核查義務 |
| user profile 該存哪？ | 第四條 auto-memory |
| 進行中專案狀態存哪？ | 第四條 Issue #155 |
| 想試 Mem0 / Letta 能直接用嗎？ | 第五條流程 |

---

**本 ADR 是 paulkuo.tw 第一個正式協作憲法文件。未來所有治理 ADR 以 v0.N 為編號基準，與本檔承接。**
