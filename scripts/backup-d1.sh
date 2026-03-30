#!/bin/bash
# D1 定期備份腳本 — Formosa ESG 2026
# 建議排程：每天凌晨 3 點執行
# crontab: 0 3 * * * /bin/bash ~/Desktop/01_專案進行中/paulkuo.tw/scripts/backup-d1.sh >> ~/Desktop/01_專案進行中/paulkuo.tw/backups/backup.log 2>&1

DATE=$(date +%Y-%m-%d)
BACKUP_DIR="$HOME/Desktop/01_專案進行中/paulkuo.tw/backups"
WORKER_DIR="$HOME/Desktop/01_專案進行中/paulkuo.tw/worker"
mkdir -p "$BACKUP_DIR"

echo "=== Formosa D1 Backup - $DATE ==="

cd "$WORKER_DIR" || { echo "ERROR: worker dir not found"; exit 1; }

# 匯出各資料表
for TABLE in formosa_users formosa_surveys formosa_gps_points formosa_daily_reports formosa_privacy_consent; do
  echo "Exporting $TABLE..."
  wrangler d1 execute paulkuo-auth --remote --config wrangler.toml \
    --command "SELECT * FROM $TABLE" \
    --json > "$BACKUP_DIR/${TABLE}_${DATE}.json" 2>/dev/null
done

# 匯出統計摘要
wrangler d1 execute paulkuo-auth --remote --config wrangler.toml \
  --command "SELECT 'users' as t, COUNT(*) as n FROM formosa_users UNION ALL SELECT 'surveys', COUNT(*) FROM formosa_surveys UNION ALL SELECT 'gps_points', COUNT(*) FROM formosa_gps_points" \
  --json > "$BACKUP_DIR/summary_${DATE}.json" 2>/dev/null

echo "Backup saved to $BACKUP_DIR"
ls -lh "$BACKUP_DIR"/*_${DATE}.json 2>/dev/null
echo "=== Done ==="
