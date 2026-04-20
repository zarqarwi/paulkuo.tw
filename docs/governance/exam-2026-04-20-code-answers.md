# paulkuo.tw 治理與憲法考題 — 答卷

> 作答視窗：Desktop / Claude Code（Opus 4.7）
> 作答日期：2026-04-20
> 檢索來源：`~/Desktop/01_專案進行中/paulkuo.tw`（git HEAD）、記憶索引 `MEMORY.md`、今日 handoff
> 作答原則：所有量化聲明均現場驗證，不憑記憶答題（C1 / 源頭事實規範）

---

## 第一層：事實性

### 1. CLAUDE.md 現在幾行？移出了哪兩份文件？移到哪裡？

**CLAUDE.md 現在 199 行**（`wc -l CLAUDE.md` 實測）。

移出的兩份內容：

| 原內容 | 去處 |
|---|---|
| Worklog 三維度格式細則 | `docs/governance/worklog-format.md` |
| Rollback Protocol | `docs/governance/rollback-protocol.md` |

CLAUDE.md 改為只保留「規則 + 最低約束」，細節用一行 pointer 轉址（`詳細格式與範例見 docs/governance/worklog-format.md`、`出事時見 docs/governance/rollback-protocol.md`）。

---

### 2. `worklog-format.md` 和 `rollback-protocol.md` 為什麼從 CLAUDE.md 移出來？

兩個理由，一短一長：

- **短：長度管制**。CLAUDE.md 已超 `working-environment.md §4.2 F4` 官方 200 行軟上限（269 → 200 目標），若繼續把操作細節寫在主檔，下一次觸發的是 800 行硬拆。先把「能抽離的施行細則」抽出，主檔只保留路徑上的「規則宣告」。
- **長：載體職能分隸**。依憲法第四條，CLAUDE.md 的主責層是「工程慣例、部署規則、陷阱」（工程層規範）；而 worklog 格式是治理文件格式、rollback 是事故 SOP——兩者主責層應在 `docs/governance/`（治理層）。移出等於把「錯放在工程層的治理規範」退回治理層，解決第四條的同事實跨層複製風險。

---

### 3. `Issue #155` 是什麼？和 `worklogs/PENDING.md` 的分工各是什麼？

- **Issue #155**：所有專案「進行中狀態」的 SSoT 儀表板（2026-04-09 起從 Apple Notes 永久遷移；body 由 `worklogs/issue-155-body.md` 經 `sync-dashboard` GitHub Action 自動 PATCH）。主責寫入者：Cowork。
- **PENDING.md**：Code ↔ Cowork 的**跨 session 待辦佇列**，直接溝通管道。主責寫入者：Code / Cowork 皆可，依「誰要把球交給誰」決定。

分工差異（依憲法第四條記憶層次表）：

| 軸 | Issue #155 | PENDING.md |
|---|---|---|
| 層級 | 狀態儀表板（長期） | 跨 session 佇列（短期） |
| 讀者 | Paul + 所有 session | 下一個 Cowork / Code session 開場 |
| 粒度 | 專案 / 里程碑 | 單項待辦（含 `[ ]` / `[x]` checkbox） |
| 壽命 | 持續更新、不歸檔 | 完成即歸檔到 `worklogs/archive/pending-completed-YYYY-MM.md` |

一句話：**Issue #155 記「現在到哪」，PENDING 記「下次該做什麼」**。

---

### 4. `handoffs/INDEX.md` 是什麼時候建立的？涵蓋幾份 handoff？

- **建立時間**：2026-04-20，由 Sonnet session 依本輪 `cowork--hygiene-task-ab-sonnet-handoff-2026-04-20.md` 的 Task B 執行產出。
- **涵蓋份數**（實測）：主目錄 61 份 + `handoffs/done/` 2 份 = **約 63 份 handoff**（INDEX.md 本身 75 行含 header / 表頭）。

---

### 5. 協作憲法目前是第幾版？五條分別是什麼？

**當前版本：v0.2（Accepted，2026-04-19），實施細則見 v0.3 實施 ADR（2026-04-20）**。

| 條 | 名稱 | 一句話 |
|---|---|---|
| 第一條 | **SSoT 原則** | paulkuo.tw repo 的 git HEAD 是所有規則 / skill / 治理 / 記憶 / 佇列的唯一事實來源 |
| 第二條 | **載體對等原則** | Claude.ai 雲端（C 層）永遠是下游 mirror，不進協作主幹 |
| 第三條 | **權責分工原則** | 主責分工為解釋原則可遊走；跨權輸出的**核查義務為剛性** |
| 第四條 | **記憶層次原則** | 分層明確 + 職能分隸；任何事實只在主責層存一份（含同層原子化補款） |
| 第五條 | **記憶擴充原則** | 可加入外掛記憶載體（Mem0 / Letta / MCP memory 等），但須走 ADR 流程 |

