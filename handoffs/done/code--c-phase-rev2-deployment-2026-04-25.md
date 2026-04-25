# Code Handoff · (c) ADR 階段 rev2 部署落地

- **產出時間**：2026-04-25
- **產出者**：Cowork session（Sonnet 4.6）
- **目標 session**：Code（建議 Sonnet 4.6）
- **任務類型**：執行 commit + push + 桌面 mv + Issue #155 同步
- **Status**：Ready for execution
- **上游 handoff**：
  - `cowork--c-phase-adr-drafting-2026-04-25`（原始 (c) 階段 handoff，Chat 起草）
  - `cowork--c-phase-chat-ratification-revisions-2026-04-25.md`（Chat 對 Cowork rev1 產出的裁決後修訂指示）

---

## 0. 開頭警示

**本 handoff 純執行，不做判斷。**

所有檔案內容已由 Cowork 依 Chat 裁決修訂完成。Code 的工作只有：

1. 把已修訂好的檔案 commit（兩個 batch）
2. push
3. 把 zip + session report mv 到 Paul 桌面
4. Issue #155 dashboard 同步 comment

**禁止**：

- 修改任何檔案內容
- 加 ADR、改 ADR、撤回 ADR
- 寫 framing 報告
- 替 Paul 裁決他應該裁決的事項（見 §5）

---

## 1. 任務範圍

### 1.1 必做（依序）

| Step | 動作 | 工具 |
|---|---|---|
| 1 | 前置檢查（git status、index.lock、commit history） | bash |
| 2 | Batch 1 commit（H10 + research-archive） | bash |
| 3 | Batch 2 commit（H11 + _drafts + PENDING 觀察項目 8） | bash |
| 4 | push | bash |
| 5 | mv zip + session report 到 ~/Desktop/ | bash |
| 6 | Issue #155 dashboard 同步 comment | GitHub MCP |

### 1.2 不做

依 Chat handoff §6 紀律：

1. **不動** `worklogs/worklog-2026-04-25-governance-exploration.md` modified 狀態（Paul 待裁決，見 §5）
2. **不動** `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md`（前一輪產出，Chat handoff §6.4 不動）
3. **不動** `handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md`（前一輪 Q2 handoff，仍有效）
4. **不動** `docs/governance/` 下 4 份歷史 untracked（與本批次無關，建議下輪獨立清理）
5. **不修改** 本 handoff 自己 add 的指示（不打算進 commit；如要進 git，由你下一輪 handoff 處理）

---

## 2. 詳細步驟

### Step 1 · 前置檢查

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git status --short docs/governance/ worklogs/ handoffs/ && \
echo "---" && \
git log --oneline -3
```

**預期 git status**（差一行就停下回報）：

```
 M docs/governance/ADR-INDEX.md
 M worklogs/PENDING.md
 M worklogs/worklog-2026-04-25-governance-exploration.md
