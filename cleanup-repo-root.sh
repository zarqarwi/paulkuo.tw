#!/bin/bash
# paulkuo.tw repo 根目錄清理腳本
# 日期：2026-03-13
# 說明：刪除已完成的 handoff/audit 暫存檔、社群貼文草稿、重複文件
# 用法：在 repo 根目錄執行 bash cleanup-repo-root.sh

set -e

echo "🧹 paulkuo.tw 根目錄清理"
echo "========================"

# --- 1. 已完成的 session handoff / progress / audit 檔案 ---
echo ""
echo "📋 刪除已完成的 handoff & audit 暫存檔..."
git rm -f \
  session-handoff-tqef-r2.md \
  session-handoff-tqef-r3.md \
  L2-batch2-handoff-prompt.md \
  L2-factcheck-progress.md \
  handoff-L2-factcheck-final.md \
  cowork-handoff-30-articles.md \
  article-audit-report.md \
  rewrite-progress.md \
  ja-calibration-checklist.md \
  paulkuo-tw-audit-2026-03-06.md \
  2>/dev/null || true

# --- 2. 社群貼文草稿（不應在 repo 裡）---
echo ""
echo "📱 刪除社群貼文草稿..."
git rm -f \
  "FB貼文-即時會議翻譯開發心得-v2.txt" \
  "社群文-即時會議翻譯開發心得.md" \
  2>/dev/null || true

# --- 3. 根目錄重複文件（已存在於 docs/ 中）---
echo ""
echo "📄 刪除根目錄重複文件（docs/ 已有相同檔案）..."
git rm -f \
  paulkuo-content-architecture.md \
  2>/dev/null || true

# --- 4. Commit ---
echo ""
echo "✅ 建立 commit..."
git commit -m "chore: clean up stale handoff, audit, and draft files from repo root

Remove 13 files:
- 10 completed handoff/progress/audit files
- 2 social media draft files  
- 1 duplicate doc (already in docs/)
"

echo ""
echo "🎉 清理完成！剩下需要你確認的檔案："
echo "  - schedule_canary.py + canary_config.json （還在用嗎？）"
echo "  - compress_covers.py （還需要嗎？）"
echo "  - fitbit-refresh.yml （應該在 .github/workflows/ 嗎？）"
echo "  - canary-in-coal-mine-ai-employment.md （已在 src/content/articles/ 嗎？）"
echo "  - work-trend-index-2025-taiwan.md （已在 src/content/articles/ 嗎？）"
echo "  - paulkuo-writing-SKILL.md （搬到 docs/ 嗎？）"
echo "  - writing-script-v2.md （搬到 docs/ 嗎？）"
echo ""
echo "確認後可以再跑第二輪清理。"
echo "記得 git push 推上去！"
