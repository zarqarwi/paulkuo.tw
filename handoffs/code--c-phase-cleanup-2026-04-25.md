---
status: Accepted
---

# Code Handoff · (c) ADR 階段 rev2 後續清理

- **產出時間**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6）
- **目標 session**：Code（建議 Sonnet 4.6）
- **任務類型**：rev2 deployment 後續清理（A2 + B + D + E）
- **Status**：Ready for execution
- **上游 handoff**：
  - `handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md`（前一輪 deployment，已執行完）
  - 註：上游 handoff 在本 handoff 執行的 Step 2 中會被 mv 到 done/

---

## 0. 開頭警示

**本 handoff 純執行，不做判斷。**

延續 rev2 deployment（commit `6c2a9a5` + `520e2a3` 已 push）後的清理工作。Paul 已對 §5 五個未決事項做出裁決（A2 / B 立刻做 / C 不做等 lint / D3 mv done/ / E 下輪修——但 E 改本輪一起做）：

| 議題 | Paul 裁決 | 本 handoff 處置 |
|---|---|---|
| A. worklog 補章 | A2 commit 原貌 + commit message 解釋 | Batch 3 |
| B. matrix + Q2 handoff | 順手進 git | Batch 3 |
| C. 歷史 4 份 untracked | 等 H7 lint Phase 2 觸發測試 | **不做** |
| D. rev2 deployment handoff | D3 mv 到 handoffs/done/ | Batch 3 |
| E. ADR-INDEX 算術 | 改 11 → 12 | Batch 4 |

**禁止**：

- 修改任何檔案內容（除 §Step 4 ADR-INDEX 單行算術修正）
- 動歷史 4 份 untracked（C 留待 H7 lint Phase 2 自動偵測測試）
- 動本 cleanup handoff 自己（D1 留 untracked，下輪歸檔）

---

## 1. 任務範圍

### 1.1 必做

| Step | 動作 | 工具 |
|---|---|---|
| 1 | 前置檢查（git status、git log 比對） | bash |
| 2 | mv rev2 deployment handoff 到 handoffs/done/ | bash |
| 3 | Batch 3 commit（worklog 補章 + matrix + Q2 handoff + 歸檔 rev2 handoff） | bash |
| 4 | ADR-INDEX 單行修正（11 → 12） | edit |
| 5 | Batch 4 commit（ADR-INDEX 算術修正） | bash |
| 6 | push（兩個 commit 一起） | bash |
| 7 | Issue #155 同步 comment（可選，若 Paul 在 §6 裁決同步則做） | GitHub MCP |

### 1.2 不做

1. **不動** 歷史 4 份 untracked：
   - `docs/governance/code--paulkuo-tw-adr-index-and-branch-protection-audit-2026-04-25.md`
   - `docs/governance/code--pending-md-h1-h9-ratification-2026-04-24.md`
   - `docs/governance/cowork--adr-drafting-h1-h9-2026-04-24.md`
   - `docs/governance/cowork--archive-h1-h9-handoff-2026-04-25.md`
   - 理由：C 留待 H7 lint Phase 2 實作後自動偵測，當 H10 紀律自動化測試 case
2. **不動** 本 cleanup handoff 自己（`handoffs/code--c-phase-cleanup-2026-04-25.md`）：
   - 留 untracked，下輪歸檔
3. **不修改** worklog 補章內容：
   - 補章描述「H10/H11 起草為 Proposed」是 Cowork rev1 階段事實（H8 §七 不追溯）
   - commit message 標明軌跡關係，不改檔案內容
4. **不重新 lint**：
   - rev2 已 push，本輪只清理，不跑 lint
5. **不擴大範圍**：
   - 看到「順便應該做的」標註但不改

---

## 2. 詳細步驟

### Step 1 · 前置檢查

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git status --short docs/governance/ worklogs/ handoffs/ && \
echo "---" && \
git log --oneline -3
```

**預期 git status**：

```
 M docs/governance/ADR-INDEX.md
 M worklogs/worklog-2026-04-25-governance-exploration.md
