#!/usr/bin/env bash
# sync-skills-to-cowork.sh
# 把 repo 裡的 skill 正本同步到 Cowork 的 plugin cache
# 用途：repo 改完 skill 後跑一次，下次 Cowork session 開場就會讀到新版
#
# 設計：
# - repo `.claude/skills/` 是 SSoT（A 層）
# - Cowork cache `/var/folders/.../claude-hostloop-plugins/<hash>/skills/` 是 mirror
# - session-handoff 例外（C 層 adaptation，獨立維護）
# - 動態定位 plugin hash 目錄，避免 Cowork 升級後路徑失效

set -euo pipefail

REPO_SKILLS="$HOME/Desktop/01_專案進行中/paulkuo.tw/.claude/skills"

# 動態找 Cowork plugin cache（hash 目錄可能變）
COWORK_BASE="$(ls -dt /var/folders/*/*/T/claude-hostloop-plugins/*/skills 2>/dev/null | head -1)"

if [ -z "$COWORK_BASE" ]; then
  echo "❌ 找不到 Cowork plugin cache 目錄"
  echo "   預期路徑：/var/folders/*/*/T/claude-hostloop-plugins/*/skills"
  echo "   可能原因：Cowork 沒在跑、或 plugin 還沒被解壓"
  exit 1
fi

echo "📂 Repo  SSoT：$REPO_SKILLS"
echo "📂 Cache mirror：$COWORK_BASE"
echo ""

# 直推 mirror 的 skill（純複製）
MIRROR_SKILLS=(paulkuo-writing paulkuo-social formosa-feedback organize-downloads)

synced=0
skipped=0
for skill in "${MIRROR_SKILLS[@]}"; do
  src="$REPO_SKILLS/$skill/SKILL.md"
  dst="$COWORK_BASE/$skill/SKILL.md"

  if [ ! -f "$src" ]; then
    echo "⚠️  skip $skill：repo 沒這個 skill"
    skipped=$((skipped + 1))
    continue
  fi

  if [ ! -d "$COWORK_BASE/$skill" ]; then
    echo "⚠️  skip $skill：cache 裡沒這個 skill 資料夾（Cowork 沒載入過？）"
    skipped=$((skipped + 1))
    continue
  fi

  if diff -q "$src" "$dst" > /dev/null 2>&1; then
    echo "✅ $skill：已同步，不動"
  else
    src_ver=$(grep -oE "Current: v[0-9]+\.[0-9]+" "$src" | head -1 || echo "?")
    dst_ver=$(grep -oE "Current: v[0-9]+\.[0-9]+" "$dst" | head -1 || echo "?")
    cp "$src" "$dst"
    echo "🔄 $skill：$dst_ver → $src_ver"
    synced=$((synced + 1))
  fi
done

echo ""

# session-handoff：檢查但不同步（C 層獨立）
echo "⚠️  session-handoff 不直推（C 層 adaptation 維護中）"
if [ -f "$REPO_SKILLS/session-handoff/SKILL.md" ] && [ -f "$COWORK_BASE/session-handoff/SKILL.md" ]; then
  a_ver=$(grep -oE "SOP v[0-9]+\.[0-9]+" "$REPO_SKILLS/session-handoff/SKILL.md" | head -1 || echo "?")
  c_ver=$(grep -oE "對齊 A 層[^v]*v[0-9]+\.[0-9]+" "$COWORK_BASE/session-handoff/SKILL.md" | head -1 || echo "?")
  echo "   A 層：$a_ver"
  echo "   C 層：$c_ver"
  if ! echo "$c_ver" | grep -qF "${a_ver#SOP }"; then
    echo "   🚨 C 層沒對齊 A 層，需要手動更新 C 層 adaptation"
    echo "      → 編輯 $COWORK_BASE/session-handoff/SKILL.md"
    echo "      → 更新 last-synced 標記"
  else
    echo "   ✅ C 層已對齊 A 層"
  fi
fi

echo ""
echo "📊 同步：$synced 個；略過：$skipped 個"
echo "📌 下次 Cowork session 開場會讀到新版"
