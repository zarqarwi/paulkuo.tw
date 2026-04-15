# Handoff: 解決 stash@{0} autostash 衝突 + 三檔判讀

> 產出：Cowork / 2026-04-15 22:20 UTC+8  
> 收件：Code session  
> 建議模型：**Sonnet 4.6 / Low effort**（純 git 操作 + 文件判讀，不動程式邏輯）  
> 風險：活動期（4/15 第 4 天），但此任務只碰 git 狀態與文件，**零線上副作用**

---

## TL;DR

Paul 今天 21:xx 本機跑 `git pull` 時，autostash 被 pop 失敗留在 `stash@{0}`。Cowork 已推 commit [`b30913a`](https://github.com/zarqarwi/paulkuo.tw/commit/b30913a8684d0c8118b7e166d6459b4e33acb666) 把 worklog 衝突解掉。**你要做的是：pull → pop stash → 判斷其他三個檔案要不要 commit → 清理完確認 `git status` 乾淨。**

---

## 脈絡

### 發生什麼事

1. 今天上午 Code session 12:45 在本機寫了 worklog Issue #172 結案收尾（8 行），**還沒 commit**
2. 晚上 Paul `git pull` 拉進 Cowork 剛 push 的 commit [`2a85219`](https://github.com/zarqarwi/paulkuo.tw/commit/2a852194dd62d3ea56158273ef50df848098a524)（也動了同一個 worklog 檔案）
3. Git autostash 把本機未 commit 的改動存進 `stash@{0}`，fast-forward 後 pop 時衝突
4. Paul 的 working tree 被還原成「pull 後、stash 未 apply」的乾淨狀態；改動保留在 stash

### stash@{0} 內容（`git stash show --stat stash@{0}`）

| 檔案 | diff | 處理方向 |
|------|------|---------|
| `worklogs/worklog-2026-04-15.md` | +8 | ✅ 已由 Cowork commit [b30913a](https://github.com/zarqarwi/paulkuo.tw/commit/b30913a8684d0c8118b7e166d6459b4e33acb666) 補到 main。pop 時 git 應該自動 skip |
| `handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md` | +97 | ❓ 需判讀：是 Code 早上寫完 handoff 後的本機新版？還是已被涵蓋？ |
| `worklogs/governance/last-scan.json` | +9 −X | ❓ 通常是 governance scan 自動產物，可能需要 commit |
| `worklogs/wiki-ingest-pending.md` | +276 −124 | ❓ wiki 相關變更，看是否是 Code 本機寫入但未 push 的重要內容 |

### Cowork 已做

- Commit [`2a85219`](https://github.com/zarqarwi/paulkuo.tw/commit/2a852194dd62d3ea56158273ef50df848098a524)：worklog feedback triage + 決策紀錄（Issue #177/#178/#179 開票記錄）
- Commit [`b30913a`](https://github.com/zarqarwi/paulkuo.tw/commit/b30913a8684d0c8118b7e166d6459b4e33acb666)：worklog append Issue #172 結案收尾 段落（本機 stash 的那 8 行，原文一字不差）

---

## 你要做的事

### Step 1：確認狀態

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git pull  # 應該 fast-forward 到 b30913a，無 autostash 觸發（working tree 當前乾淨）
git status  # 預期：clean
git stash list  # 預期看到 stash@{0}: autostash 還在最上面
```

### Step 2：pop stash

```bash
git stash pop "stash@{0}"
```

**預期結果兩種：**

**A. 乾淨成功**（希望的情境）
- Git 對 worklog 做 3-way merge 時發現 stash 的改動已經存在於 main → skip
- 其他三個檔案乾淨 apply 到 working tree
- `git status` 顯示 3 個 modified（handoff / last-scan / wiki-ingest-pending）

**B. worklog 仍衝突**（次佳情境）
- 因為 Cowork 的 append 與 stash 的 append 位置雖等價但 git 不識別為同一改動
- 解法：
  ```bash
  # worklog 用 main 版（Cowork 已推的版本），捨棄 stash 的版本
  git checkout --ours worklogs/worklog-2026-04-15.md
  git add worklogs/worklog-2026-04-15.md
  # 其他三個檔案繼續照 Step 3 處理
  ```
- 語意相等（兩邊都包含那 8 行），所以用 --ours 不會丟資料

### Step 3：判讀三個剩下檔案

對每個檔案，跑 `git diff HEAD -- <file>` 看完整 diff，然後回答：

#### `handoffs/code--governance-dashboard-redesign-phase-a-2026-04-14.md`（+97 行）

- **判斷依據：** 這是你早上寫完 Phase A handoff 後本機繼續補充的內容嗎？還是已經 obsolete？
- **action：**
  - 若為有效補充（例如 Phase A 驗收結果、實際改動摘要）→ `git add` + commit
  - 若已被其他 handoff 或 worklog 涵蓋 → `git checkout -- <file>` 捨棄

#### `worklogs/governance/last-scan.json`（+9 −X）

- **判斷依據：** 這通常是 governance 自動掃描產物，有時間戳 + 結果
- **action：**
  - 若是最新的 scan 結果 → `git add` + commit（跟著 worklog 一起保留）
  - 若是舊的 scan 被新的蓋掉過 → `git checkout -- <file>` 捨棄

#### `worklogs/wiki-ingest-pending.md`（+276 −124）

- **判斷依據：** 這是 wiki 管線待處理清單，大幅改動可能代表你早上本機手動重整過
- **action：**
  - 若為有效重整 → `git add` + commit
  - 若已過時 → `git checkout -- <file>` 捨棄

### Step 4：commit + push

把要保留的檔案做一個 commit：

```bash
git commit -m "chore: 救回 4/15 本機未 push 的 handoff + wiki-ingest + last-scan 改動（autostash pop 恢復）"
git push origin main
```

### Step 5：清理

確認 `git status` clean 後：

```bash
git stash list  # 若 stash@{0} 已被 pop 掉、只剩更舊的 16 筆，不要清
```

⚠️ **不要自動 `git stash clear`**。stash@{1} 以下是 Paul 從 3/24 以來累積的長期暫存，清除前要先問 Paul，**活動後再整理**。

---

## 驗收

- [ ] `git status` clean
- [ ] `git stash list` 中 `stash@{0}: autostash`（今天這筆）已被移除
- [ ] main 上該有的改動（worklog / handoff / last-scan / wiki-ingest-pending）都在
- [ ] push 後 GitHub 上 commit 顯示正確

---

## 陷阱與提醒

- ⚠️ **活動期（4/15 第 4 天），不動線上程式碼**。這個任務只碰文件，沒部署風險
- ⚠️ **不要 `git stash clear`**。Paul 有 17 筆 stash 歷史累積，這是活動後 backlog
- ⚠️ **cron 排程：週一到五 14:10**。今天已過，晚上你處理時不會被 cron 覆蓋（但仍建議 commit + push 原子操作，參 4/03 事故教訓）
- ⚠️ 若 pop 時發現**其他未預期檔案**也跑出來 → **停下來問 Paul**，不要自作主張丟掉

---

## 結果回報

完成後請更新 `worklogs/worklog-2026-04-15.md`，在 `## 完成日誌（最新在上）` 加一條：

```
- HH:MM chore: stash@{0} autostash pop + 三檔判讀完成（commit SHA），stash list 已清除今日那筆 Code
```

然後 commit + push。