?? docs/governance/code--paulkuo-tw-adr-index-and-branch-protection-audit-2026-04-25.md
?? docs/governance/code--pending-md-h1-h9-ratification-2026-04-24.md
?? docs/governance/cowork--adr-drafting-h1-h9-2026-04-24.md
?? docs/governance/cowork--archive-h1-h9-handoff-2026-04-25.md
?? handoffs/code--c-phase-cleanup-2026-04-25.md          ← 本 handoff 自己
?? handoffs/code--c-phase-rev2-deployment-2026-04-25.md  ← 待 mv 到 done/
?? handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md
?? worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md
```

**預期 git log 最頂端兩個 commit**：

```
520e2a3 docs(governance): H11 demoted to Draft, observation period until 2026-06-25
6c2a9a5 docs(governance): H10 ratified Accepted + archive 4 research reports
```

**判斷**：

- ✅ 兩個 commit 都在最頂 → 照本 handoff 執行
- 🛑 commit history 與預期不符 → 停止，回報 Paul

### Step 2 · mv rev2 deployment handoff 到 handoffs/done/

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
mkdir -p handoffs/done && \
mv handoffs/code--c-phase-rev2-deployment-2026-04-25.md handoffs/done/
```

驗證：

```bash
ls handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md && \
ls handoffs/code--c-phase-rev2-deployment-2026-04-25.md 2>&1 | head -1
```

預期：

- 第一行 ls 成功
- 第二行 ls 報「No such file or directory」

### Step 3 · Batch 3 commit（A2 + B + D）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add worklogs/worklog-2026-04-25-governance-exploration.md \
        worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md \
        handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md \
        handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md && \
git commit -m "docs(governance): (c) phase rev2 follow-up — preserve drafts + archive deployment handoff

- worklog (c) phase 補章保留 rev1 起草階段事實（H8 §七 不追溯）
  Cowork rev1 起草為 Proposed → Chat 裁決後事實為 H10 Accepted (6c2a9a5) /
  H11 Draft (520e2a3)，補章保留作 rev1 軌跡 + abandoned 維度紀錄
- matrix add：Step 1 議題萃取裁決矩陣（C1-C5b 三維度評分依據）
- Q2 handoff add：D1-D4 工程驗證 handoff（待 Code 執行）
- rev2 deployment handoff archive：執行完成歸檔到 handoffs/done/

Per H8 §七 worklog 不追溯 + H10 §一 治理產出進 git 紀律 +
Paul 裁決 A2/B/D3 (2026-04-25 cleanup batch).
[影響: 治理框架]"
```

驗證：

```bash
git log --oneline -1
git show --stat HEAD | head -15
```

確認：

- 含 `worklog-2026-04-25-governance-exploration.md`（M）
- 含 `cowork--c-phase-issue-extraction-matrix-2026-04-25.md`（A）
- 含 `code--q2-d1-d4-engineering-verification-2026-04-25.md`（A）
- 含 `handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md`（A）

### Step 4 · ADR-INDEX 算術修正（單行 edit）

修改 `docs/governance/ADR-INDEX.md` 第 7 行：

```diff
-- **總數**：11 份（Accepted: 10 / Draft: 2）+ research-archive: 4 份研究稿（不計入 ADR）
+- **總數**：12 份（Accepted: 10 / Draft: 2）+ research-archive: 4 份研究稿（不計入 ADR）
```

**注意**：只改數字 11 → 12，其他文字保留原樣。

驗證：

```bash
grep -E '^- \*\*總數\*\*' docs/governance/ADR-INDEX.md
grep -cE '^\| (H[0-9]+|CON|SKL)' docs/governance/ADR-INDEX.md
ls docs/governance/adr-*.md docs/governance/_drafts/adr-*.md 2>/dev/null | wc -l
```

預期：

- 第一行：`- **總數**：12 份（Accepted: 10 / Draft: 2）+ research-archive: 4 份研究稿（不計入 ADR）`
- 第二行：`12`
- 第三行：`12`

三者一致 → 算術通過。

### Step 5 · Batch 4 commit（ADR-INDEX 算術修正）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add docs/governance/ADR-INDEX.md && \
git commit -m "docs(governance): fix ADR-INDEX total count arithmetic (11 -> 12)

ADR-INDEX header stated 'total: 11 份 (Accepted: 10 / Draft: 2)'.
10 + 2 = 12 not 11. Per Chat handoff §Task 5.1 字面 was 11，Cowork
rev2 嚴格依字面寫入。本 commit 修正為 12 對齊：
- 實際 ADR 檔案數: 12 (10 Accepted + 2 Draft)
- INDEX 表格行數: 12 (grep -cE pattern)
- ADR-INDEX 維護 SOP §3 三者一致

Per Paul ratification (2026-04-25 cleanup batch).
[影響: 治理框架]"
```

驗證：

```bash
git log --oneline -2
git show --stat HEAD | head -10
```

確認：

- 含 `ADR-INDEX.md`（M）
- diff 只有 `11` → `12` 一處改動

