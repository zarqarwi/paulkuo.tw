#!/bin/bash
# auto_update_data.sh v5 — Timing + Stock only
#
# v5 改動（vs v4）：
#   - 移除 Fitbit（改由 Cloudflare Worker 獨立處理 token + 資料）
#   - cron 只負責 Timing App + Stock price → git push
#
# v4 改動：移除 CHAIN_STATUS 短路邏輯
# v3 改動：新增長時間睡眠偵測
# v2 改動：push 最小間隔 30 分鐘，顯著變化才 push

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="/Users/apple"

REPO="/Users/apple/Desktop/01_專案進行中/paulkuo.tw"
LOG="$REPO/scripts/auto_update.log"
LAST_PUSH_FILE="$REPO/scripts/.last_push_ts"
PUSH_MIN_INTERVAL=1800  # 30 分鐘（秒）

TS=$(date "+%Y-%m-%d %H:%M:%S")
log() { echo "[$TS] $1" >> "$LOG"; }

log "=== Start ==="
cd "$REPO" || { log "ERROR: cd failed"; exit 1; }

# --- Guard: skip if manual git operation in progress ---
if [ -f ".git/index.lock" ]; then
    log "⏸️ Skip: .git/index.lock exists (manual git op in progress)"
    exit 0
fi

# --- Guard: clean corrupted refs automatically ---
find .git/logs -name 'main *' -delete 2>/dev/null
find .git/logs -name 'HEAD *' -delete 2>/dev/null
find .git/refs -name 'main *' -delete 2>/dev/null

# --- Guard: stash any dirty working tree before sync ---
DIRTY=$(git status --porcelain 2>/dev/null)
if [ -n "$DIRTY" ]; then
    log "WARN: dirty working tree, stashing..."
    git stash --include-untracked >> "$LOG" 2>&1
fi

# Sync with remote
git fetch origin >> "$LOG" 2>&1
git pull --rebase origin main >> "$LOG" 2>&1 || {
    log "WARN: git pull --rebase failed, hard reset to origin/main"
    git rebase --abort >> "$LOG" 2>&1
    git reset --hard origin/main >> "$LOG" 2>&1
}

# Restore stash if we stashed
if [ -n "$DIRTY" ]; then
    git stash pop >> "$LOG" 2>&1 || log "WARN: stash pop conflict, dropped"
fi

# --- Snapshot before (for significant change detection) ---
OLD_AI=""
if [ -f data/timing.json ]; then
    OLD_AI=$(python3 -c "import json; d=json.load(open('data/timing.json')); print(d['daily'][-1]['ai_hours'] if d.get('daily') else 0)" 2>/dev/null)
fi

# --- 1. Timing App ---
log "Timing..."
python3 scripts/timing_fetch_local.py >> "$LOG" 2>&1 || log "WARN: Timing failed"

# --- 2. Stock price ---
log "Stock..."
python3 scripts/stock_fetch.py >> "$LOG" 2>&1 || log "WARN: Stock fetch failed"

# --- 3. Significant change detection ---
NEW_AI=""
if [ -f data/timing.json ]; then
    NEW_AI=$(python3 -c "import json; d=json.load(open('data/timing.json')); print(d['daily'][-1]['ai_hours'] if d.get('daily') else 0)" 2>/dev/null)
fi

SIGNIFICANT=false
if [ -n "$OLD_AI" ] && [ -n "$NEW_AI" ]; then
    AI_DIFF=$(python3 -c "print(abs(float('${NEW_AI:-0}') - float('${OLD_AI:-0}')))" 2>/dev/null)
    AI_SIG=$(python3 -c "print('yes' if float('${AI_DIFF:-0}') > 0.05 else 'no')" 2>/dev/null)
    if [ "$AI_SIG" = "yes" ]; then
        SIGNIFICANT=true
        log "  △ AI: ${OLD_AI}h → ${NEW_AI}h (+${AI_DIFF}h)"
    fi
fi

# --- 4. Push with rate limiting ---
CHANGED=$(git diff --name-only data/ 2>/dev/null)
if [ -z "$CHANGED" ]; then
    log "— No file changes"
    tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
    log "=== Done ==="
    exit 0
fi

# Check minimum push interval
NOW_EPOCH=$(date +%s)
LAST_PUSH=0
if [ -f "$LAST_PUSH_FILE" ]; then
    LAST_PUSH=$(cat "$LAST_PUSH_FILE" 2>/dev/null)
fi
ELAPSED=$((NOW_EPOCH - LAST_PUSH))

if [ "$SIGNIFICANT" = "false" ] && [ "$ELAPSED" -lt "$PUSH_MIN_INTERVAL" ]; then
    REMAINING=$(( (PUSH_MIN_INTERVAL - ELAPSED) / 60 ))
    log "⏳ Skip push (no significant change, next push in ~${REMAINING}m)"
    tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
    log "=== Done ==="
    exit 0
fi

# Do push
log "Push: $CHANGED"
git add data/timing.json data/stock.json 2>/dev/null
git commit -m "auto: data update $(date +%m/%d-%H:%M)" --no-verify >> "$LOG" 2>&1

if ! git push origin main >> "$LOG" 2>&1; then
    log "WARN: push rejected, pulling rebase..."
    git pull --rebase origin main >> "$LOG" 2>&1
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

# Keep log small
tail -500 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
log "=== Done ==="
