#!/bin/bash
# run_covers.sh — 跑封面圖產生腳本
# v2: 不自動 commit/push，跑完提示手動操作
#
# 使用前確保 OPENAI_API_KEY 環境變數已設定：
#   export OPENAI_API_KEY="your-key-here"
# 或放在 ~/.zshrc / ~/.bash_profile

if [ -z "$OPENAI_API_KEY" ]; then
  echo "❌ OPENAI_API_KEY 未設定。請先 export OPENAI_API_KEY=your-key"
  exit 1
fi

export PYTHONUNBUFFERED=1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../cover_gen.log"

echo "🚀 Starting cover generation..."
echo "📂 Log: ${LOG_FILE}"
echo ""
python3 "${SCRIPT_DIR}/generate_covers.py" 2>&1 | tee "${LOG_FILE}"
echo ""
echo "================================================"
echo "📋 跑完了！請回 Claude 確認後再 push。"
echo "   不要直接關掉這個視窗。"
echo ""
echo "   下一步："
echo "   1. bash scripts/pre-deploy.sh"
echo "   2. 確認全過才 git push"
echo "================================================"
read -n 1
