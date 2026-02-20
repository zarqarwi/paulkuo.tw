#!/bin/bash
# ============================================================
# paulkuo.tw 手動部署腳本（備用）
# 
# 正常情況下不需要用這個腳本！
# 推到 GitHub 就會自動 build + deploy。
#
# 這個腳本用於：
# - 自動部署出問題時的手動部署
# - 本機測試 build 是否正常
# - 備份本機檔案
#
# 使用方式: ./deploy.sh [backup|build|deploy|all]
#   backup  - 只做備份
#   build   - 只做本機 build 測試
#   deploy  - git push（觸發自動部署）
#   all     - 備份 + push（預設）
# ============================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="$HOME/Desktop/04_歸檔/paulkuo-backups"
SOURCE_DIR="$HOME/Desktop/01_專案進行中/paulkuo-astro"
CONTENT_DIR="$HOME/Desktop/01_專案進行中/paulkuo-content"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

do_backup() {
    log "開始備份..."
    mkdir -p "$BACKUP_DIR/$TIMESTAMP"
    
    # 備份原始碼（不含 node_modules）
    rsync -a --exclude='node_modules' --exclude='.astro' --exclude='dist' \
        "$SOURCE_DIR/" "$BACKUP_DIR/$TIMESTAMP/paulkuo-astro/"
    
    # 備份文章
    rsync -a "$CONTENT_DIR/" "$BACKUP_DIR/$TIMESTAMP/paulkuo-content/"
    
    log "備份完成: $BACKUP_DIR/$TIMESTAMP"
    
    # 清理 30 天前的備份
    find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} + 2>/dev/null || true
    log "已清理 30 天前的舊備份"
}

do_build() {
    log "本機 build 測試..."
    cd "$SOURCE_DIR"
    npm run build
    log "Build 成功！輸出在 dist/"
}

do_deploy() {
    log "推送原始碼到 GitHub（自動觸發部署）..."
    cd "$SOURCE_DIR"
    
    if git diff --quiet && git diff --staged --quiet; then
        warn "原始碼沒有變更，跳過 push"
    else
        git add -A
        git commit -m "deploy: 手動部署 $TIMESTAMP"
        git push origin main
        log "原始碼已推送，GitHub Actions 會自動 build + deploy"
    fi
    
    cd "$CONTENT_DIR"
    if git diff --quiet && git diff --staged --quiet; then
        warn "文章沒有變更，跳過 push"
    else
        git add -A
        git commit -m "content: 更新文章 $TIMESTAMP"
        git push origin main
        log "文章已推送，會自動觸發主站 rebuild"
    fi
}

# 主程式
ACTION="${1:-all}"

echo "============================================"
echo "  paulkuo.tw 部署腳本"
echo "  時間: $(date '+%Y/%m/%d %H:%M:%S')"
echo "  動作: $ACTION"
echo "============================================"

case "$ACTION" in
    backup)
        do_backup
        ;;
    build)
        do_build
        ;;
    deploy)
        do_deploy
        ;;
    all)
        do_backup
        do_deploy
        ;;
    *)
        err "未知動作: $ACTION（可用: backup, build, deploy, all）"
        ;;
esac

log "完成！"
