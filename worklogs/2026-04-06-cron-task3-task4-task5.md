# Cron 改善 Task 3 + 4 + 5 完成

## 修復：backup-d1.sh sed 路徑錯誤
- 修正前：$HOME/Desktop/01_專案進行中/02_參考資料/backups/formosa-d1
- 修正後：$HOME/Desktop/02_參考資料/backups/formosa-d1

## Task 3: backup-d1.sh 路徑 + crontab log
- BACKUP_DIR → ~/Desktop/02_參考資料/backups/formosa-d1
- crontab log → 同路徑
- commit: e9fa411

## Task 4: backup_catchup.sh 降頻
- */30 * * * * → 0 9,15 * * *

## Task 5: GDrive 腳本搬到 ~/.local/scripts/
- daily_backup_to_gdrive.sh → ~/.local/scripts/
- desktop_to_gdrive_sync.sh → ~/.local/scripts/
- crontab 路徑已更新

## 最終 crontab 快照
```
10 14 * * 1-5 /bin/bash /Users/apple/Desktop/01_專案進行中/paulkuo.tw/scripts/auto_update_data.sh
0 12 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_cloudflare.sh
0 22 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_cloudflare.sh
0 2 * * * /bin/bash /Users/apple/.local/scripts/daily_backup_to_gdrive.sh
0 8 * * * /bin/bash /Users/apple/.local/scripts/desktop_to_gdrive_sync.sh
0 9,15 * * * /bin/bash /Users/apple/Desktop/02_參考資料/backups/backup_catchup.sh
0 23 * * * /usr/bin/python3 /Users/apple/Desktop/01_專案進行中/get_筆記/sync_notes.py >> /Users/apple/Desktop/01_專案進行中/get_筆記/sync.log 2>&1
0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/02_參考資料/backups/formosa-d1/backup.log 2>&1
```

## crontab 備份
/tmp/crontab-backup-20260406-212140.txt
