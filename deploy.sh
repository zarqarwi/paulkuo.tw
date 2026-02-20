#!/bin/bash
# ============================================================
# paulkuo.tw 安全部署腳本
# 
# 使用方式: ./deploy.sh
# 
# 這個腳本會依序執行：
# 1. 備份 src/content/articles/ 到 ~/Desktop/04_歸檔/paulkuo-backups/
# 2. 備份 public/ 靜態資源
# 3. Git commit + push（確保 GitHub 有最新版本）
# 4. npm run build
# 5. npx wrangler deploy（部署到 Cloudflare）
#
# 任何步驟失敗都會立即停止，不會繼續部署。
# ============================================================

set -euo pipefail  # 任何錯誤立即停止

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKUP_DIR="$HOME/Desktop/04_歸檔/paulkuo-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_DIR="$HOME/Desktop/01_專案進行中/paulkuo-astro"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  paulkuo.tw 安全部署流程${NC}"
echo -e "${BLUE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

cd "$PROJECT_DIR"

# ── Step 1: 備份文章 ──────────────────────────────────────
echo -e "${YELLOW}📦 Step 1: 備份文章內容...${NC}"

BACKUP_PATH="$BACKUP_DIR/$TIMESTAMP"
mkdir -p "$BACKUP_PATH"

if [ -d "src/content/articles" ]; then
    cp -R src/content/articles "$BACKUP_PATH/articles"
    ARTICLE_COUNT=$(find src/content/articles -name "*.md" | wc -l | tr -d ' ')
    echo -e "${GREEN}   ✅ 已備份 ${ARTICLE_COUNT} 篇文章到 $BACKUP_PATH/articles${NC}"
else
    echo -e "${YELLOW}   ⚠️  src/content/articles/ 不存在，跳過文章備份${NC}"
fi

if [ -d "public" ]; then
    cp -R public "$BACKUP_PATH/public"
    echo -e "${GREEN}   ✅ 已備份 public/ 資料夾${NC}"
fi

# 備份 dist/ (上一次的 build output)
if [ -d "dist" ]; then
    cp -R dist "$BACKUP_PATH/dist-previous"
    echo -e "${GREEN}   ✅ 已備份上一次的 build output (dist/)${NC}"
fi

echo ""

# ── Step 2: Git commit + push ─────────────────────────────
echo -e "${YELLOW}📤 Step 2: Git commit + push...${NC}"

# 檢查是否有 remote
if ! git remote -v | grep -q "origin"; then
    echo -e "${RED}   ❌ 沒有設定 git remote origin，請先設定${NC}"
    exit 1
fi

# 檢查是否有未 commit 的變更
if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git add -A
    git commit -m "🚀 Pre-deploy backup: $TIMESTAMP"
    echo -e "${GREEN}   ✅ 已 commit 所有變更${NC}"
else
    echo -e "${GREEN}   ✅ 沒有未 commit 的變更${NC}"
fi

# Push to GitHub
if git push origin main 2>/dev/null; then
    echo -e "${GREEN}   ✅ 已 push 到 GitHub${NC}"
else
    echo -e "${YELLOW}   ⚠️  Push 失敗（可能是首次 push 或網路問題）${NC}"
    echo -e "${YELLOW}   嘗試 push --set-upstream...${NC}"
    git push --set-upstream origin main 2>/dev/null || {
        echo -e "${RED}   ❌ Push 失敗。請手動檢查 git 狀態。${NC}"
        echo -e "${RED}   備份已保存在: $BACKUP_PATH${NC}"
        exit 1
    }
    echo -e "${GREEN}   ✅ 已 push 到 GitHub${NC}"
fi

echo ""

# ── Step 3: Build ─────────────────────────────────────────
echo -e "${YELLOW}🔨 Step 3: npm run build...${NC}"

if npm run build; then
    echo -e "${GREEN}   ✅ Build 成功${NC}"
else
    echo -e "${RED}   ❌ Build 失敗！不會繼續部署。${NC}"
    echo -e "${RED}   備份已保存在: $BACKUP_PATH${NC}"
    exit 1
fi

echo ""

# ── Step 4: Deploy ────────────────────────────────────────
echo -e "${YELLOW}🚀 Step 4: 部署到 Cloudflare...${NC}"

if npx wrangler deploy; then
    echo -e "${GREEN}   ✅ 部署成功！${NC}"
else
    echo -e "${RED}   ❌ 部署失敗。${NC}"
    echo -e "${RED}   備份已保存在: $BACKUP_PATH${NC}"
    echo -e "${YELLOW}   上一個正常的 build output 在: $BACKUP_PATH/dist-previous/${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ 部署完成！${NC}"
echo -e "${GREEN}  備份位置: $BACKUP_PATH${NC}"
echo -e "${GREEN}  網站: https://paulkuo.tw${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# ── 清理舊備份（保留最近 10 次）──────────────────────────
BACKUP_COUNT=$(ls -d "$BACKUP_DIR"/20* 2>/dev/null | wc -l | tr -d ' ')
if [ "$BACKUP_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}🧹 清理舊備份（保留最近 10 次）...${NC}"
    ls -dt "$BACKUP_DIR"/20* | tail -n +11 | xargs rm -rf
    echo -e "${GREEN}   ✅ 已清理${NC}"
fi