?? docs/governance/_drafts/
?? docs/governance/adr-governance-research-git-discipline-2026-04-25.md
?? docs/governance/code--paulkuo-tw-adr-index-and-branch-protection-audit-2026-04-25.md
?? docs/governance/code--pending-md-h1-h9-ratification-2026-04-24.md
?? docs/governance/cowork--adr-drafting-h1-h9-2026-04-24.md
?? docs/governance/cowork--archive-h1-h9-handoff-2026-04-25.md
?? docs/governance/research-archive/
?? handoffs/code--c-phase-rev2-deployment-2026-04-25.md   ← 本 handoff 自己
?? handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md
?? worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md
```

**預期 git log 最頂端**：`988d685 docs(worklog): governance exploration phase (a) ...`（或類似訊息）

**判斷**：

- ✅ 若最頂端 = `988d685` → 前一輪 oneliner Paul 沒跑，可以照本 handoff 執行
- 🛑 若最頂端 ≠ `988d685`（已有 H10/H11 相關 commit）→ **停止執行**，回報 Paul「rev1 已 commit，需要 amend/rebase 處理」

### Step 1.5 · `.git/index.lock` 處理

如果 git status 報「unable to unlink .git/index.lock」或卡住：

```bash
rm -f ~/Desktop/01_專案進行中/paulkuo.tw/.git/index.lock
```

理由：sandbox session（Cowork）寫的 lock 用 sandbox uid，Paul 本機 / Code session 用 Paul uid，sandbox 沒權限刪。Code 在本機 terminal 跑有權限。

### Step 2 · Batch 1 commit（H10 升 Accepted + research-archive）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add docs/governance/adr-governance-research-git-discipline-2026-04-25.md \
        docs/governance/research-archive/ \
        docs/governance/ADR-INDEX.md && \
git commit -m "docs(governance): H10 ratified Accepted + archive 4 research reports

- H10 status: Proposed -> Accepted (ratified by Chat-Opus-4.7)
- H10 fourth clause revised: research reports go to research-archive/ subdirectory
- Move 4 untracked governance research reports to research-archive/
- Add research-archive/README.md (research material disclaimer)
- ADR-INDEX updated: H10 Accepted, total 11 ADRs + 4 research material

Per H10 second clause same-batch discipline + Q1 Paul ratification (2026-04-25).
[影響: 治理框架]"
```

驗證：

```bash
git log --oneline -1
git show --stat HEAD | head -20
```

確認：

- 含 `adr-governance-research-git-discipline-2026-04-25.md`（M 或 A）
- 含 `research-archive/README.md`（A）
- 含 `research-archive/research-governance-gaps-vs-industry-2026-04-25.md` × 3 + `code--research-governance-gaps-v2-engineering-feedback-2026-04-25.md`（A）
- 含 `ADR-INDEX.md`（M）

### Step 3 · Batch 2 commit（H11 降 Draft + _drafts + PENDING 觀察項目 8）

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && \
git add docs/governance/_drafts/ \
        worklogs/PENDING.md && \
git commit -m "docs(governance): H11 demoted to Draft, observation period until 2026-06-25

- H11 status: Proposed -> Draft
- H11 moved to _drafts/ (not current governance rule)
- Add _drafts/README.md (draft area disclaimer)
- PENDING.md observation item 8: cross-session discipline migration gap

Per Chat ratification (2026-04-25): H11 has self-serving risk and
solves an unverified problem. Two-month observation before deciding
Accepted or Reject. Existing memory feedback_reject_symptomatic_
workflow_suggestions remains the operative rule during observation.
[影響: 治理框架]"
```

驗證：

```bash
git log --oneline -2
git show --stat HEAD | head -10
```

確認：

- 含 `_drafts/README.md`（A）
- 含 `_drafts/adr-zero-legislation-as-valid-outcome-2026-04-25.md`（A）
- 含 `PENDING.md`（M）

### Step 4 · push

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git push
```

push 完紀錄兩個 commit hash：

```bash
git log --format='%H %s' -2
```

把 hash-1（H10 batch）與 hash-2（H11 batch）記下來，§6 Issue 同步要用。

### Step 5 · 桌面 mv

```bash
mv ~/Desktop/01_專案進行中/paulkuo.tw/cowork-c-phase-bundle-2026-04-25-rev2.zip \
   ~/Desktop/01_專案進行中/paulkuo.tw/cowork-c-phase-session-report-2026-04-25.md \
   ~/Desktop/
```

驗證：

```bash
ls -la ~/Desktop/cowork-c-phase-bundle-2026-04-25-rev2.zip ~/Desktop/cowork-c-phase-session-report-2026-04-25.md
```

確認兩份檔在桌面、原 paulkuo.tw 工作目錄已不見。

### Step 6 · Issue #155 dashboard 同步

用 GitHub MCP `add_issue_comment`：

