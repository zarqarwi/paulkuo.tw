#!/bin/bash
# auto_update_data.sh — 每 10 分鐘自動更新 paulkuo.tw 數據
# 需要在 macOS 安全性設定授權 bash 的完整磁碟取用權限
# 或透過 crontab 執行（cron 本身有較好的權限繼承）

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="/Users/apple"

REPO="/Users/apple/Desktop/01_專案進行中/paulkuo-astro"
LOG="$REPO/scripts/auto_update.log"
TS=$(date "+%Y-%m-%d %H:%M:%S")

log() { echo "[$TS] $1" >> "$LOG"; }

log "=== Start ==="

cd "$REPO" || { log "ERROR: cd failed"; exit 1; }

# --- 1. Timing App ---
log "Timing..."
python3 scripts/timing_fetch_local.py >> "$LOG" 2>&1 || log "WARN: Timing failed"

# --- 2. Fitbit (if token exists) ---
if [ -f "$REPO/scripts/.fitbit_token" ]; then
    log "Fitbit..."
    python3 scripts/fitbit_fetch.py >> "$LOG" 2>&1 || log "WARN: Fitbit failed"
else
    log "SKIP: Fitbit (no token)"
fi

# --- 3. Git push if data changed ---
CHANGED=$(git diff --name-only data/ 2>/dev/null)
if [ -n "$CHANGED" ]; then
    log "Push: $CHANGED"
    git add data/timing.json data/fitbit.json 2>/dev/null
    git commit -m "auto: data update $(date +%m/%d-%H:%M)" --no-verify >> "$LOG" 2>&1
    if ! git push origin main >> "$LOG" 2>&1; then
        log "WARN: push rejected, pulling rebase..."
        git pull --rebase origin main >> "$LOG" 2>&1
        if git push origin main >> "$LOG" 2>&1; then
            log "✅ Pushed (after rebase)"
        else
            log "ERROR: push failed even after rebase"
        fi
    else
        log "✅ Pushed"
    fi
else
    log "— No changes"
fi

# Keep log small
tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
log "=== Done ==="
