# Cowork Handoff — paulkuo.tw 治理衛生 Task A+B 執行（PENDING 瘦身 + Handoff INDEX）

> **建議模型**：Sonnet 4.6 + Medium（純機械性清理，Opus 做違反 token 效率）
> **Task Size**：S（40-50 min，兩件一起做）
> **來源 session**：Cowork 2026-04-20（Opus 4.7，決策分派）
> **上游 handoff**：`handoffs/cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md`（Task A/B/C 三件事，本 handoff 只接 A+B，C 延 v5.2）
> **遵循 skill**：session-handoff v4.13

**Status**: Accepted
**Consequences**:
- **若決策正確**：PENDING.md 恢復可讀（<80 行）、handoffs/ 可查找（INDEX.md 建立）、每次 Cowork 開場掃描成本下降；Task C 延 v5.2 與四層檔案架構改版一併處理，避免兩次動 CLAUDE.md
- **若決策錯誤的連鎖影響**：(a) Task A 歸檔時誤刪活的待辦 → grep 前後比對可抓；(b) Task B 的 INDEX Status 欄不精確 → 先有索引可查即可，精確化交後續 skill 更新；(c) Task C 延期若 v5.2 視窗不如期開啟，5/2 收斂日帳面未達，但不影響運作
- **可逆性**：全部可逆（`git revert` 兩個 commit 即可回前狀態）
- **驗證收斂條件**：V1-V4 全過（見第 5 節）

---

## 1. 背景

Cowork 2026-04-20 Opus 4.7 視窗分派了兩輪工作：

**第一輪（已完成）**：消化 v0.3 closeout handoff。V1「Issue #155 body 含 v0.3 四軌落地」已**自然通過**（sync-dashboard Action 在上一輪 Cowork push `8729952` 後自動 PATCH 成功），無需動作，整輪結案。

**第二輪（本 handoff 的 scope）**：消化 governance-hygiene 上游 handoff 的三件事：
- **Task A**：PENDING.md 144 行 → <80 行（歸檔已完成項目）
- **Task B**：handoffs/ 59 份無索引 → 建 INDEX.md
- **Task C**：CLAUDE.md 269 行 → ≤250 行（**Paul 拍板延 v5.2 視窗**，v5.2 會做四層檔案架構改版一併搬檔）

Opus 4.7 視窗的定位是「只做需要判斷的 Task C 決策 + 寫本 handoff」，Task A+B 純機械性清理應由 Sonnet + Medium 執行（.auto-memory `feedback_token_efficiency.md` 規則）。

**本 Opus 4.7 視窗產出的四個檔案**（commit `80790bb`，已 push main）：
1. `worklogs/worklog-2026-04-20.md`（編輯） — 補上 Opus 4.7 分派紀錄 + Task C 延期決策 + 狀態變更 + 決策紀錄
2. `handoffs/cowork--v0.3-closeout-session-handoff-2026-04-20.md`（新加入版控） — 上上輪 Cowork 寫的，本輪納入
3. `handoffs/cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md`（新加入版控） — 上輪 Cowork 寫的，本輪納入
4. `handoffs/cowork--hygiene-task-ab-sonnet-handoff-2026-04-20.md`（新建） — 本檔案

---

## 2. Step 0 偵察（開場做）

### 2.1 確認 HEAD 狀態

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git fetch origin main && git log --oneline -5 origin/main
```

預期 HEAD：`80790bb docs(governance): v0.3 closeout V1 通過確認 + Task C 延 v5.2 + 分派 A+B handoff 給 Sonnet`

若本機落後：`git pull --rebase origin main`

### 2.2 掃當前狀態（確認起手點）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && echo "=== PENDING.md ===" && wc -l worklogs/PENDING.md && echo "=== CLAUDE.md ===" && wc -l CLAUDE.md && echo "=== handoffs/ ===" && ls handoffs/*.md | wc -l && echo "=== INDEX.md ===" && ls handoffs/INDEX.md 2>&1 | head -1 && echo "=== archive/ ===" && ls -d worklogs/archive 2>&1 | head -1
```

預期數字：
- PENDING.md **144 行**（起手）
- CLAUDE.md **269 行**（本輪不動）
- handoffs/ **59-60 份**（含 INDEX 建立後會是 60）
- INDEX.md 不存在（待建）
- worklogs/archive/ 不存在（待建）

### 2.3 讀上游 handoff（跳過 Task C，只看 Task A/B 原描述）

```bash
# Task A 在上游 handoff 第 58-72 行，Task B 在第 74-101 行
sed -n '58,101p' handoffs/cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md
```

