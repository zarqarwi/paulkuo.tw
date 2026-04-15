# Handoff: 解決 stash@{0} autostash 衝突 + 三檔判讀

> 產出：Cowork / 2026-04-15 22:20 UTC+8（v1）→ **22:30 UTC+8（v2 真實狀態更新）**  
> 收件：Code session  
> 建議模型：**Sonnet 4.6 / Low effort**（純 git 操作 + 文件判讀，不動程式邏輯）  
> 風險：活動期（4/15 第 4 天），但此任務只碰 git 狀態與文件，**零線上副作用**

---

## ⚠️ 重要：你不能直接 `git pull`

Paul 本機 working tree 目前有 **unmerged paths**，跑 `git pull` 會被拒絕。你必須**先解衝突 + commit**，才能 pull。

也因此你讀這份 handoff 時**不要先 git pull**，用 `git fetch` + 從 remote 讀：

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git fetch origin main
# 確認你讀到的是最新版（v2 應該包含「## 實際狀態」這節）
git show origin/main:handoffs/code--stash-conflict-resolution-2026-04-15.md | cat | head -10
```

---

## TL;DR

Paul 今天 21:xx `git pull` 觸發 autostash pop，**大部分檔案已經乾淨 apply 回來**，只有兩個檔案 conflict：

- `worklogs/worklog-2026-04-15.md`（unmerged）— **取 --ours，fast-forward 後會補齊**
- `worklogs/governance/last-scan.json`（unmerged）— **需要判讀**

另有兩個 staged 檔案 + 15 個 untracked 檔案都是有效的本機產出，該保留。

---

## 實際狀態（`git status` 結果）

```
Staged (add 但未 commit):
  modified:   handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md
  modified:   worklogs/wiki-ingest-pending.md

Unmerged (conflict markers):
  both modified:  worklogs/governance/last-scan.json
  both modified:  worklogs/worklog-2026-04-15.md

Untracked (本機新產物，從未 commit):
  gsc-report-2026-04-15.md
  src/content/wiki/raw/clips/2026-04-15-*.md (9 個外部 clip)
  src/content/wiki/sources/youtube-*.md (4 個 youtube source)
  worklogs/impact-scan-2026-04-15.md
  worklogs/wiki-web-pending-2026-04-15.md
```

**脈絡：** 這些檔案都來自 stash@{0}（今天 autostash 產生），pop 時 staged/untracked 部分乾淨 apply，只有兩個檔案有 3-way merge 衝突。

---

## Remote 上已有什麼（Cowork 今天推的）

| Commit | 內容 |
|--------|------|
| [`2a85219`](https://github.com/zarqarwi/paulkuo.tw/commit/2a852194dd62d3ea56158273ef50df848098a524) | worklog feedback triage + 決策（已 pull） |
| [`b30913a`](https://github.com/zarqarwi/paulkuo.tw/commit/b30913a8684d0c8118b7e166d6459b4e33acb666) | worklog append Issue #172 結案收尾 8 行（救回 Code 本機 stash 內容，**未 pull**） |
| [`c55ddfa`](https://github.com/zarqarwi/paulkuo.tw/commit/c55ddfa3be87596e45446c3b56cb3b0092cddc06) | 本 handoff v1（**未 pull**） |
| 本 commit (v2) | 本 handoff v2 |

---

## 你要做的事（精確步驟）

### Step 1：準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git fetch origin main  # 不 pull，只更新 remote 快照
git status  # 再確認一次當前狀態
```

### Step 2：解 worklog-2026-04-15.md 衝突

**決定：取 --ours（HEAD = 2a85219 的版本，沒有 Code 的 8 行）**

為什麼：remote 上 `b30913a` 已經把那 8 行加進去了，等會 rebase/merge pull 進來時會自動補齊。

```bash
git checkout --ours worklogs/worklog-2026-04-15.md
git add worklogs/worklog-2026-04-15.md
```

### Step 3：解 governance/last-scan.json 衝突

先看 diff 判斷：

```bash
git diff worklogs/governance/last-scan.json
```

**判斷原則（按 JSON 內容挑）：**

- 這是 governance 掃描結果的自動產物，通常只有一份最新的有意義
- 若 conflict 兩邊差異**主要是 timestamp 與掃描結果**：
  - **取時間戳較新的那一版**（stash 版 = Code 本機掃描 / HEAD 版 = Cowork pull 前的狀態，通常 stash 版較新）
  - 用 `git checkout --theirs worklogs/governance/last-scan.json` 取 stash 版
