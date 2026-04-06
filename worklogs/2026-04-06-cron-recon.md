# Cron 偵察報告 2026-04-06

## Task 1: stats 檔案
- 存在/不存在：**存在** — `paulkuo-tw-code-stats-2026-04-03-to-06.md`（6657 bytes, 2026-04-06 20:21）
- tracked/untracked：**untracked**（`git status` 顯示 `??`）
- .gitignore 排除：**無** — `.gitignore` 沒有任何 stats 相關 pattern

## Task 2: auto_update_data.sh
- 版本：**v7**（「auto_update_data.sh v7 — Timing + Stock only」）
- autostash 行號：**L136-137**
  - L136: `log "WARN: push rejected, pulling rebase with autostash..."`
  - L137: `git pull --rebase --autostash origin main >> "$LOG" 2>&1`
- 完整 fallback 邏輯：
```bash
if ! git push origin main >> "$LOG" 2>&1; then
    log "WARN: push rejected, pulling rebase with autostash..."
    git pull --rebase --autostash origin main >> "$LOG" 2>&1
    if git push origin main >> "$LOG" 2>&1; then
        log "✅ Pushed (after rebase)"
        echo "$NOW_EPOCH" > "$LAST_PUSH_FILE"
    else
        log "ERROR: push failed even after rebase"
    fi
else
    log "✅ Pushed"
    echo "$NOW_EPOCH" > "$LAST_PUSH_FILE"
fi
```
- 已存在的 `git reset` 邏輯：**無**
- crontab 排程：`10 14 * * 1-5`（週一到五 14:10，已從 `*/10` 改完）

## Task 3: backup-d1.sh
- BACKUP_DIR：`$HOME/Desktop/01_專案進行中/paulkuo.tw/backups`（L7）
- backups/ 內容：**目錄不存在**（腳本會 `mkdir -p`，但從未執行過或已被刪）
- .gitignore 排除：**無** — `.gitignore` 沒有 `backups/` pattern（只有不相關的 `paulkuo_backup.html` 和 `worker/backup-2026-03-30.sql`）
- crontab 行：`0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/01_專案進行中/paulkuo.tw/backups/backup.log 2>&1`

## Task 4: backup_catchup.sh
- crontab 頻率：**`*/30 * * * *`**（每 30 分鐘，未改）
- 腳本功能摘要：wake/login 時檢查當天備份是否已執行，未執行則補跑。分別判斷 `daily_backup_to_gdrive.sh`（檢查 `.backup_log.txt` 有無當日 "Done"）和 `desktop_to_gdrive_sync.sh`（檢查 `sync_log.txt` 有無當日 "同步完成"）。

## Task 5: GDrive 腳本
- daily_backup_to_gdrive.sh 狀態：**可讀** — 654 bytes, 本機存在, Bourne-Again shell script
- desktop_to_gdrive_sync.sh 狀態：**可讀** — 1082 bytes, 本機存在, Bourne-Again shell script
- ⚠️ Chat handoff 說「被 iCloud 清出本機」但**實測兩個檔案都能正常讀取**，目前並未被 evict
- crontab 行：
  - `0 2 * * * /bin/bash /Users/apple/Desktop/02_參考資料/daily_backup_to_gdrive.sh`
  - `0 8 * * * /bin/bash /Users/apple/Desktop/02_參考資料/desktop_to_gdrive_sync.sh`

## 完整 crontab 快照
```
10 14 * * 1-5 /bin/bash /Users/apple/Desktop/01_專案進行中/paulkuo.tw/scripts/auto_update_data.sh
0 12 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_cloudflare.sh
0 22 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_cloudflare.sh
0 2 * * * /bin/bash /Users/apple/Desktop/02_參考資料/daily_backup_to_gdrive.sh
0 8 * * * /bin/bash /Users/apple/Desktop/02_參考資料/desktop_to_gdrive_sync.sh
*/30 * * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_catchup.sh
0 23 * * * /usr/bin/python3 /Users/apple/Desktop/01_專案進行中/get_筆記/sync_notes.py >> /Users/apple/Desktop/01_專案進行中/get_筆記/sync.log 2>&1
0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/01_專案進行中/paulkuo.tw/backups/backup.log 2>&1
```

## 與 Chat handoff 比對

### 一致
- ✅ Task 1：stats 檔案確實存在、untracked、需刪除
- ✅ Task 2：autostash fallback 確實在 L136-137，邏輯與 handoff 描述一致，無既有 `git reset`
- ✅ Task 3：BACKUP_DIR 確實在 repo 內，`.gitignore` 沒有排除 `backups/`
- ✅ Task 4：catchup 確實 `*/30`，未改

### 不一致
- ⚠️ Task 2 行號：handoff 說「約第 93-100 行」，實際 push fallback 在 **L135-148**（腳本比預期長）
- ⚠️ Task 3：handoff 說 `backups/` 有內容需搬移，實際 **`backups/` 目錄不存在**（腳本從未成功執行或目錄已被刪），搬移步驟可簡化為只改路徑
- ⚠️ Task 5：handoff 說 GDrive 腳本「被 iCloud 清出本機」，實際**兩個檔案都可正常讀取**。可能 iCloud 已自動下載回來，或當時的觀察已過時。Task 5 的搬移到 `~/.local/scripts/` 仍有預防價值，但不是「目前壞掉」的狀態。
