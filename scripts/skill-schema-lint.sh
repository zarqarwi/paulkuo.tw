#!/usr/bin/env bash
# skill-schema-lint.sh — scan .claude/skills/**/SKILL.md for frontmatter schema issues
# Supports SKILLS_DIR env var override (default: ~/.claude/skills)
# Exit code: 1 if any FAIL found, 0 if only WARN or all PASS

SKILLS_DIR="${SKILLS_DIR:-$HOME/.claude/skills}"

PASS=0
WARN=0
FAIL=0
TOTAL=0

check_skill() {
  local file="$1"
  local dir
  dir="$(dirname "$file")"
  local dirname
  dirname="$(basename "$dir")"
  local file_fail=0
  local file_warn=0

  TOTAL=$((TOTAL + 1))

  # Check frontmatter exists
  local first_line
  first_line="$(head -1 "$file")"
  if [ "$first_line" != "---" ]; then
    echo "❌ FAIL  $file"
    echo "         → 缺少 frontmatter（第一行應為 ---）"
    FAIL=$((FAIL + 1))
    return
  fi

  # Extract frontmatter block (between first and second ---)
  local fm
  fm="$(python3 - "$file" <<'PYEOF'
import sys, yaml

path = sys.argv[1]
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

if not content.startswith('---'):
    print("NO_FRONTMATTER")
    sys.exit(0)

# Find closing ---
rest = content[3:]
end = rest.find('\n---')
if end == -1:
    print("NO_CLOSING_FENCE")
    sys.exit(0)

fm_text = rest[:end]
try:
    data = yaml.safe_load(fm_text)
    if data is None:
        print("EMPTY_FRONTMATTER")
        sys.exit(0)
    import json
    print(json.dumps(data))
except Exception as e:
    print(f"YAML_ERROR: {e}")
PYEOF
)"

  # Handle python parse errors
  case "$fm" in
    NO_FRONTMATTER)
      echo "❌ FAIL  $file"
      echo "         → 缺少 frontmatter"
      FAIL=$((FAIL + 1))
      return
      ;;
    NO_CLOSING_FENCE)
      echo "❌ FAIL  $file"
      echo "         → frontmatter 未閉合（找不到結尾 ---）"
      FAIL=$((FAIL + 1))
      return
      ;;
    EMPTY_FRONTMATTER)
      echo "❌ FAIL  $file"
      echo "         → frontmatter 為空"
      FAIL=$((FAIL + 1))
      return
      ;;
    YAML_ERROR*)
      echo "❌ FAIL  $file"
      echo "         → YAML 解析失敗：$fm"
      FAIL=$((FAIL + 1))
      return
      ;;
  esac

  # Extract name and description via python
  local name desc desc_len
  name="$(python3 -c "import json,sys; d=json.loads('''$fm'''); print(d.get('name','__MISSING__'))" 2>/dev/null || echo "__PARSE_ERR__")"
  desc="$(python3 -c "import json,sys; d=json.loads('''$fm'''); print(d.get('description','__MISSING__'))" 2>/dev/null || echo "__PARSE_ERR__")"

  # Use a more robust extraction to avoid shell quoting issues
  local tmpjson
  tmpjson="$(mktemp)"
  echo "$fm" > "$tmpjson"
  name="$(python3 -c "
import json, sys
with open('$tmpjson') as f:
    d = json.load(f)
print(d.get('name', '__MISSING__'))
" 2>/dev/null || echo "__PARSE_ERR__")"
  desc="$(python3 -c "
import json, sys
with open('$tmpjson') as f:
    d = json.load(f)
print(d.get('description', '__MISSING__'))
" 2>/dev/null || echo "__PARSE_ERR__")"
  rm -f "$tmpjson"

  # Check name field
  if [ "$name" = "__MISSING__" ] || [ "$name" = "null" ] || [ -z "$name" ]; then
    echo "❌ FAIL  $file"
    echo "         → 缺少必填欄位 \`name\`"
    file_fail=$((file_fail + 1))
  elif [ "$name" = "__PARSE_ERR__" ]; then
    echo "❌ FAIL  $file"
    echo "         → name 欄位解析失敗"
    file_fail=$((file_fail + 1))
  else
    # Check kebab-case: only [a-z0-9-]
    if echo "$name" | grep -qE '[^a-z0-9:-]'; then
      echo "❌ FAIL  $file"
      echo "         → name 格式錯誤（含非 kebab-case 字元）：$name"
      file_fail=$((file_fail + 1))
    fi
    # Check name matches dirname (allow plugin:name form)
    local expected_name="$dirname"
    local stripped_name="${name#*:}"  # strip plugin: prefix if present
    if [ "$stripped_name" != "$dirname" ]; then
      echo "❌ FAIL  $file"
      echo "         → name（$name）與資料夾名（$dirname）不一致"
      file_fail=$((file_fail + 1))
    fi
  fi

  # Check description field
  if [ "$desc" = "__MISSING__" ] || [ "$desc" = "null" ] || [ -z "$desc" ]; then
    echo "❌ FAIL  $file"
    echo "         → 缺少必填欄位 \`description\`"
    file_fail=$((file_fail + 1))
  elif [ "$desc" = "__PARSE_ERR__" ]; then
    echo "❌ FAIL  $file"
    echo "         → description 欄位解析失敗"
    file_fail=$((file_fail + 1))
  else
    desc_len="${#desc}"
    if [ "$desc_len" -lt 20 ]; then
      echo "⚠️  WARN  $file"
      echo "         → description 過短（${desc_len} 字元，建議至少 20）"
      file_warn=$((file_warn + 1))
    elif [ "$desc_len" -gt 1024 ]; then
      echo "⚠️  WARN  $file"
      echo "         → description 過長（${desc_len} 字元，上限建議 1024）"
      file_warn=$((file_warn + 1))
    fi
  fi

  if [ "$file_fail" -gt 0 ]; then
    FAIL=$((FAIL + 1))
  elif [ "$file_warn" -gt 0 ]; then
    WARN=$((WARN + 1))
  else
    echo "✅ PASS  $file"
    PASS=$((PASS + 1))
  fi
}

# Find all SKILL.md files
if [ ! -d "$SKILLS_DIR" ]; then
  echo "⚠️  WARN  SKILLS_DIR 不存在：$SKILLS_DIR（0 files scanned）"
  echo ""
  echo "統計：0 files scanned, 0 pass, 0 warn, 0 fail"
  exit 0
fi

while IFS= read -r -d '' file; do
  check_skill "$file"
done < <(find "$SKILLS_DIR" -name "SKILL.md" -print0 | sort -z)

echo ""
echo "統計：${TOTAL} files scanned, ${PASS} pass, ${WARN} warn, ${FAIL} fail"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