- 若 conflict 看起來是 schema 改動（欄位新增/移除）→ 停下來問 Paul

```bash
# 預期做法：
git checkout --theirs worklogs/governance/last-scan.json
git add worklogs/governance/last-scan.json
```

### Step 4：確認衝突都解了 + commit 當前 working tree

```bash
git status  # 預期：staged = 4 個檔案 + 15 個 untracked
```

把 untracked 也 add 進來（都是今天的有效產物：wiki clips / sources / gsc-report / impact-scan / wiki-web-pending）：

```bash
git add \
  gsc-report-2026-04-15.md \
  src/content/wiki/raw/clips/2026-04-15-*.md \
  src/content/wiki/sources/youtube-*.md \
  worklogs/impact-scan-2026-04-15.md \
  worklogs/wiki-web-pending-2026-04-15.md
```

然後 commit：

```bash
git commit -m "chore(recover): 救回 4/15 本機 autostash pop 衝突內容 — 4 檔 modified + 15 檔 untracked（wiki/governance/gsc 管線產物）"
```

### Step 5：rebase pull 把 remote 的 b30913a + c55ddfa + v2 handoff 拉進來

```bash
git pull --rebase origin main
```

**預期衝突：** `worklogs/worklog-2026-04-15.md` — 因為 remote 的 b30913a 加了 8 行，你 Step 2 選的 --ours 沒有。

解衝突：
```bash
# 用 remote 版本（b30913a 的，含 8 行）
git checkout --theirs worklogs/worklog-2026-04-15.md  # rebase 語境下 --theirs = 上游版本
# 或手動編輯，保留兩邊的內容（兩邊的文字應該是互補的）
git add worklogs/worklog-2026-04-15.md
git rebase --continue
```

⚠️ **注意：rebase 時 --ours/--theirs 語義跟 merge/stash 反過來：**
- rebase 時 `--ours` = 上游（被 rebase 到的 branch，也就是 origin/main）
- rebase 時 `--theirs` = 當前分支（你正在 rebase 的 commit）
- 所以要取 remote 版用 `--ours`（對，違反直覺）

實際寫：
```bash
git checkout --ours worklogs/worklog-2026-04-15.md   # rebase: --ours = origin/main 的版本（含 8 行）
git add worklogs/worklog-2026-04-15.md
git rebase --continue
```

### Step 6：push

```bash
git push origin main
```

### Step 7：確認 stash 被 drop

```bash
git stash list  # 應該少掉最上面那筆 autostash；剩下 16 筆是 Paul 長期堆積，不要動
git status  # 應該 clean
```

---

## 驗收

- [ ] `git status` clean
- [ ] `git stash list` 中今天的 `stash@{0}: autostash` 已被 pop 且 drop（list 第一筆不再是今天的 autostash）
- [ ] main 上保留了所有有效改動：worklog / last-scan / handoff / wiki-ingest / 15 個 untracked
- [ ] remote push 成功
- [ ] 打開 `worklogs/worklog-2026-04-15.md` 檢查末尾有 Issue #172 結案收尾 8 行

---

## 陷阱與提醒

- ⚠️ **活動期（4/15 第 4 天），不動線上程式碼**。這個任務只碰文件，沒部署風險
- ⚠️ **不要 `git stash clear`**。Paul 有 17 筆 stash 歷史累積，這是活動後 backlog
- ⚠️ **cron 排程：週一到五 14:10**。今天已過，晚上你處理時不會被 cron 覆蓋
- ⚠️ **rebase 衝突解決時 --ours/--theirs 語義反直覺**（見 Step 5）
- ⚠️ 若 Step 3 看 last-scan.json diff 後**看不懂 schema 改動** → **停下來問 Paul**
- ⚠️ 若 Step 4 發現 15 個 untracked 裡有你**不認得**的檔案 → 先 `cat` 看內容再決定

---

## 結果回報

完成後請更新 `worklogs/worklog-2026-04-15.md`，在 `## 完成日誌（最新在上）` 最上面加一條：

```
- HH:MM chore(recover): autostash pop 衝突處理完成（commit SHA），stash list 清除今日那筆 Code
```

然後 commit + push。

如果過程中有任何異常（例如 Step 5 rebase 跑出你預期外的衝突、或 Step 3 last-scan.json 看不懂），**停手回報給 Paul**，不要硬做。
