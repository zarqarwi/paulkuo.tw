#!/usr/bin/env bash
# governance-lint.sh — paulkuo.tw governance regulations enforcement
# Spec: docs/governance/adr-governance-lint-he-lu-2026-04-25.md (H7)
# Phase: 1 (checks 1 + 3 enabled; checks 2/4/5 implemented but disabled)
# Implemented: 2026-04-25 per Q2 D3 finding (commit 9bc60c5)

set -uo pipefail  # 不設 -e：要逐項檢查，單項失敗不中斷後續

REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "$REPO_ROOT" ]]; then
  echo "❌ 不在 git repo 內"
  exit 1
fi
cd "$REPO_ROOT"

# 解析 mode
MODE="${1:---pre-commit}"  # --pre-commit | --ci-mode | --manual

# 結果計數
STRICT_FAIL=0
WARNING=0
GRANDFATHERED_COUNT=0

# Grandfather 清單（H7 通過前歷史 handoffs，manual 模式跳過）
# 詳見 .governance-lint-grandfathered 檔案頂部 header
GRANDFATHER_FILE="$REPO_ROOT/.governance-lint-grandfathered"

is_grandfathered() {
  local target="$1"
  [[ ! -f "$GRANDFATHER_FILE" ]] && return 1
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" == "$target" ]]; then
      return 0
    fi
  done < "$GRANDFATHER_FILE"
  return 1
}

echo "🔍 governance-lint.sh — paulkuo.tw 治理規範檢查"
echo "Mode: $MODE"
echo ""

# ─────────────────────────────
# Check 1: Handoff ADR 欄位完整性（Strict）
# H7 ADR §第一條 1
# ─────────────────────────────
check_handoff_fields() {
  local files
  if [[ "$MODE" == "--pre-commit" ]]; then
    files=$(git diff --cached --name-only --diff-filter=AM | grep '^handoffs/.*\.md$' || true)
  else
    files=$(find handoffs -name '*.md' -type f 2>/dev/null || true)
  fi
  [[ -z "$files" ]] && return

  # 用 while read 而非 for in $files 避免含空格檔名 word splitting bug
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue

    # Grandfather 跳過（H7 通過前歷史 handoffs）
    if is_grandfathered "$f"; then
      GRANDFATHERED_COUNT=$((GRANDFATHERED_COUNT + 1))
      continue
    fi

    # frontmatter status 欄位
    if ! head -20 "$f" | grep -qE '^status:\s*(Draft|Accepted|Superseded|Deprecated)\s*$'; then
      echo "❌ FAIL  $f"
      echo "         → frontmatter 缺 status 欄位（應為 Draft|Accepted|Superseded|Deprecated）"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
    # Consequences 章節
    if ! grep -qE '^## Consequences\s*$' "$f"; then
      echo "❌ FAIL  $f"
      echo "         → 缺 ## Consequences 章節"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
  done <<< "$files"
}

# ─────────────────────────────
# Check 2: F-ID 格式（Warning）
# H7 ADR §第一條 2
# PHASE_2: not enabled yet
# ─────────────────────────────
check_fid_format() {
  local fids
  fids=$(git diff --cached --unified=0 2>/dev/null | grep -oE 'F-[A-Za-z0-9-]+' | sort -u || true)
  [[ -z "$fids" ]] && return

  for fid in $fids; do
    if ! echo "$fid" | grep -qE '^F-[a-z0-9][a-z0-9-]*-[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
      echo "⚠️  WARN  F-ID 格式不合規：$fid"
      echo "         → 應為 F-{kebab-name}-{YYYY-MM-DD}"
      WARNING=$((WARNING + 1))
    fi
  done
}