- repository owner: `zarqarwi`
- repository name: `paulkuo.tw`
- issue number: `155`
- body：見下方範本（記得替換 `<hash-1>` `<hash-2>` 為 §4 取得的實際 commit hash）

#### Issue comment 範本

```markdown
## (c) ADR 階段 Chat 裁決後的修訂執行（2026-04-25）

對應 (a) 階段事實重建：commit `988d685`
本輪修訂依 Chat handoff `cowork--c-phase-chat-ratification-revisions-2026-04-25.md` 執行。

### 裁決結果

| ADR | Cowork 起草狀態 | Chat 裁決 |
|---|---|---|
| H10 治理研究報告的 git 紀律 | Proposed | ✅ Accepted（小修第四條：研究報告移 research-archive/ 子目錄） |
| H11 立法零產量是合法收尾 | Proposed | ⚠️ Draft，移 _drafts/，觀察期至 2026-06-25 |

### 本輪 commit（兩個 batch）

- **Batch 1 · `<hash-1>`**：H10 升 Accepted + 4 份治理研究報告移 research-archive/ + 子目錄 README
- **Batch 2 · `<hash-2>`**：H11 降 Draft 移 _drafts/ + 子目錄 README + PENDING 觀察項目 8（跨 session 紀律遷移落差）

### 本次裁決示範

「兩個月觀察期 + frontmatter trigger 條件」是 v2.1 提的精神具體落地——對 self-serving 風險中等、解的問題未驗證的 ADR 候選，採「降 Draft 觀察」處置，避免修辭遷移風險，等實證決定升 Accepted 或 Reject。

### 下一輪

- 觀察期至 2026-06-25 — 看 PENDING 觀察項目 8 是否觸發
- Q2 Code handoff 仍待執行（D1-D4 工程驗證）
- (b) 公開文章階段（時間沉澱後）

---
產出者：Cowork session (Sonnet 4.6)，依 Chat-Opus-4.7 裁決執行
本輪部署：Code session（依 handoff `code--c-phase-rev2-deployment-2026-04-25.md`）
```

---

## 3. 完成標準

- [ ] Step 1 git status 與預期相符
- [ ] Step 1.5 .git/index.lock 已處理（如有）
- [ ] Step 2 Batch 1 commit 完成（hash-1 已記）
- [ ] Step 3 Batch 2 commit 完成（hash-2 已記）
- [ ] Step 4 push 完成
- [ ] Step 5 zip + session report 已搬桌面
- [ ] Step 6 Issue #155 comment 已發出（記得替換 hash 占位符）
- [ ] worklog modified 狀態原樣保留（**不動**）
- [ ] matrix + Q2 handoff 仍 untracked（**不動**）
- [ ] 4 份歷史 untracked 仍 untracked（**不動**）

---

## 4. 已知陷阱

1. **`.git/index.lock` 殘留**：sandbox uid ≠ 本機 uid 造成。Code 在本機 terminal 有權限刪，rm 即可（見 §1.5）
2. **commit history 順序**：Batch 1 必須先於 Batch 2，否則 H11 _drafts/ 會被 H10 §四 commit message 引用但實際還沒進 git
3. **同 push batch 紀律**（H10 §二第一款）：Batch 1 + Batch 2 之間**不要** push，最後一起 push。即「commit/commit/push」順序，不是「commit/push/commit/push」
4. **Issue comment 的 hash 占位符**：`<hash-1>` `<hash-2>` 必須替換成實際 commit hash 才發出去。可以用 `git log --format='%H' -2` 取最新兩個 hash（最頂端是 hash-2）
5. **桌面 mv 路徑**：路徑含「01_專案進行中」中文字符，shell 必須用引號或 escape。Code 在本機跑用 mv ~/Desktop/01_專案進行中/... 通常 OK，但若 fail 改用絕對路徑帶引號
6. **歷史 4 份 untracked 千萬不要 add**：依 §1.2.4 不動。如果 `git add docs/governance/` 整個目錄會誤抓——所以要逐檔 add，不要 add 整個 governance/ 目錄