### Step 6 · push（兩個 commit 一起）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git push
```

push 完紀錄兩個 commit hash：

```bash
git log --format='%H %s' -2
```

把 hash-3（Batch 3 follow-up）與 hash-4（Batch 4 algorithm fix）記下來，§Step 7 Issue 同步要用。

### Step 7 · Issue #155 同步 comment（可選）

**前提**：本 step 預設 **執行**。如果 Paul 在 §6 裁決「不發 cleanup comment 太瑣碎」則跳過。

用 GitHub MCP `add_issue_comment`：

- repository owner: `zarqarwi`
- repository name: `paulkuo.tw`
- issue number: `155`
- body：見下方範本（替換 `<hash-3>` `<hash-4>`）

#### Issue comment 範本

```markdown
## (c) ADR 階段 rev2 後續清理（2026-04-25）

對應 rev2 deployment：commit `6c2a9a5` (Batch 1) + `520e2a3` (Batch 2)
本輪清理依 Paul 對 deployment handoff §5 五個未決事項的裁決執行。

### 本輪 commit

- **Batch 3 · `<hash-3>`**：(c) 階段 rev2 後續產物收尾
  - worklog 補章保留（A2，依 H8 §七 不追溯）
  - matrix add（Step 1 裁決依據）
  - Q2 handoff add（D1-D4 工程驗證待執行）
  - rev2 deployment handoff 歸檔到 handoffs/done/

- **Batch 4 · `<hash-4>`**：ADR-INDEX 算術修正（11 → 12）
  - 對齊 grep 結果 + 實際檔案數

### Paul 對 5 個未決事項的裁決

| 議題 | 裁決 | 本輪處置 |
|---|---|---|
| A. worklog 補章 | A2 commit 原貌 | ✅ Batch 3 |
| B. matrix + Q2 handoff | 順手進 git | ✅ Batch 3 |
| C. 歷史 4 份 untracked | 等 H7 lint Phase 2 觸發測試 | ⏸ 不動 |
| D. rev2 deployment handoff | D3 mv handoffs/done/ | ✅ Batch 3 |
| E. ADR-INDEX 算術 | 修正 11 → 12 | ✅ Batch 4 |

### 下一輪

- 觀察期至 2026-06-25 — 看 PENDING 觀察項目 8 是否觸發
- Q2 Code handoff 待執行（D1-D4 工程驗證）
- (b) 公開文章階段（時間沉澱後）
- C 議題：H7 lint Phase 2 實作後測試自動偵測歷史 4 份 untracked