# ─────────────────────────────
# Check 3: skill pillar 白名單（Strict）
# H7 ADR §第一條 3
# ─────────────────────────────
check_skill_pillar() {
  local files
  files=$(find .claude/skills -name 'SKILL.md' -type f 2>/dev/null || true)
  [[ -z "$files" ]] && return

  local valid_pillars="ai|circular|faith|startup|life|governance"

  # 用 while read 而非 for in $files 避免含空格檔名 word splitting bug
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    local pillar
    # python3 yaml 解析，ImportError 時 fallback 到 grep
    if python3 -c "import yaml" 2>/dev/null; then
      pillar=$(python3 -c "
import yaml, sys
with open('$f') as fp:
    c = fp.read()
if not c.startswith('---'):
    sys.exit(0)
end = c[3:].find('\n---')
if end == -1:
    sys.exit(0)
fm = yaml.safe_load(c[3:3+end])
p = fm.get('pillar') if fm else None
print(p if p else '')
" 2>/dev/null || echo "")
    else
      # fallback: 只掃 frontmatter（第一 --- 到第二 --- 之間），忽略 # 行內注解
      pillar=$(awk 'NR==1{next} /^---/{exit} /^pillar:[[:space:]]/{print; exit}' "$f" | sed 's/^pillar:[[:space:]]*//' | awk '{print $1}' || echo "")
    fi

    if [[ -n "$pillar" ]] && ! echo "$pillar" | grep -qE "^(${valid_pillars})$"; then
      echo "❌ FAIL  $f"
      echo "         → pillar '$pillar' 不在白名單（${valid_pillars//|/, }）"
      STRICT_FAIL=$((STRICT_FAIL + 1))
    fi
  done <<< "$files"
}

# ─────────────────────────────
# Check 4: PENDING.md 五符號（Strict）
# H7 ADR §第一條 4
# PHASE_2: not enabled yet
# ─────────────────────────────
check_pending_symbols() {
  local f="worklogs/PENDING.md"
  [[ ! -f "$f" ]] && return

  local bad
  bad=$(grep -nE '^-\s+\[' "$f" | grep -vE '^[0-9]+:-\s+\[[ ~>x-]\]' || true)
  if [[ -n "$bad" ]]; then
    echo "❌ FAIL  PENDING.md 有非五符號 checkbox:"
    echo "$bad" | while IFS= read -r line; do echo "         → $line"; done
    STRICT_FAIL=$((STRICT_FAIL + 1))
  fi
}

# ─────────────────────────────
# Check 5: length-budget-status.md 時效（Warning）
# H7 ADR §第一條 5
# PHASE_3: not enabled yet（前提：H5 length-budget-status.md 建立後）
# ─────────────────────────────
check_length_budget_staleness() {
  local f="docs/governance/length-budget-status.md"
  [[ ! -f "$f" ]] && return  # 檔案不存在跳過（H5 執行層尚未完成時）

  local last
  last=$(grep -oE 'Last-updated:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" | head -1 | awk '{print $2}' || echo "")
  if [[ -z "$last" ]]; then
    echo "⚠️  WARN  $f 缺 Last-updated 欄位"
    WARNING=$((WARNING + 1))
    return
  fi

  local now_ts last_ts diff_days
  now_ts=$(date +%s)
  # macOS BSD date vs Linux GNU date
  if date -j -f '%Y-%m-%d' "$last" +%s > /dev/null 2>&1; then
    last_ts=$(date -j -f '%Y-%m-%d' "$last" +%s)  # macOS
  else
    last_ts=$(date -d "$last" +%s 2>/dev/null || echo "")  # Linux
  fi
  if [[ -z "$last_ts" ]]; then
    echo "⚠️  WARN  $f Last-updated 欄位格式錯誤：$last"
    WARNING=$((WARNING + 1))
    return
  fi
  diff_days=$(( (now_ts - last_ts) / 86400 ))
  if [[ "$diff_days" -gt 7 ]]; then
    echo "⚠️  WARN  $f 過期 $diff_days 天（上限 7 天）"
    WARNING=$((WARNING + 1))
  fi
}

# ─────────────────────────────
# 執行（Phase 1：只啟用 check 1 + 3）
# ─────────────────────────────
check_handoff_fields    # Strict
check_skill_pillar      # Strict
# PHASE_2: check_fid_format            # Warning, not enabled yet
# PHASE_2: check_pending_symbols       # Strict, not enabled yet
# PHASE_3: check_length_budget_staleness  # Warning, requires H5 length-budget-status.md

echo ""
echo "──────────────────────────────"
echo "Strict fails:    $STRICT_FAIL"
echo "Warnings:        $WARNING"
if [[ "$GRANDFATHERED_COUNT" -gt 0 ]]; then
  echo "📦 Grandfathered: $GRANDFATHERED_COUNT (pre-H7 historical, see .governance-lint-grandfathered)"
fi
echo ""

if [[ "$STRICT_FAIL" -gt 0 ]]; then
  echo "❌ 有 Strict 級錯誤，commit 被擋"
  echo "   如需強制 commit，使用 git commit --no-verify 並在 message 加 [skip-lint-recovery]"
  exit 1
fi

if [[ "$WARNING" -gt 0 ]]; then
  echo "⚠️  有 Warning 級問題，commit 通過但請後續修復"
fi

exit 0