---

## 第二層：判斷性

### 6. 護欄 #14 和 #15 各是因為什麼真實事故加進來的？根本原因是什麼？

> 編號系統：#14 / #15 屬 **v4.13 以前的流水號格式**；v5.1 起已重編為 A/B/C/D 主題碼。本題以題目命名作答。

**護欄 #14（跨 repo 真相驗證）**
- 觸發事故：**Issue #170「幽靈部署」**。worklog 聲稱「部署完成」，實際 commit 根本沒 push 到 main（RFC #100 同型事故也屬此類）。
- 根本原因：Code session 的**單一來源自述**（worklog）被整條傳遞鏈沿用，**沒有獨立驗證點**。部署的「真相」在 GitHub remote main，不在本機，更不在 worklog 裡。
- 規則固化：部署後**必須透過 GitHub MCP grep main 驗證 commit SHA 已進 remote**。

**護欄 #15（MCP 寫後驗證）**
- 觸發事故：GitHub MCP **大檔案寫入截斷**（2026-03-31 截斷事故類型）+ API 回傳 `success: true` 但實際 body 缺損。
- 根本原因：**工具層假陽性**——MCP 回傳「成功」代表「API 呼叫成功」，不代表「內容完整寫入 remote」。特別是 >10KB 檔案、markdown 表格、程式碼區塊容易被 silently truncate。
- 規則固化：MCP 寫入後必須用 `get_file_contents` / `get_issue` / curl 等**獨立讀取路徑**重抓並對比 size / hash / 關鍵字串。

兩條護欄共用同一個憲法層抽象：**第三條「司法對行政」核查義務剛性**——不信自述、不信工具，信獨立驗證。

---

### 7. 什麼情況下應該開 Opus 視窗，什麼情況下 Sonnet 就夠？舉今天的例子。

**判準**：工作性質是否需要**跨多份文件的判斷 / 決策 / 權衡**。

- **要 Opus**：
  - 跨 session / 跨文件的判斷與裁定（憲法解釋、ADR、meta 規劃）
  - 決策分派（誰做、做到什麼程度、延什麼、合併什麼）
  - 空中樓閣類事故的 retro 與規則反推

- **Sonnet 就夠**：
  - 機械性清理、搬檔、格式化、單純索引產出
  - 有 SOP 可照做的執行型任務（deploy、migration、單點 bug 修）
  - 依 `.auto-memory/feedback_token_efficiency.md`：Opus 做機械性工作 = 違反 token 效率

**今天的例子**：

| 工作 | 模型 | 理由 |
|---|---|---|
| Task A（PENDING.md 瘦身） | Sonnet + Medium | 讀 / 分類 / 搬檔，純機械 |
| Task B（建 INDEX.md） | Sonnet + Medium | 讀檔名 + 第一行 → 產表，純機械 |
| Task C（是否提前做 / 延 v5.2） | **Opus 4.7** | 要和 v5.2 的四層檔案架構改版做 trade-off 判斷 |
| 寫分派 handoff | Opus 4.7 | 跨三視窗決策書，要留可稽證的推理軌跡 |

---

### 8. Task C（CLAUDE.md 瘦身）原本延到 v5.2，今天提前做了，合理嗎？

**合理，但前提是「範圍克制」**。

- **原本延期的理由**：避免 v5.2 四層檔案架構改版時**二度搬檔**——若 v5.2 會重排所有治理文件的層級，提前做 Task C 等於白搬。
- **今天提前做仍合理的條件**：只做「抽出已在 CLAUDE.md 內部各自獨立的兩段（worklog-format、rollback-protocol）到既有 `docs/governance/` 路徑」。這個動作：
  - 目的地就是現在的 governance 層，v5.2 重組時這兩份不會被再搬（它們已在治理主檔夾）
  - 符合第四條「職能分隸」——把錯放在工程層的治理文件退回治理層
  - 把 CLAUDE.md 從 269 → 199 行，把 200 行軟上限警報解除，降低 v5.2 視窗的緊迫度
- **不合理的做法（若採了就是錯）**：把主檔 refactor 成四層結構、改動其它章節——那會吃到 v5.2 scope，造成兩次動主檔的成本。

結論：**抽離 = 合理提前；重構 = 仍應延 v5.2**。今天若只做抽離，決策合理。

---

### 9. `worklogs/PENDING.md` 和 `worklogs/archive/` 的關係是什麼？觸發歸檔的條件？

**關係**：PENDING.md 是「進行中佇列」（live），`archive/` 是「已結案快照」（cold）。兩者是**同一資料流的熱 / 冷層**。

