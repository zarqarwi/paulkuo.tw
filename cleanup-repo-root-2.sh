#!/bin/bash
# paulkuo.tw repo 根目錄清理 — 第二批
# 日期：2026-03-13
# 用法：在 repo 根目錄執行 bash cleanup-repo-root-2.sh && git push

set -e

echo "🧹 paulkuo.tw 根目錄清理（第二批）"
echo "===================================="

# --- 1. 搬移：compress_covers.py → scripts/ ---
echo ""
echo "📦 搬移 compress_covers.py → scripts/..."
git mv compress_covers.py scripts/compress_covers.py 2>/dev/null || true

# --- 2. 搬移：寫作文件 → docs/ ---
echo "📦 搬移寫作文件 → docs/..."
git mv paulkuo-writing-SKILL.md docs/paulkuo-writing-SKILL.md 2>/dev/null || true
git mv writing-script-v2.md docs/writing-script-v2.md 2>/dev/null || true

# --- 3. 刪除：一次性腳本 + 殘留 yml + 重複草稿 ---
echo ""
echo "🗑️ 刪除一次性腳本、殘留設定、重複草稿..."
git rm -f \
  schedule_canary.py \
  canary_config.json \
  fitbit-refresh.yml \
  canary-in-coal-mine-ai-employment.md \
  work-trend-index-2025-taiwan.md \
  cleanup-repo-root.sh \
  2>/dev/null || true

# --- 4. Commit ---
echo ""
echo "✅ 建立 commit..."
git add -A
git commit -m "chore: repo root cleanup round 2 — move utils to scripts/docs, remove stale files

- Move compress_covers.py → scripts/
- Move paulkuo-writing-SKILL.md, writing-script-v2.md → docs/
- Remove schedule_canary.py + canary_config.json (one-time script, done)
- Remove fitbit-refresh.yml (disabled, local crontab is source of truth)
- Remove canary-in-coal-mine-ai-employment.md (duplicate, exists in src/content/articles/)
- Remove work-trend-index-2025-taiwan.md (duplicate, exists in src/content/articles/)
- Remove cleanup-repo-root.sh (first cleanup script, done)
"

echo ""
echo "🎉 第二批清理完成！git push 推上去吧。"