---

## 5. 執行完後等 Paul 裁決的事項

執行完 Step 1-6 後，**不要繼續做下面任何事**，直接回報 Paul 並等他裁決：

### A. worklog 補章三選一

`worklogs/worklog-2026-04-25-governance-exploration.md` 仍 modified。

前一輪 Cowork 加的 (c) 補章描述「H10/H11 起草為 Proposed」，Chat 裁決後事實已是「H10 Accepted / H11 Draft」。補章內容過時。

請 Paul 三選一：

- **A1. 撤銷補章**：`git checkout worklogs/worklog-2026-04-25-governance-exploration.md`（最乾淨，補章內容被本輪兩個 commit 取代）
- **A2. 先 commit 原貌**：commit message 標明「補章為 Cowork 起草階段事實，Chat 裁決後另列在 commit hash-1/hash-2」
- **A3. 補章內容更新對齊本輪事實後再 commit**（這是 framing 級修改，Code 不應自做，需要 Paul 開新 handoff）

### B. matrix + Q2 handoff 何時進 git

兩份 untracked 檔：

- `worklogs/cowork--c-phase-issue-extraction-matrix-2026-04-25.md`
- `handoffs/code--q2-d1-d4-engineering-verification-2026-04-25.md`

Chat handoff §6.4-6.5 不動，本 handoff 不動。下輪 handoff 處理時機需要 Paul 決定。

### C. 歷史 4 份 untracked 何時清

`docs/governance/` 下 4 份 H1-H9 時期 handoff（與本批次無關），建議獨立 batch 清理。

### D. 本 handoff 自己（`code--c-phase-rev2-deployment-2026-04-25.md`）何時進 git

本 handoff 屬「驅動本批次 commit」的指示書。Code 跑完後可選：

- D1. 留 untracked，下輪歸檔（連同 Q2 handoff 一起進 `handoffs/done/`）
- D2. 跑完當下 add 進「Batch 2 補丁 commit」（但會擴大 §1.2 邊界）
- D3. 直接 mv 到 `handoffs/done/`，跟其他歸檔 handoff 並列

預設：**D1 留 untracked**，等下輪 handoff 一起歸檔。

### E. ADR-INDEX 表頭算術

Chat handoff §Task 5.1 字面寫「總數 11 份（Accepted: 10 / Draft: 2）」。10+2=12 不是 11，但 Cowork 嚴格依 handoff 字面寫了 11。

下輪 handoff 修正？或維持字面？需要 Paul 裁決。

---

## 6. 給 Code 的話

這份 handoff 是純執行 spec，沒有 framing 判斷需求。所有「為什麼這樣做」的脈絡都已寫在 Chat handoff（`cowork--c-phase-chat-ratification-revisions-2026-04-25.md`）+ Cowork rev2 產物中。

執行紀律：

1. **嚴格按 §2 順序**——每一步驗證通過再進下一步
2. **任何 git status 預期外的狀態出現** → 停下來回報 Paul，不要自己解
3. **任何驗證 fail** → 停下來，**禁止** `git reset --hard` 或其他破壞性復原
4. **記得 push 是最後一步**——先 commit 兩個 batch，最後一起 push（§4.3）
5. **Issue comment 的 hash 替換不能漏**——發出去前 grep 確認沒有 `<hash-` 字串殘留
6. **執行完不主動處理 §5 任何項目**——Paul 自己裁決

memory `feedback_oneliner_for_paul_terminal` + 憲法第二條精神：commit/push 必須在 Paul 本機。Code 你就在本機 terminal，是合規執行者。但這不代表你可以自由發揮——本 handoff 範圍內動作而已。

---

**handoff 產出者**：Cowork session (Sonnet 4.6)
**對應任務**：(c) ADR 階段 rev2 部署落地
**下一步**：Paul 開 Code session，餵此 handoff 給 Code 執行