**觸發歸檔的條件**（本輪 Task A 建立的實作規則）：

1. PENDING.md 項目變成 `[x]`（完成）
2. Cowork 開場掃描時發現 PENDING.md 膨脹（例：≥ 80-100 行）
3. 月度 housekeeping（`archive/pending-completed-YYYY-MM.md`）

**歸檔規則**：
- `[x]` 項目連同所屬分組 heading 一起搬過去（保留上下文）
- **「跨專案備忘」永不歸檔**（永久參考資訊）
- `[ ]` 未完成項全部留下
- 歸檔分開 commit，便於 `git revert` 單軌

---

### 10. session-handoff skill 的四個治理動機是什麼？今天的 Task A/B/C 各回應了哪個？

**v4.11 設計原則四動機**（新護欄 / 流程必須對齊至少一個）：

1. **專案交錯影響**
2. **跨 Session 溝通斷點**（含工具層假陽性）
3. **Token 無效支出**
4. **Context / 容器管理**

> 動機 3 / 4 額外要求同時建 metrics。

**今天三個 Task 的對齊**：

| Task | 主要動機 | 次要動機 |
|---|---|---|
| Task A — PENDING.md 瘦身 | **動機 4（Context 管理）**：開場掃描成本下降，減少每次 Cowork 讀佇列的 token 耗損 | 動機 3 |
| Task B — Handoff INDEX | **動機 2（跨 session 溝通斷點）**：新 session 可 O(1) 查歷史 handoff，不需 `ls \| grep` 猜檔名 | 動機 3 |
| Task C — CLAUDE.md 抽離 | **動機 4（Context 管理）**：主檔每次 Code session 自動讀取，抽離 = 降每次 session 的 baseline token | 動機 1（讓子專案 CLAUDE.md 不被主檔膨脹排擠） |

三個 Task 全部落在「降 context cost」大類，合理——因為這輪本來就是 **governance hygiene**，不是加新護欄。

---

## 第三層：情境性

### 11. Code 說「改好了」，你要引導 Paul 部署，你第一步做什麼？（護欄 #14）

**不部署。第一步：跑獨立驗證，確認 `git log origin/main` 看得到該 commit SHA**。

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw \
  && git fetch origin main \
  && git log --oneline origin/main -5
```

- 如果看得到 → 才進入部署 SOP
- 如果看不到 → 質問 Code：「請回傳 commit 三態宣告之一：`✅ commit {SHA} pushed` / `⚠️ commit {SHA} local only` / `⚠️ local edit uncommitted`」；在三態明確前不動 wrangler
- 如果部署完還要驗：wrangler 成功後**立刻**跑該專案 CLAUDE.md 的 Smoke Test，結果進 worklog

理由：**Code 的「改好了」是自述，不是真相**。真相在 remote main。Issue #170 幽靈部署就是跳過這一步。

---

### 12. 用 GitHub MCP 推了一個 15KB 的文件，工具回傳 `{ success: true, sha: "abc123" }`，下一步？（護欄 #15）

**不信 `success: true`，立刻獨立重抓驗證**。

```bash
# 方案 A（較輕）：用 get_file_contents 讀同一 SHA，驗 size 與關鍵字
mcp__github__get_file_contents(path=..., ref=abc123)
# 比對：size ≈ 15KB？文件尾的已知句子還在？markdown 表格邊界未被截？

# 方案 B（較穩）：本機 git fetch + diff
cd ~/Desktop/01_專案進行中/paulkuo.tw && git fetch origin main \
  && git show abc123:{path} | wc -c   # 比對 size
