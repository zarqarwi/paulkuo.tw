#!/usr/bin/env bash
# collect-session-metrics.sh — 自動收集 session 產出指標，寫入 worklogs/metrics/
#
# 用法：
#   bash scripts/collect-session-metrics.sh <project_id> <session_type> <since_commit>
#
# 例：
#   bash scripts/collect-session-metrics.sh paulkuo-main code abc1234
#   bash scripts/collect-session-metrics.sh llm-wiki cowork HEAD~5

set -euo pipefail

PROJECT_ID="${1:-}"
SESSION_TYPE="${2:-}"
SINCE_COMMIT="${3:-}"

# --- 參數驗證 ---
if [[ -z "$PROJECT_ID" || -z "$SESSION_TYPE" || -z "$SINCE_COMMIT" ]]; then
  echo "用法：bash scripts/collect-session-metrics.sh <project_id> <session_type> <since_commit>"
  echo "例：bash scripts/collect-session-metrics.sh paulkuo-main code abc1234"
  exit 1
fi

if [[ "$SESSION_TYPE" != "code" && "$SESSION_TYPE" != "cowork" ]]; then
  echo "錯誤：session_type 必須是 'code' 或 'cowork'，收到：$SESSION_TYPE"
  exit 1
fi

# --- jq 檢查 ---
if ! command -v jq &>/dev/null; then
  echo "錯誤：需要 jq，請先安裝：brew install jq"
  exit 1
fi

# --- 移到 repo 根目錄 ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# --- 確認 metrics 目錄存在 ---
METRICS_DIR="worklogs/metrics/$PROJECT_ID"
if [[ ! -d "$METRICS_DIR" ]]; then
  echo "錯誤：目錄不存在：$METRICS_DIR"
  echo "請先執行：mkdir -p $METRICS_DIR && touch $METRICS_DIR/.gitkeep"
  exit 1
fi

# --- 日期 ---
DATE="$(date +%Y-%m-%d)"

# --- 計算 git 指標 ---
COMMITS=$(git rev-list --count "${SINCE_COMMIT}..HEAD" 2>/dev/null || echo 0)

DIFF_STAT=$(git diff --stat "${SINCE_COMMIT}..HEAD" 2>/dev/null || true)

# 解析 files changed
FILES_CHANGED=$(echo "$DIFF_STAT" | grep -E '[0-9]+ files? changed' | grep -oE '[0-9]+ files? changed' | grep -oE '^[0-9]+' || echo 0)
if [[ -z "$FILES_CHANGED" ]]; then
  # 處理「1 file changed」單數形式
  FILES_CHANGED=$(echo "$DIFF_STAT" | grep -oE '^[[:space:]]*[0-9]+' | head -1 | tr -d ' ' || echo 0)
fi
[[ -z "$FILES_CHANGED" ]] && FILES_CHANGED=0

# 解析 insertions
LINES_ADDED=$(echo "$DIFF_STAT" | grep -oE '[0-9]+ insertion' | grep -oE '^[0-9]+' || echo 0)
[[ -z "$LINES_ADDED" ]] && LINES_ADDED=0

# 解析 deletions
LINES_REMOVED=$(echo "$DIFF_STAT" | grep -oE '[0-9]+ deletion' | grep -oE '^[0-9]+' || echo 0)
[[ -z "$LINES_REMOVED" ]] && LINES_REMOVED=0

# --- 確認輸出檔名（避免同一天同類型重複） ---
BASE_NAME="${DATE}-${SESSION_TYPE}"
OUTPUT_FILE="${METRICS_DIR}/${BASE_NAME}.json"

if [[ -f "$OUTPUT_FILE" ]]; then
  N=2
  while [[ -f "${METRICS_DIR}/${BASE_NAME}-${N}.json" ]]; do
    N=$((N + 1))
  done
  OUTPUT_FILE="${METRICS_DIR}/${BASE_NAME}-${N}.json"
fi

# --- 輸出 JSON ---
jq -n \
  --arg project_id "$PROJECT_ID" \
  --arg date "$DATE" \
  --arg session_type "$SESSION_TYPE" \
  --argjson commits "$COMMITS" \
  --argjson files_changed "$FILES_CHANGED" \
  --argjson lines_added "$LINES_ADDED" \
  --argjson lines_removed "$LINES_REMOVED" \
  '{
    "$schema": "session-metrics-v1",
    "project_id": $project_id,
    "date": $date,
    "session_type": $session_type,
    "model": "",
    "size": "",
    "outputs": {
      "commits": $commits,
      "files_changed": $files_changed,
      "lines_added": $lines_added,
      "lines_removed": $lines_removed,
      "deploys": 0,
      "issues_closed": 0,
      "handoff_produced": false
    },
    "custom": {},
    "automation_changes": [],
    "notes": ""
  }' > "$OUTPUT_FILE"

echo "✅ Metrics 已寫入：$OUTPUT_FILE"
echo ""
cat "$OUTPUT_FILE" | jq '{
  project_id,
  date,
  session_type,
  outputs: .outputs
}'
