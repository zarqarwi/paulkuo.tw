#!/bin/bash
# paulkuo.tw — Git hooks 安裝腳本
# 重新 clone repo 後執行此腳本即可恢復所有自訂 hooks
# 用法：bash scripts/install-hooks.sh

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [[ -z "$REPO_ROOT" ]]; then
  echo "❌ 不在 git repo 裡，請在 paulkuo.tw 根目錄執行"
  exit 1
fi

HOOKS_DIR="$REPO_ROOT/.git/hooks"

echo "📦 安裝 git hooks..."

# commit-msg hook：跨子專案影響偵測
cp "$REPO_ROOT/scripts/commit-msg-hook.sh" "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"
echo "  ✅ commit-msg hook（跨子專案影響偵測）"

echo ""
echo "完成！所有 hooks 已安裝到 .git/hooks/"
echo "共用檔案清單來源：docs/shared-files.json"
