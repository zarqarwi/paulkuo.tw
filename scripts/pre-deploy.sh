#!/bin/bash
# pre-deploy.sh — paulkuo.tw 部署前安全檢查
# 用法：每次 git push 前跑這個
# 存放：~/Desktop/02_參考資料/pre-deploy.sh

set -e
cd ~/Desktop/01_專案進行中/paulkuo.tw

echo "🔍 paulkuo.tw 部署前檢查"
echo "========================="
echo ""

# === 1. 建立備份標籤 ===
BACKUP_TAG="backup-$(date +%Y%m%d-%H%M%S)"
git tag "$BACKUP_TAG"
echo "✅ 備份標籤已建立：$BACKUP_TAG"
echo "   （如果部署出問題，跑 git reset --hard $BACKUP_TAG 就能還原）"
echo ""

# === 2. 檢查 frontmatter 重複 ===
echo "🔍 檢查 frontmatter 重複..."
DUPES=0
for f in src/content/articles/*.md; do
    count=$(grep -c "^cover:" "$f" 2>/dev/null || echo 0)
    if [ "$count" -gt 1 ]; then
        echo "   ❌ 重複 cover: $(basename $f) ($count 行)"
        DUPES=$((DUPES + 1))
    fi
done
if [ "$DUPES" -eq 0 ]; then
    echo "   ✅ 無重複 frontmatter"
else
    echo "   ❌ 發現 $DUPES 個重複，請先修復再 push！"
    exit 1
fi
echo ""

# === 3. 檢查 cover 圖片與 frontmatter 一致性 ===
echo "🔍 檢查圖片與 frontmatter 一致性..."
MISSING_IMG=0
MISSING_FM=0
for f in src/content/articles/*.md; do
    slug=$(basename "$f" .md)
    has_cover=$(grep -c "^cover:" "$f" 2>/dev/null || echo 0)
    has_img=0
    [ -f "public/images/covers/${slug}.jpg" ] && has_img=1
    
    if [ "$has_cover" -gt 0 ] && [ "$has_img" -eq 0 ]; then
        echo "   ⚠️  有 frontmatter 沒圖片：$slug"
        MISSING_IMG=$((MISSING_IMG + 1))
    fi
    if [ "$has_cover" -eq 0 ] && [ "$has_img" -eq 1 ]; then
        echo "   ⚠️  有圖片沒 frontmatter：$slug"
        MISSING_FM=$((MISSING_FM + 1))
    fi
done
if [ "$MISSING_IMG" -eq 0 ] && [ "$MISSING_FM" -eq 0 ]; then
    echo "   ✅ 圖片與 frontmatter 完全一致"
else
    echo "   ⚠️  $MISSING_IMG 缺圖片, $MISSING_FM 缺 frontmatter（非致命，但請留意）"
fi
echo ""

# === 4. YAML 格式驗證 ===
echo "🔍 檢查 YAML 格式..."
YAML_ERR=0
for f in src/content/articles/*.md src/content/articles/en/*.md src/content/articles/ja/*.md src/content/articles/zh-cn/*.md; do
    [ -f "$f" ] || continue
    # 基本檢查：frontmatter 開頭結尾
    head -1 "$f" | grep -q "^---" || { echo "   ❌ 缺少 frontmatter: $(basename $f)"; YAML_ERR=$((YAML_ERR+1)); }
done
if [ "$YAML_ERR" -eq 0 ]; then
    echo "   ✅ 基本 YAML 格式正確"
else
    echo "   ❌ $YAML_ERR 個 YAML 錯誤"
    exit 1
fi
echo ""

# === 5. 本地 build 測試 ===
echo "🔍 執行 astro build 驗證..."
export PATH=/usr/local/bin:$PATH
if npx astro build > /tmp/astro_build.log 2>&1; then
    PAGES=$(grep -o '[0-9]* page(s)' /tmp/astro_build.log | head -1)
    echo "   ✅ Build 成功！($PAGES)"
else
    echo "   ❌ Build 失敗！錯誤如下："
    tail -20 /tmp/astro_build.log
    echo ""
    echo "   完整 log: /tmp/astro_build.log"
    exit 1
fi
echo ""

# === 6. 列出將要 push 的變更 ===
echo "📋 待 push 變更摘要："
echo "   $(git diff --stat HEAD | tail -1)"
echo ""

echo "========================="
echo "✅ 全部檢查通過！可以安全 push。"
echo ""
echo "📋 下一步："
echo "   git add -A"
echo "   git commit -m '你的 commit message'"
echo "   git push"
echo ""
echo "⚠️  如果部署後出問題，還原指令："
echo "   git reset --hard $BACKUP_TAG"
echo "   git push -f"
