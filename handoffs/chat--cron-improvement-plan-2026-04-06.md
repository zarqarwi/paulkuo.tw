# Handoff: Cron 系統改善 5 項

**來源：** Chat session 2026-04-06（cron 清查 + 統計報告整理）
**目標 session：** Cowork / Code
**日期：** 2026-04-06

---

## 背景

Chat session 完成了 paulkuo.tw repo 的 cron 全面清查，發現 `auto_update_data.sh` 每 10 分鐘跑一次是開發干擾的主因。Paul 決定只在收盤時跑一次，crontab 已由 Chat 直接改完（`*/10 * * * *` → `10 14 * * 1-5`）。以下是剩餘 5 項改善，需要 Cowork/Code 執行。

---

## 任務清單（按優先級排序）

### Task 1 🔴 高優先 — 刪掉 repo 裡的統計報告

**問題：** `paulkuo-tw-code-stats-2026-04-03-to-06.md` 存在 `paulkuo.tw/` repo 根目錄，會被 git 偵測到。副本已在 `02_參考資料/`，repo 裡那份要刪。

**步驟：**
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
rm paulkuo-tw-code-stats-2026-04-03-to-06.md
git status  # 確認 untracked 消失
```

**驗證：** `ls paulkuo.tw/paulkuo-tw-code-stats-*` 應該 no such file。

---

### Task 2 🟡 中優先 — auto_update_data.sh 移除 autostash fallback

**問題：** push 失敗時跑 `git pull --rebase --autostash`，如果 Code session 正好有 uncommitted 改動，autostash pop 可能產生 merge conflict。頻率降為一天一次後風險已降低，但要根治。

**Step 0 偵察：**
```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
grep -n 'autostash\|pull.*rebase' scripts/auto_update_data.sh
```

**修改：** 找到 push 失敗的 fallback 區塊（約第 93-100 行），改成失敗就撤銷 commit、下次再推：

```bash
# 改前：
if ! git push origin main >> "$LOG" 2>&1; then
    log "WARN: push rejected, pulling rebase with autostash..."
    git pull --rebase --autostash origin main >> "$LOG" 2>&1
    if git push origin main >> "$LOG" 2>&1; then
        log "✅ Pushed (after rebase)"
        echo "$NOW_EPOCH" > "$LAST_PUSH_FILE"
    else
        log "ERROR: push failed even after rebase"
    fi

# 改後：
if ! git push origin main >> "$LOG" 2>&1; then
    log "WARN: push rejected, reverting commit — will retry next run"
    git reset HEAD~1 >> "$LOG" 2>&1  # 撤銷 commit，data 檔保留在 working tree
```

**驗證：** `grep -c 'autostash' scripts/auto_update_data.sh` 應回 0。

**注意事項：** 改完後更新腳本開頭的版本註解為 v8，記錄這次改動原因。

---

### Task 3 🟡 中優先 — backup-d1.sh 備份路徑搬到 repo 外

**問題：** Formosa D1 備份 JSON 寫到 `paulkuo.tw/backups/`，在 repo 工作目錄內。目前安全（v7 只 add `data/`），但如果未來任何操作跑了 `git add -A`，備份 JSON 就會被 commit。

**Step 0 偵察：**
```bash
grep -n 'BACKUP_DIR' ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh
ls ~/Desktop/01_專案進行中/paulkuo.tw/backups/
```

**修改 `scripts/backup-d1.sh`：**
```bash
# 改前
BACKUP_DIR="$HOME/Desktop/01_專案進行中/paulkuo.tw/backups"

# 改後
BACKUP_DIR="$HOME/Desktop/02_參考資料/backups/formosa-d1"
```

**修改 crontab（log 路徑也要更新）：**
```bash
# 改前
0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/01_專案進行中/paulkuo.tw/backups/backup.log 2>&1

# 改後
0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/02_參考資料/backups/formosa-d1/backup.log 2>&1
```

**驗證：**
```bash
mkdir -p ~/Desktop/02_參考資料/backups/formosa-d1  # 確保目標資料夾存在
grep 'BACKUP_DIR' scripts/backup-d1.sh  # 確認路徑改了
crontab -l | grep backup-d1  # 確認 crontab log 路徑改了
```

---

### Task 4 🟢 低優先 — backup_catchup.sh 降頻

**問題：** 每 30 分鐘跑一次補跑檢查，GDrive 腳本 iCloud timeout 導致反覆失敗嘗試。

**修改 crontab：**
```bash
# 改前
*/30 * * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_catchup.sh

# 改後
0 9,15 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_catchup.sh
```

**執行方式：** `crontab -e` 直接改。

**驗證：** `crontab -l | grep catchup` 確認為 `0 9,15`。

---

### Task 5 🟢 低優先 — GDrive 腳本 iCloud 離線 timeout

**問題：** `daily_backup_to_gdrive.sh` 和 `desktop_to_gdrive_sync.sh` 被 iCloud 清出本機，每次 cron 執行 timeout。

**建議（二擇一）：**

A. 在 Finder 裡對這兩個 .sh 右鍵 →「Download Now」釘選到本機（Paul 手動操作）

B. 搬到不受 iCloud 管理的路徑（例如 `~/.local/scripts/`），然後更新 crontab：
```bash
mkdir -p ~/.local/scripts
cp ~/Desktop/02_參考資料/daily_backup_to_gdrive.sh ~/.local/scripts/
cp ~/Desktop/02_參考資料/desktop_to_gdrive_sync.sh ~/.local/scripts/
# 更新 crontab 路徑
```

**驗證：** 搬完後 `cat ~/.local/scripts/daily_backup_to_gdrive.sh | head -5` 能正常讀取，不 timeout。

---

## 修改後的 crontab 預期最終狀態

```
10 14 * * 1-5  auto_update_data.sh          ✅ 已改完
0 12 * * *     backup_cloudflare.sh          不動
0 22 * * *     backup_cloudflare.sh          不動
0 2 * * *      daily_backup_to_gdrive.sh     ← Task 5 改路徑
0 8 * * *      desktop_to_gdrive_sync.sh     ← Task 5 改路徑
0 9,15 * * *   backup_catchup.sh             ← Task 4 降頻
0 23 * * *     sync_notes.py                 不動
0 3 * * *      backup-d1.sh                  ← Task 3 改 log 路徑
```

---

## 回報格式

完成後請在 worklog 記錄：
```
- {HH:MM} cron 改善 Task {N}: {一句話描述} Cowork/Code
```
