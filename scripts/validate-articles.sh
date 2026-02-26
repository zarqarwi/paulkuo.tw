#!/bin/bash
# paulkuo.tw 文章驗證腳本
# 用途：pre-commit hook 或手動執行，檢查三類常見錯誤
# 1. frontmatter 必填欄位 (pillar)
# 2. cover 圖片是否存在
# 3. cover 圖片是否超過 500KB

ROOT="$(git rev-parse --show-toplevel)"
ARTICLES_DIR="$ROOT/src/content/articles"
PUBLIC_DIR="$ROOT/public"
COVERS_DIR="$PUBLIC_DIR/images/covers"
MAX_SIZE_KB=500
ERRORS=0
VALID_PILLARS="ai|circular|faith|startup|life"

echo "🔍 驗證文章 frontmatter 與圖片..."
echo ""

# --- 檢查 1 & 2：frontmatter 欄位 + cover 存在性 ---
for f in "$ARTICLES_DIR"/*.md; do
  [ -f "$f" ] || continue
  filename=$(basename "$f")
  slug="${filename%.md}"

  # 提取 frontmatter (第一個 --- 到第二個 --- 之間)
  frontmatter=$(sed -n '/^---$/,/^---$/p' "$f" | sed '1d;$d')

  # 檢查 pillar 欄位
  pillar=$(echo "$frontmatter" | grep -E '^pillar:' | head -1 | sed 's/pillar:[[:space:]]*//')
  if [ -z "$pillar" ]; then
    echo "❌ [$slug] 缺少 pillar 欄位"
    ERRORS=$((ERRORS + 1))
  elif ! echo "$pillar" | grep -qE "^($VALID_PILLARS)$"; then
    echo "❌ [$slug] pillar 值無效: '$pillar' (允許: $VALID_PILLARS)"
    ERRORS=$((ERRORS + 1))
  fi

  # 檢查 cover 圖片存在性
  cover=$(echo "$frontmatter" | grep -E '^cover:' | head -1 | sed 's/cover:[[:space:]]*//' | tr -d '"' | tr -d "'")
  if [ -n "$cover" ]; then
    cover_path="$PUBLIC_DIR$cover"
    if [ ! -f "$cover_path" ]; then
      echo "❌ [$slug] cover 圖片不存在: $cover"
      ERRORS=$((ERRORS + 1))
    fi
  fi

  # 檢查 draft 狀態的文章是否沒有 cover（警告而非錯誤）
  draft=$(echo "$frontmatter" | grep -E '^draft:' | head -1 | sed 's/draft:[[:space:]]*//')
  if [ -z "$cover" ] && [ "$draft" != "true" ]; then
    echo "⚠️  [$slug] 非草稿但沒有 cover 欄位"
  fi
done

# --- 檢查 3：圖片大小 ---
if [ -d "$COVERS_DIR" ]; then
  find "$COVERS_DIR" -maxdepth 1 -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.webp" \) | while read -r img; do
    # 跳過 backup 資料夾
    case "$img" in *_backup*) continue ;; esac
    size_kb=$(( $(wc -c < "$img") / 1024 ))
    if [ "$size_kb" -gt "$MAX_SIZE_KB" ]; then
      echo "❌ [$(basename "$img")] 圖片過大: ${size_kb}KB (上限 ${MAX_SIZE_KB}KB)"
      ERRORS=$((ERRORS + 1))
    fi
  done
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "🚫 發現 $ERRORS 個錯誤，請修正後再 commit"
  exit 1
else
  echo "✅ 所有文章驗證通過"
  exit 0
fi
