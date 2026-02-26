#!/bin/bash
# validate-articles.sh — paulkuo.tw 文章品質守門員
# 檢查項目：
#   1. frontmatter 必填欄位 (pillar)
#   2. pillar 值必須是合法 enum
#   3. 禁止使用已淘汰的 category 欄位
#   4. cover 圖片存在性
#   5. cover 圖片大小上限 (500KB)
#
# 用法：直接跑或透過 git pre-commit hook 觸發
#   bash scripts/validate-articles.sh

set -euo pipefail

# === 設定 ===
ARTICLES_DIR="src/content/articles"
COVERS_DIR="public/images/covers"
MAX_COVER_KB=500
VALID_PILLARS="ai|circular|faith|startup|life"

# 顏色
RED='\033[0;31m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
NC='\033[0m'

ERRORS=0
WARNS=0

error() { echo -e "  ${RED}❌ $1${NC}"; ERRORS=$((ERRORS + 1)); }
warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; WARNS=$((WARNS + 1)); }
ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }

# 取得 repo 根目錄
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$REPO_ROOT"

echo ""
echo "🔍 paulkuo.tw 文章驗證"
echo "═══════════════════════"

# ============================================
# 檢查 1: Frontmatter 必填欄位 & 合法性
# ============================================
echo ""
echo "📋 檢查 frontmatter..."

for f in "$ARTICLES_DIR"/*.md; do
    [ -f "$f" ] || continue
    slug=$(basename "$f" .md)
    
    # 提取 frontmatter（兩個 --- 之間的內容）
    frontmatter=$(sed -n '/^---$/,/^---$/p' "$f" | sed '1d;$d')
    
    # 1a. 檢查 pillar 是否存在
    pillar_line=$(echo "$frontmatter" | grep -E '^pillar:' || true)
    if [ -z "$pillar_line" ]; then
        error "$slug — 缺少必填欄位 'pillar'"
        
        # 額外提示：是否誤用了 category
        has_category=$(echo "$frontmatter" | grep -E '^category:' || true)
        if [ -n "$has_category" ]; then
            error "$slug — 使用了 'category' (已淘汰)，應改為 'pillar'"
        fi
        continue
    fi
    
    # 1b. 檢查 pillar 值是否合法
    pillar_value=$(echo "$pillar_line" | sed 's/^pillar:[[:space:]]*//' | tr -d '"' | tr -d "'")
    if ! echo "$pillar_value" | grep -qE "^($VALID_PILLARS)$"; then
        error "$slug — pillar 值 '$pillar_value' 不合法 (允許: ai, circular, faith, startup, life)"
        continue
    fi
    
    # 1c. 檢查是否同時有 category（冗餘）
    has_category=$(echo "$frontmatter" | grep -E '^category:' || true)
    if [ -n "$has_category" ]; then
        warn "$slug — 同時有 'category' 和 'pillar'，建議移除 'category'"
    fi
done

# 計算通過數
total_md=$(ls -1 "$ARTICLES_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$ERRORS" -eq 0 ]; then
    ok "$total_md 篇文章 frontmatter 全部通過"
fi

# ============================================
# 檢查 2: Cover 圖片存在性
# ============================================
echo ""
echo "🖼️  檢查 cover 圖片..."

MISSING_COVERS=0
for f in "$ARTICLES_DIR"/*.md; do
    [ -f "$f" ] || continue
    slug=$(basename "$f" .md)
    
    frontmatter=$(sed -n '/^---$/,/^---$/p' "$f" | sed '1d;$d')
    cover_line=$(echo "$frontmatter" | grep -E '^cover:' || true)
    
    if [ -n "$cover_line" ]; then
        # 提取路徑，去除引號
        cover_path=$(echo "$cover_line" | sed 's/^cover:[[:space:]]*//' | tr -d '"' | tr -d "'")
        # cover 路徑是 /images/covers/xxx.jpg，對應 public/images/covers/xxx.jpg
        full_path="public${cover_path}"
        if [ ! -f "$full_path" ]; then
            error "$slug — cover 指向 '$cover_path' 但檔案不存在"
            MISSING_COVERS=$((MISSING_COVERS + 1))
        fi
    else
        # 沒有 cover 欄位，檢查是否有對應圖片（提醒加上）
        if [ -f "$COVERS_DIR/${slug}.jpg" ]; then
            warn "$slug — 有圖片但 frontmatter 沒有 cover 欄位"
        fi
    fi
done

if [ "$MISSING_COVERS" -eq 0 ]; then
    ok "所有 cover 圖片路徑有效"
fi

# ============================================
# 檢查 3: Cover 圖片大小
# ============================================
echo ""
echo "📏 檢查圖片大小 (上限 ${MAX_COVER_KB}KB)..."

OVERSIZED=0
if [ -d "$COVERS_DIR" ]; then
    for img in "$COVERS_DIR"/*.jpg "$COVERS_DIR"/*.png "$COVERS_DIR"/*.webp; do
        [ -f "$img" ] || continue
        # 跳過 backup 目錄
        [[ "$img" == *"_backup"* ]] && continue
        
        size_bytes=$(wc -c < "$img" | tr -d ' ')
        size_kb=$((size_bytes / 1024))
        
        if [ "$size_kb" -gt "$MAX_COVER_KB" ]; then
            size_mb=$(echo "scale=1; $size_bytes / 1048576" | bc 2>/dev/null || echo "${size_kb}KB")
            error "$(basename "$img") — ${size_kb}KB 超過上限 (${MAX_COVER_KB}KB)"
            OVERSIZED=$((OVERSIZED + 1))
        fi
    done
fi

if [ "$OVERSIZED" -eq 0 ]; then
    ok "所有 cover 圖片大小合規"
fi

# ============================================
# 檢查 4: /health 路由衝突（已知 warning）
# ============================================
echo ""
echo "🔗 檢查路由衝突..."

if [ -f "src/pages/health/index.astro" ] && [ -f "src/pages/health.astro" ]; then
    warn "/health 路由定義在兩個檔案中，未來 Astro 版本會報錯。建議刪除其中一個。"
else
    ok "無路由衝突"
fi

# ============================================
# 結果總結
# ============================================
echo ""
echo "═══════════════════════"
if [ "$ERRORS" -gt 0 ]; then
    echo -e "${RED}💀 發現 $ERRORS 個錯誤，$WARNS 個警告。請修復後再 commit。${NC}"
    exit 1
else
    if [ "$WARNS" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  通過！但有 $WARNS 個警告需要留意。${NC}"
    else
        echo -e "${GREEN}🎉 全部通過！可以安心 commit。${NC}"
    fi
    exit 0
fi