### 2.4 備份活的待辦清單（Task A 防丟失）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && grep '^- \[ \]' worklogs/PENDING.md > /tmp/pending-before.txt && wc -l /tmp/pending-before.txt
```

記住這個數字。Task A 搬完之後要再跑一次，確認活的待辦沒少。

---

## 3. 具體步驟

### Task A：PENDING.md 瘦身（~15 min）

**目標**：已完成的 `[x]` 項目搬到 `worklogs/archive/pending-completed-2026-04.md`，活的 `[ ]` 項目 + 「跨專案備忘」全部留下。

**步驟**：

1. 建 archive/：
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw && mkdir -p worklogs/archive
   ```

2. 用 `Read` 讀完整 `worklogs/PENDING.md`，心中標記：
   - 所有 `[x]` 項目 → 要搬走（連同所屬的分組 heading 一起帶過去，保留上下文）
   - 所有 `[ ]` 項目 → 留下
   - 「跨專案備忘」區塊 → **留下**（永久參考資訊，不歸檔）
   - 「格式說明」若有 → 留下

3. 建 `worklogs/archive/pending-completed-2026-04.md`：
   - Header：`# PENDING.md 已完成歸檔 — 2026-04 月`
   - 說明行：「從 PENDING.md 移過來的 `[x]` 已結案項目，保留供日後追溯。Archive 由 2026-04-20 Cowork（Sonnet）批次建立。」
   - 下方依原分組（🔴 / 🟡 / 🟢）放 `[x]` 項目 + 每項日期前綴若有

4. 重寫 `worklogs/PENDING.md`，只留：
   - 原 header
   - 跨專案備忘區塊
   - 格式說明
   - 所有 `[ ]` 未完成項（保留分組結構）
   - **Scanner 重複三條合併**：把 04-17/04-18/04-19 三條 `5c58ee02 smoke test 缺漏` 合併為一條：
     ```markdown
     - [ ] 5c58ee02 smoke test 缺漏（scanner 連續 3 天重複偵測，2026-04-17/18/19 各產出一筆）
           → 待 Code 補驗或標記 skip；根治靠 scanner 去重機制（v5.2 候選）
     ```

5. 驗證活的待辦沒少：
   ```bash
   grep '^- \[ \]' worklogs/PENDING.md > /tmp/pending-after.txt && diff /tmp/pending-before.txt /tmp/pending-after.txt
   ```
   預期：`diff` 只差「Scanner 三條合併為一條」這一處（少兩行）；其他活的待辦全留。

6. Commit（分開做，不跟 Task B 混）：
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw && git add worklogs/PENDING.md worklogs/archive/pending-completed-2026-04.md && git commit -m "chore: archive completed PENDING.md items [影響: 僅治理文件]" && git push origin main
   ```

---

### Task B：Handoff INDEX 建立（~20 min）

**目標**：`handoffs/INDEX.md` 涵蓋全部 handoff（主目錄 + `done/` 子目錄），日期倒序，含方向 + 主題 + Status。

**步驟**：

1. 產出排序後的 handoff 清單：
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw && ls handoffs/*.md handoffs/done/*.md 2>/dev/null | sort -r | head -70
   ```

2. 對每份 handoff：
   - **日期**：從檔名末尾 `YYYY-MM-DD` 解析
   - **方向**：從檔名前綴推斷
     - `code--` → `Code→Code` 或 `Cowork→Code`（看內文）
     - `cowork--` → `Cowork→Cowork` 或 `Cowork→Code`
     - `chat--` → `Chat→Cowork` 或 `Chat→Code`
     - 不確定標「—」
   - **主題**：讀第一行 `# Title`，取 `—` 之後或 `Handoff` 之後那段
   - **Status**：
     - `handoffs/done/` 裡的 → `Done (archived)`
     - 主目錄的 → 若讀檔前 10 行找到 `Status: Accepted` 就標 Accepted，否則留「—」
     - **不需讀全文**，第一行 + 前 10 行夠了

3. 寫 `handoffs/INDEX.md`：

