#!/bin/bash
# pipeline_health.sh — 一個指令看所有自動化管線的健康狀態
# 用法: bash scripts/pipeline_health.sh

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
REPO="/Users/apple/Desktop/01_專案進行中/paulkuo.tw"

echo "═══════════════════════════════════════════"
echo "  📊 paulkuo.tw 管線健康報告"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"

# --- 1. Cron 狀態 ---
echo ""
echo "⏰ Cron 排程"
CRON_LINE=$(crontab -l 2>/dev/null | grep auto_update_data)
if [ -n "$CRON_LINE" ]; then
    echo "  ✅ 已啟用: $CRON_LINE"
else
    echo "  ❌ 未設定 cron"
fi

# --- 2. 最後一次成功 push ---
echo ""
echo "📤 最後 Push"
if [ -f "$REPO/scripts/.last_push_ts" ]; then
    LAST_TS=$(cat "$REPO/scripts/.last_push_ts")
    NOW_TS=$(date +%s)
    MINS_AGO=$(( (NOW_TS - LAST_TS) / 60 ))
    LAST_TIME=$(date -r "$LAST_TS" "+%Y-%m-%d %H:%M")
    if [ "$MINS_AGO" -lt 60 ]; then
        echo "  ✅ $LAST_TIME（${MINS_AGO} 分鐘前）"
    elif [ "$MINS_AGO" -lt 360 ]; then
        echo "  🟡 $LAST_TIME（$(( MINS_AGO / 60 ))小時前）"
    else
        echo "  ❌ $LAST_TIME（$(( MINS_AGO / 60 ))小時前 — 可能中斷）"
    fi
else
    echo "  ⚠️  無紀錄（尚未推過或檔案遺失）"
fi

# --- 3. Fitbit Token ---
echo ""
echo "❤️ Fitbit Token"
TOKEN_FILE="$REPO/scripts/.fitbit_token"
if [ -f "$TOKEN_FILE" ]; then
    EXPIRES_AT=$(python3 -c "import json; print(json.load(open('$TOKEN_FILE')).get('expires_at',0))" 2>/dev/null)
    NOW_TS=$(date +%s)
    if [ -n "$EXPIRES_AT" ]; then
        REMAINING=$(python3 -c "print(int((${EXPIRES_AT} - ${NOW_TS}) / 3600))" 2>/dev/null)
        if [ "${REMAINING:-0}" -gt 1 ]; then
            echo "  ✅ 有效（還剩約 ${REMAINING} 小時）"
        elif [ "${REMAINING:-0}" -gt 0 ]; then
            echo "  🟡 即將到期（剩不到 1 小時）"
        else
            echo "  ❌ 已過期（需要重新授權：python3 scripts/fitbit_auth.py）"
        fi
    else
        echo "  ⚠️  無法讀取到期時間"
    fi

    # Check fitbit.json status
    if [ -f "$REPO/data/fitbit.json" ]; then
        TOKEN_STATUS=$(python3 -c "import json; print(json.load(open('$REPO/data/fitbit.json')).get('token_status','ok'))" 2>/dev/null)
        FITBIT_UPDATED=$(python3 -c "import json; print(json.load(open('$REPO/data/fitbit.json')).get('updated','?'))" 2>/dev/null)
        STEPS=$(python3 -c "import json; print(json.load(open('$REPO/data/fitbit.json')).get('today',{}).get('steps',0))" 2>/dev/null)
        if [ "$TOKEN_STATUS" = "expired" ]; then
            echo "  ❌ 資料標記為 expired"
        fi
        echo "  📍 最新: ${STEPS} 步 @ ${FITBIT_UPDATED}"
    fi
else
    echo "  ❌ Token 檔案不存在（需要先跑 fitbit_auth.py）"
fi

# --- 4. Timing App ---
echo ""
echo "🕐 Timing App"
if [ -f "$REPO/data/timing.json" ]; then
    TIMING_UPDATED=$(python3 -c "import json; print(json.load(open('$REPO/data/timing.json')).get('updated','?'))" 2>/dev/null)
    TODAY_AI=$(python3 -c "import json; d=json.load(open('$REPO/data/timing.json')); print(d['daily'][-1]['ai_hours'] if d.get('daily') else 0)" 2>/dev/null)
    MONTH_TOTAL=$(python3 -c "import json; print(json.load(open('$REPO/data/timing.json')).get('month_summary',{}).get('total_ai_hours',0))" 2>/dev/null)
    echo "  ✅ 今日 AI: ${TODAY_AI}h | 本月: ${MONTH_TOTAL}h"
    echo "  📍 更新: ${TIMING_UPDATED}"
else
    echo "  ❌ timing.json 不存在"
fi

# --- 5. Git 狀態 ---
echo ""
echo "📦 Git 狀態"
cd "$REPO" 2>/dev/null
BRANCH=$(git branch --show-current 2>/dev/null)
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null)
UNCOMMITTED=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
echo "  分支: $BRANCH"
echo "  最新: $LAST_COMMIT"
if [ "$UNCOMMITTED" -gt 0 ]; then
    echo "  🟡 ${UNCOMMITTED} 個未提交的變更"
else
    echo "  ✅ 工作目錄乾淨"
fi

# --- 6. GitHub Actions 最近狀態 ---
echo ""
echo "🔄 CI/CD Pipeline"
echo "  deploy.yml:        每次 push + 每日 08:00 UTC"
echo "  translate.yml:     新文章時觸發"
echo "  publish-social.yml: deploy 成功後觸發"
echo "  （詳細狀態請看 github.com/zarqarwi/paulkuo.tw/actions）"

# --- 7. 今日 push 次數 ---
echo ""
echo "📈 今日統計"
TODAY=$(date "+%Y-%m-%d")
TODAY_PUSHES=$(git log --oneline --since="$TODAY 00:00" --grep="auto: data" 2>/dev/null | wc -l | tr -d ' ')
TODAY_ALL=$(git log --oneline --since="$TODAY 00:00" 2>/dev/null | wc -l | tr -d ' ')
echo "  自動 push: ${TODAY_PUSHES} 次"
echo "  全部 commit: ${TODAY_ALL} 次"

echo ""
echo "═══════════════════════════════════════════"
