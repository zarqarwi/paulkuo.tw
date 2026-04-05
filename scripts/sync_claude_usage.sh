#!/bin/bash
# sync_claude_usage.sh v2 — Write Claude Max subscription usage to TICKER_KV
# v2: 加入歷史快照 claude_sub_${date}，供 Dashboard 趨勢圖使用
#
# Usage:
#   ./scripts/sync_claude_usage.sh 382.26 450 85 13.03
#   arg1: extraSpent (USD)
#   arg2: extraLimit (USD)
#   arg3: extraPct (%)
#   arg4: balance (USD)
#   arg5: weeklyMaxed (optional, default true)

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export HOME="/Users/apple"

REPO="/Users/apple/Desktop/01_專案進行中/paulkuo.tw"
KV_NS="c066a2fd7942494c8ead37cc518b191b"
LOG="$REPO/scripts/auto_update.log"
TS=$(date "+%Y-%m-%d %H:%M:%S")
TODAY=$(date "+%Y-%m-%d")

EXTRA_SPENT=${1:-0}
EXTRA_LIMIT=${2:-450}
EXTRA_PCT=${3:-0}
BALANCE=${4:-0}
WEEKLY_MAXED=${5:-true}
UPDATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%S+08:00")

JSON="{\"plan\":\"Max\",\"planUSD\":200,\"extraSpent\":${EXTRA_SPENT},\"extraLimit\":${EXTRA_LIMIT},\"extraPct\":${EXTRA_PCT},\"balance\":${BALANCE},\"weeklyMaxed\":${WEEKLY_MAXED},\"renewalDate\":\"May 1\",\"updatedAt\":\"${UPDATED_AT}\"}"

echo "[$TS] Claude usage sync: spent=\$${EXTRA_SPENT} limit=\$${EXTRA_LIMIT} pct=${EXTRA_PCT}%" >> "$LOG"

cd "$REPO" || { echo "ERROR: cd failed"; exit 1; }

# 1. 寫入最新快照（ticker 用）
npx wrangler kv key put 'claude_subscription' "$JSON" \
  --namespace-id="$KV_NS" --remote 2>&1

if [ $? -ne 0 ]; then
  echo "[$TS] ❌ Claude usage KV write failed" >> "$LOG"
  echo "❌ KV write failed"
  exit 1
fi

# 2. 寫入帶日期的歷史快照（Dashboard 趨勢圖用，90 天過期）
npx wrangler kv key put "claude_sub_${TODAY}" "$JSON" \
  --namespace-id="$KV_NS" --remote \
  --ttl=7776000 2>&1

if [ $? -eq 0 ]; then
  echo "[$TS] ✅ Claude usage → KV + history \$${EXTRA_SPENT}/\$${EXTRA_LIMIT} ($TODAY)" >> "$LOG"
  echo "✅ Synced: Claude Max \$200 + Extra \$${EXTRA_SPENT}/\$${EXTRA_LIMIT} (${EXTRA_PCT}%)"
  echo "✅ History: claude_sub_${TODAY} (90d TTL)"
else
  echo "[$TS] ⚠️ Claude main KV ok, but history write failed" >> "$LOG"
  echo "⚠️ Main KV ok, history write failed"
fi