```markdown
# Handoff 索引

> 自動產出於 2026-04-20（Sonnet session），後續由 session-handoff skill 維護。
> **新寫 handoff 時，在索引頂部加一行。**
> 檔名格式：`{方向}--{專案}-{描述}-{YYYY-MM-DD}.md`

## 主目錄

| 日期 | 檔案 | 方向 | 主題 | Status |
|------|------|------|------|--------|
| 2026-04-20 | [cowork--hygiene-task-ab-sonnet-...](./cowork--hygiene-task-ab-sonnet-handoff-2026-04-20.md) | Cowork→Cowork | Task A+B 執行（本檔） | Accepted |
| 2026-04-20 | [cowork--governance-hygiene-and-v0.4-...](./cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md) | Cowork→Cowork | 治理衛生清理 + v0.4 規劃 | Proposed（Task C 延 v5.2） |
| 2026-04-20 | [cowork--v0.3-closeout-session-...](./cowork--v0.3-closeout-session-handoff-2026-04-20.md) | Cowork→Cowork | v0.3 憲法收尾驗證 | Accepted |
| 2026-04-20 | [cowork--wiki-youtube-rate-limit-retry-...](./cowork--wiki-youtube-rate-limit-retry-2026-04-20.md) | Cowork→Code | YouTube rate limit 重試 | — |
| ... | ... | ... | ... | ... |

## 已結案歸檔（handoffs/done/）

| 日期 | 檔案 | 主題 |
|------|------|------|
| ... | ... | ... |
```

4. 驗證：
   ```bash
   wc -l handoffs/INDEX.md
   ```
   預期：行數 ≥ 60（header ~10 行 + 59+ 份 handoff 每行一筆）

5. Commit（和 Task A 分開）：
   ```bash
   cd ~/Desktop/01_專案進行中/paulkuo.tw && git add handoffs/INDEX.md && git commit -m "docs: create handoff INDEX.md [影響: 僅治理文件]" && git push origin main
   ```

---

## 4. 上游假設

執行前先驗證；任一項不符 → 停下來問 Paul，不要強推。

| # | 假設 | 驗證方式 |
|---|------|---------|
| U1 | commit `80790bb` 已在 origin/main | `git log --oneline origin/main -3` 看到 |
| U2 | PENDING.md 起手 144 行 | Step 0.2 輸出 |
| U3 | handoffs/ 59-60 份且無 INDEX | Step 0.2 輸出 |
| U4 | worklogs/archive/ 不存在（新建） | Step 0.2 輸出 |
| U5 | Cowork 可直接 commit 到 `worklogs/`、`handoffs/` 白名單路徑 | WE §1 已確認，見 `docs/governance/working-environment.md` |
| U6 | 原上游 governance-hygiene handoff 的 Task A/B 描述無更新 | 本 handoff 背景寫入當時版本，若上游有變動請對照 |
| U7 | Task C（CLAUDE.md 瘦身）明確延 v5.2，不在本輪 scope | worklog-2026-04-20「狀態變更」已記錄 |

---

## 5. 驗證方式

| # | 驗證項 | 方法 | 來源標注 |
|---|--------|------|---------|
| V1 | PENDING.md 瘦身成功 | `wc -l worklogs/PENDING.md` < 80 | 本機 |
| V2 | 活的待辦沒丟失 | `diff /tmp/pending-before.txt /tmp/pending-after.txt`，僅差 Scanner 三條合併 | 本機 |
| V3 | handoff INDEX 存在且完整 | `ls handoffs/INDEX.md && wc -l handoffs/INDEX.md` ≥ 60 | 本機 |
| V4 | 兩個 commit push 成功 | `git log --oneline origin/main -5` 看到兩個治理 commit | 本機 + GitHub |
| V5 | archive 檔案存在且格式正確 | `ls worklogs/archive/pending-completed-2026-04.md && head -5` | 本機 |

---

## 6. 注意事項

### 6.1 硬性規則（❗）

- ❗ **Task C 不做** — CLAUDE.md 不得動，本輪 scope 不含。如果看到 CLAUDE.md 越界誘惑，記住：Paul 已拍板延 v5.2。
- ❗ **「跨專案備忘」不歸檔** — PENDING.md 那段是永久參考資訊，每次 Cowork 開場要讀的。
- ❗ **兩個 commit 分開** — Task A 一個 commit、Task B 另一個 commit，不混（便於日後 `git revert` 單軌）。

### 6.2 已知陷阱

- Task B 的 Status 欄**不追求精確** — 先有索引可查就夠。讀檔名 + 第一行 + 前 10 行即可，不要讀全文耗 token。
- `handoffs/done/` 子目錄若存在要一併納入，Status 一律 `Done (archived)`。
- Scanner 重複三條合併時，**不要直接刪** — 合併為一條並保留「連續 3 天重複偵測」的備註，供後續 Code 修 scanner 去重機制時追。

### 6.3 護欄對應

| 護欄 | 本輪觸發情形 |
|------|------------|
| #11 Propose-then-Commit | 本輪無不可逆操作，純治理文件。N/A |
| #14 跨 repo 真相驗證 | 本輪不改程式碼、不部署、不跨 repo。N/A |
| #15 MCP 寫入的寫後驗證 | **本輪預設走本機 Edit/Write + git commit，不走 MCP write** — PENDING.md 瘦身後約 70-80 行（<10KB 安全區）；INDEX.md 約 70 行（<10KB 安全區）。若改用 GitHub MCP 推檔，寫完必須 `get_file_contents` 重抓驗 size。建議直接本機 commit，省一道驗證。 |

