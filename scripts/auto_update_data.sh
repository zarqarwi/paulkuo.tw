#!/bin/bash
# auto_update_data.sh v2 — 每 10 分鐘抓資料，但限制 push 頻率
#
# v2 改動（vs v1）：
#   - push 最小間隔 30 分鐘（避免一天上百個 auto commit）
#   - 資料「顯著變化」才 push（步數差 >300 或 AI 時間差 >0.05h）
#   - Fitbit token 中斷偵測 + macOS 通知
#   - timing_fetch_local.py v2 只查今天，不遍歷整月

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
OLD_STEPS=""
OLD_AI=""
if [ -f data/fitbit.json ]; then
    OLD_STEPS=$(python3 -c "import json; print(json.load(open('data/fitbit.json')).get('today',{}).get('steps',0))" 2>/dev/null)
fi
if [ -f data/timing.json ]; then
    OLD_AI=$(python3 -c "import json; d=json.load(open('data/timing.json')); print(d['daily'][-1]['ai_hours'] if d.get('daily') else 0)" 2>/dev/null)
fi

# --- 1. Timing App ---
log "Timing..."
python3 scripts/timing_fetch_local.py >> "$LOG" 2>&1 || log "WARN: Timing failed"

# --- 2. Stock price ---
log "Stock..."
python3 scripts/stock_fetch.py >> "$LOG" 2>&1 || log "WARN: Stock fetch failed"

# --- 3. Fitbit (pre-check: refresh if <2h remaining) ---
FITBIT_OK=false
if [ -f "$REPO/scripts/.fitbit_token" ]; then
    # Proactive refresh if token expires within 2 hours
    python3 -c "
import json, time, subprocess, base64
TF = '$REPO/scripts/.fitbit_token'
with open(TF) as f: t = json.load(f)
remaining = t.get('expires_at', 0) - time.time()
if remaining < 7200:
    creds = base64.b64encode(b'23V2BH:4adac11e3241afadf53cccfaa7b7e86a').decode()
    r = subprocess.run(['curl','-s','-X','POST','https://api.fitbit.com/oauth2/token',
        '-H',f'Authorization: Basic {creds}','-H','Content-Type: application/x-www-form-urlencoded',
        '-d',f'grant_type=refresh_token&refresh_token={t[\"refresh_token\"]}'],
        capture_output=True, text=True)
    import json as j2
    nt = j2.loads(r.stdout)
    if 'access_token' in nt:
        nt['expires_at'] = time.time() + nt.get('expires_in', 28800)
        with open(TF,'w') as f: j2.dump(nt, f, indent=2)
        print(f'🔄 Token proactive refresh OK ({nt.get(\"expires_in\",0)//3600}h)')
" 2>/dev/null

    log "Fitbit..."
    FITBIT_OUTPUT=$(python3 scripts/fitbit_fetch.py 2>&1)
    FITBIT_EXIT=$?
    echo "$FITBIT_OUTPUT" >> "$LOG"

    if [ $FITBIT_EXIT -ne 0 ] || echo "$FITBIT_OUTPUT" | grep -qi "error\|failed\|no.*token"; then
        log "❌ Fitbit token 可能中斷"
        # macOS 通知
        osascript -e 'display notification "Fitbit token 可能已過期，需要重新授權" with title "⚠️ Fitbit 資料中斷" sound name "Basso"' 2>/dev/null

        # 寫入 fitbit.json 標記狀態
        python3 -c "
import json, os
f = '$REPO/data/fitbit.json'
if os.path.exists(f):
    d = json.load(open(f))
    d['token_status'] = 'expired'
    d['token_error'] = '$(date +%Y-%m-%dT%H:%M:%S)+08:00'
    json.dump(d, open(f,'w'), indent=2, ensure_ascii=False)
" 2>/dev/null
    else
        FITBIT_OK=true
    fi
else
    log "SKIP: Fitbit (no token file)"
    osascript -e 'display notification "找不到 .fitbit_token 檔案" with title "⚠️ Fitbit 未設定" sound name "Basso"' 2>/dev/null
fi

# --- 3. Significant change detection ---
NEW_STEPS=""
NEW_AI=""
if [ -f data/fitbit.json ]; then
    NEW_STEPS=$(python3 -c "import json; print(json.load(open('data/fitbit.json')).get('today',{}).get('steps',0))" 2>/dev/null)
fi
if [ -f data/timing.json ]; then
    NEW_AI=$(python3 -c "import json; d=json.load(open('data/timing.json')); print(d['daily'][-1]['ai_hours'] if d.get('daily') else 0)" 2>/dev/null)
fi

SIGNIFICANT=false
if [ -n "$OLD_STEPS" ] && [ -n "$NEW_STEPS" ]; then
    STEP_DIFF=$(python3 -c "print(abs(int(${NEW_STEPS:-0}) - int(${OLD_STEPS:-0})))" 2>/dev/null)
    if [ "${STEP_DIFF:-0}" -gt 300 ]; then
        SIGNIFICANT=true
        log "  △ Steps: $OLD_STEPS → $NEW_STEPS (+$STEP_DIFF)"
    fi
fi
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
    # Keep log small
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
git add data/timing.json data/fitbit.json data/stock.json 2>/dev/null
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