```

**為什麼非驗不可**：
- 15KB 已經進入 MCP 大檔案潛在截斷區（>10KB 為警戒線）
- `success: true` 是 API 層語義，不是內容完整語義
- markdown 表格、程式區塊、長 list 最易被 silently truncate
- 驗證失敗 → **不要重推**，先看截斷的位置（頭 / 中 / 尾）再決定改走本機 `git commit` 或 PR

只有獨立讀取路徑驗過、size + 內容完整，才視為「寫入成功」寫進 worklog。

---

### 13. 開場掃 `worklogs/PENDING.md`，發現它又長到 130 行了。怎麼處理？

依今天 Task A 建立的 SOP 處理：

1. **先備份活清單**（防丟失）：
   ```bash
   grep '^- \[ \]' worklogs/PENDING.md > /tmp/pending-before.txt && wc -l /tmp/pending-before.txt
   ```
2. **Read 完整 PENDING.md**，心中標記：`[x]` 要搬、`[ ]` 留、「跨專案備忘」永不搬
3. **搬到 `worklogs/archive/pending-completed-YYYY-MM.md`**（依當月），依原 🔴 / 🟡 / 🟢 分組
4. **重寫 PENDING.md**，只留活的 + 跨專案備忘 + 格式說明
5. **驗證活的沒丟**：
   ```bash
   grep '^- \[ \]' worklogs/PENDING.md > /tmp/pending-after.txt && diff /tmp/pending-before.txt /tmp/pending-after.txt
   ```
6. **單獨 commit**（不跟其他工作混）：
   ```
   chore: archive completed PENDING.md items [影響: 僅治理文件]
   ```

若發現來源是 **scanner 重複污染**（像今天的 5c58ee02 連續 3 天）：合併為一條並備註「連續 N 天重複偵測」，根治留 v5.2（scanner 去重機制候選）。

**不做的事**：不逕自刪 `[x]`、不動「跨專案備忘」、不順手改 CLAUDE.md。

---

### 14. 不確定某個功能有沒有部署過，怎麼辦？（黃金法則）

**先查，不要直接重做**。

依 CLAUDE.md「跨 Session 協作 / 黃金法則」：**grep / curl / git log / PRAGMA**。

實際操作順序（從輕到重）：

1. **git log**：`git log --oneline --all -- {path/to/file}` 看改動歷史
2. **grep source**：現場讀最新的檔案內容，確認「應該有」的 symbol / endpoint / flag 真的在
3. **curl 線上端點**：`curl -sS https://paulkuo.tw/{api} | head` 看 production 是否有該行為
4. **PRAGMA / `wrangler d1 execute`**：DB migration / KV 相關的部署要查 remote schema 或 key
5. **GitHub MCP 驗 main**：`get_file_contents` 看 remote main 的該檔案是否為預期版本

搭配 v5.3 的 C4 邊界：**陰性結果需跨來源驗證**——一種工具查無不等於不存在。

絕不：直接 wrangler deploy「試試看」。重複部署可能覆蓋未同步的 hotfix、觸發 cron / webhook 重放。

---

### 15. 在對話中決定了 session-handoff skill 的行為要變更，接下來的三步？（護欄 #12）

skill 行為變更屬**結構性改動**，不是就地改 SKILL.md。三步：

**Step 1 — Bump 版本 + 寫 CHANGELOG**
- 決定版本跳哪一級：行為新增 → minor（v5.3 → v5.4）；破壞相容 → major；邊界固化 / 編輯 → patch
- 在 `.claude/skills/session-handoff/CHANGELOG.md` 新增版本區塊：主題、觸發事故、Metrics（若對齊動機 3 / 4）
- SKILL.md 頂部 version 欄同步

**Step 2 — 同步 A / B / C 三層（憲法第一 + 第二條）**
- A 層（paulkuo.tw repo `.claude/skills/`）是正本 → commit + push 為 SSoT
- B 層（使用者級 `~/.claude/skills/session-handoff/`）= 下游 mirror：
  ```bash
  cp -r .claude/skills/session-handoff/ ~/.claude/skills/session-handoff/
  ```
- C 層（Claude.ai Web）人工 export，接受非即時性（第二條允許）

**Step 3 — 把變更寫進治理層留痕**
- `worklogs/worklog-{date}.md` 記「決策紀錄」+「狀態變更」兩區塊（同層原子化，第四條補款）
- 若變更影響 Cowork 開場 SOP → 同步寫進 `docs/governance/working-environment.md`
- 若是新 / 刪護欄 → 用 v4.11 四動機檢核（至少一個動機對齊；動機 3 / 4 要附 metrics），不對齊就不通過（避免護欄暴脹）

**不做**：對話裡喊改完就收工。Cowork / Code / Chat 三視窗的下一個 session 看不到這次對話。

---

## 附錄：作答時現場驗證的量化事實

| 項 | 值 | 指令 |
|---|---|---|
| `CLAUDE.md` 行數 | 199 | `wc -l CLAUDE.md` |
| `worklogs/PENDING.md` 行數 | 76 | `wc -l worklogs/PENDING.md` |
| `handoffs/INDEX.md` 行數 | 75 | `wc -l handoffs/INDEX.md` |
| 主目錄 handoff 數 | 61 | `ls handoffs/*.md \| wc -l` |
| `handoffs/done/` handoff 數 | 2 | `ls handoffs/done/` |
| `worklogs/archive/` 內容 | `pending-completed-2026-04.md` 已建 | `ls worklogs/archive/` |
| 憲法 ADR 檔 | `adr-collaboration-constitution-v0.2-2026-04-19.md` + `adr-constitution-v0.3-implementation-2026-04-20.md` | `ls docs/governance/` |
| 最新 skill 版本 | v5.3（CHANGELOG.md） | `sed -n '7p' .claude/skills/session-handoff/CHANGELOG.md` |