### 6.4 Code 完成三態（若本輪有 Code 協作）

本輪預期 Cowork 自己 commit + push，不涉 Code session。若臨時需要 Code 協助（例如 hook 沒過、pre-commit 擋下），Code 完成宣告必須三態之一：
- `✅ commit {SHA} pushed`
- `⚠️ commit {SHA} local only`
- `⚠️ local edit uncommitted`

---

## 7. 信心等級

**高**

- Task A：讀檔 + 分類 + 搬檔，有 grep 前後比對保護。風險接近 0。
- Task B：純讀檔名 + 第一行 heading 產出 markdown 表格。風險接近 0。
- 兩個 commit 分開且都在 Cowork 白名單路徑，WE §1 已授權直接 commit。

唯一不確定：`handoffs/done/` 目錄的確切內容（是否有 handoff 在裡面、命名是否規則）。Step 0 會確認，到時若有異狀回報 Paul。

---

## 8. Integration Checklist

本次改動可能影響的其他系統：

- [ ] **Issue #155 body**：PENDING.md 路徑不變（`worklogs/PENDING.md`），所以 Issue #155 的 PENDING 相關引用不受影響。執行後可視需要於 Issue #155 的治理區塊補一條「04-20 PENDING.md 歸檔（Sonnet 執行）」，不是必做。
- [ ] **session-handoff skill SKILL.md**：Task B 建完 INDEX 後，未來寫 handoff 應同步加一行索引條目。這個規則**本輪不改 skill**（屬於 skill 行為變更，依護欄 #12 需 bump 版本），留給 v5.2 視窗處理。本 handoff 只在 INDEX 的 header 寫「新寫 handoff 時加一行」當溫和提示。
- [ ] **worklog-2026-04-20.md**：Task A/B 完成後，請在 worklog 補一條完成日誌：
  ```
  - {HH:MM} PENDING.md 歸檔（144→{N} 行）+ handoff INDEX.md 建立（{N} 份）(commit {A}, commit {B}) Cowork
  ```
  以及「狀態變更」區塊補一條：
  ```
  - governance hygiene Task A+B：已分派 → 已完成
  ```
- [ ] **護欄 #13 新 endpoint 繼承檢查**：本輪不新增 API endpoint。N/A。
- [ ] **護欄 #15 MCP 寫入驗證**：本輪預設不走 MCP write，若臨時走了必須驗 size（見 6.3）。
- [ ] **Exit Gate**：結案前確認
  - ⬜ V1-V5 全過
  - ⬜ worklog-2026-04-20.md 狀態變更已補
  - ⬜ skill 行為無變更，無需 bump 版本

---

## 附錄 A：本 Opus 4.7 視窗的四個產出檔案（commit 80790bb）

| # | 檔案 | 動作 | 作用 |
|---|------|------|------|
| 1 | `worklogs/worklog-2026-04-20.md` | 編輯 | 補 Opus 4.7 分派紀錄 + Task C 延期決策 + 狀態變更 |
| 2 | `handoffs/cowork--v0.3-closeout-session-handoff-2026-04-20.md` | 新加版控 | 上上輪 Cowork 的產出物，本輪納入 git |
| 3 | `handoffs/cowork--governance-hygiene-and-v0.4-planning-2026-04-20.md` | 新加版控 | 上輪 Cowork 的產出物，Task A/B/C 三件事來源 |
| 4 | `handoffs/cowork--hygiene-task-ab-sonnet-handoff-2026-04-20.md` | 新建 | 本檔案 |

下次 Cowork 開場時**不需要重讀 #2 和 #3**，本 handoff 已摘要。如需細節再去翻。

---

## 附錄 B：延到 v5.2 視窗的候選

| 候選 | 理由 | 預估 |
|------|------|------|
| CLAUDE.md 抽離 Rollback / Wrangler / Worklog SOP（Task C） | v5.2 會做四層檔案架構改版，一併搬檔 | M |
| Scanner 去重機制（5c58ee02 連續 3 天重複） | 根治 PENDING.md 汙染源 | S（Code） |
| session-handoff skill：新 handoff 自動加 INDEX.md | INDEX 維護責任歸屬制度化，需 bump 版本（護欄 #12） | S |
| v0.4 憲法第四條補款：跨 session 佇列衛生規則 | 本輪清理出實施經驗，累積 2-3 次後可修憲 | M |