---
產出者：Cowork session (Sonnet 4.6)，依 Paul 裁決執行
本輪 cleanup：Code session（依 handoff `code--c-phase-cleanup-2026-04-25.md`）
```

---

## 3. 完成標準

- [ ] Step 1 git status 與預期相符
- [ ] Step 2 rev2 handoff 已 mv 到 handoffs/done/
- [ ] Step 3 Batch 3 commit 完成（hash-3 已記）
- [ ] Step 4 ADR-INDEX 11 → 12（三項驗證皆通過）
- [ ] Step 5 Batch 4 commit 完成（hash-4 已記）
- [ ] Step 6 push 完成
- [ ] Step 7 Issue #155 comment 已發出（如執行）
- [ ] 歷史 4 份 untracked 仍 untracked（**不動**）
- [ ] 本 cleanup handoff 自己仍 untracked（**不動**）

---

## 4. 已知陷阱

1. **同 push batch 紀律**（H10 §二第一款）：Batch 3 + Batch 4 之間**不要** push，最後一起 push。即「commit/commit/push」順序
2. **commit history 順序**：Batch 3 必須先於 Batch 4，否則「本輪 follow-up」commit message 會引用尚未進 git 的 ADR-INDEX 修正
3. **Step 4 ADR-INDEX edit 邊界**：只改數字 11 → 12，不要動其他文字。grep 驗證 SOP 第 3 條是核心剛性核查，不能誤改
4. **Step 7 Issue comment 的 hash 占位符**：`<hash-3>` `<hash-4>` 必須替換成實際 commit hash 才發出去。可以用 `git log --format='%H' -2` 取最新兩個 hash（最頂端是 hash-4）
5. **mv handoff 不要 git mv**：rev2 handoff 是 untracked，git mv 會報錯；用 mv 然後在 Batch 3 add 新位置即可
6. **Batch 3 commit 含修改檔（M worklog）+ 新增檔（A matrix + Q2 handoff + 歸檔 rev2 handoff）**：git add 多檔同時可，但驗證時要看 git show --stat 確認 4 份都進去
7. **不要順手 add 歷史 4 份**：依 §1.2.1 不動。逐檔 add，不要 add `docs/governance/` 整個目錄

---

## 5. 執行完後等 Paul 裁決的事項

執行完 Step 1-7 後，**不要繼續做下面任何事**：

### A. 本 cleanup handoff 自己何時歸檔

預設 D1（留 untracked，下輪歸檔）。Paul 可選：

- **A1（預設）**：留 untracked，下輪 cleanup batch 一起歸檔到 handoffs/done/
- **A2**：跑完當下 mv 到 handoffs/done/ 並追加 commit（會擴大本輪邊界）
- **A3**：直接 rm（本 handoff 跑完歷史使命結束）—— 但這違反 H10 §一 治理產出進 git 紀律

### B. Q2 Code handoff 何時執行

`handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md` 已進 git，但內容（D1-D4 工程驗證）還沒跑。

由 Paul 排程，不在本 handoff 範圍。

### C. C 議題（歷史 4 份 untracked）何時清

依本 handoff §1.2.1，等 H7 lint Phase 2 實作後當測試 case。Paul 可調整時程，但本輪不處理。

---

## 6. 給 Code 的話

這份 handoff 跟 rev2 deployment handoff 同風格——純執行 spec，沒有 framing 判斷需求。所有「為什麼這樣做」的脈絡都已寫在：

- 上游 deployment handoff（`handoffs/done/code--c-phase-rev2-deployment-2026-04-25.md`，本輪 Step 2 完成後位置）
- Chat handoff（`/Users/apple/Library/Application Support/Claude/local-agent-mode-sessions/.../uploads/cowork--c-phase-chat-ratification-revisions-2026-04-25.md`）
- Cowork rev2 產物（已 commit `6c2a9a5` + `520e2a3`）

執行紀律（與 deployment handoff 一致）：

1. **嚴格按 §2 順序**——每一步驗證通過再進下一步
2. **任何 git status 預期外的狀態出現** → 停下回報 Paul
3. **任何驗證 fail** → 停下，**禁止** `git reset --hard` 或其他破壞性復原
4. **記得 push 是最後一步**——先兩個 commit，最後一起 push
5. **Issue comment 的 hash 替換不能漏**——發出去前 grep 確認沒有 `<hash-` 殘留
6. **執行完不主動處理 §5 任何項目**

memory `feedback_oneliner_for_paul_terminal` + 憲法第二條：commit/push 必須在 Paul 本機。Code 你就在本機 terminal，是合規執行者。

---

**handoff 產出者**：Cowork session (Sonnet 4.6)
**對應任務**：(c) ADR 階段 rev2 後續清理（A2 + B + D + E）
**下一步**：Paul 開 Code session，餵此 handoff 給 Code 執行

---

## Consequences

### 實際執行結果（Code session 2026-04-25）

- ✅ Step 1-7 全綠，依序完成
- ✅ Step 2 mv rev2 deployment handoff 到 handoffs/done/
- ✅ Batch 3 commit：`d94f27c`（worklog 補章保留 A2 + matrix add B + Q2 handoff add B + 歸檔 rev2 handoff D3）
- ✅ Step 4 ADR-INDEX 算術修正：11 → 12（三項驗證全通過：總數欄、INDEX 表格行、實際檔案）
- ✅ Batch 4 commit：`f748a57`（ADR-INDEX 單行 diff）
- ✅ push 成功
- ✅ Issue #155 dashboard 同步：[comment #4319823951](https://github.com/zarqarwi/paulkuo.tw/issues/155#issuecomment-4319823951)

### 對後續工作的影響

- §5.A 本 cleanup handoff 自身歸檔 → A1 default（留 untracked，下輪歸檔，本 cleanup-pass-2 範圍處理）
- §5.B Q2 Code handoff 執行時機 → Paul 同 session 排程（已執行 → 9bc60c5）
- §5.C 歷史 4 份 untracked → 等 H7 lint Phase 2（已被本 cleanup-pass-2 涵蓋為 96 份歷史 grandfather 一部分）

### 遵守紀律確認

- 憲法第二條：commit/push 走 Paul 本機 ✅
- 不動歷史 4 份 untracked（依 §1.2.1）✅
- 不修改 H10/H11 ADR 內容（依 §1.2 不重做）✅
- ADR-INDEX 算術修正僅單行 diff（依 §2 Step 4 邊界）✅

### 揭露的後續議題

- worklog 補章描述 H10/H11 起草為 Proposed，與 Chat 裁決後事實（Accepted/Draft）不同步——依 H8 §七 不追溯，commit 原貌保留作 rev1 軌跡紀錄
- 本 cleanup handoff 自身違反 H7 §第一條（缺 frontmatter status + Consequences 章節）——由 cleanup-pass-2 補規範（即本 commit 加入 frontmatter + 本章節之事件）
