#!/bin/bash
# paulkuo.tw — 跨子專案影響偵測 commit-msg hook
# 當 commit 涉及共用檔案時，強制要求 commit message 包含 [影響: ...] 標注
# 共用檔案清單從 docs/shared-files.json 動態讀取（單一事實來源）
# 安裝位置：.git/hooks/commit-msg

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# ── 找到 repo 根目錄 ──
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
JSON_FILE="$REPO_ROOT/docs/shared-files.json"

if [[ ! -f "$JSON_FILE" ]]; then
  echo "⚠️  找不到 $JSON_FILE，跳過跨專案影響檢查"
  exit 0
fi

# ── 從 JSON 解析共用檔案清單 ──
# 用 python 解析（macOS 和大多數 Linux 都有）
# 共用檔案從 shared-files.json 讀，子專案名稱從 projects.json 讀（路線 B：關注點分離）
PROJECTS_FILE="$REPO_ROOT/worklogs/governance/projects.json"

SHARED_FILES_LIST=$(python3 -c "
import json, sys

# 讀 projects.json 建立 id → name 對照表
id_to_name = {}
all_names = []
try:
    with open('$PROJECTS_FILE') as f:
        pdata = json.load(f)
    for p in pdata.get('projects', []):
        id_to_name[p['id']] = p['name']
        all_names.append(p['name'])
except:
    pass

def resolve_affects(ids):
    \"\"\"將 project_id 列表轉為顯示名稱，'*' 展開為全部\"\"\"
    names = []
    for pid in ids:
        if pid == '*':
            return '全部'
        name = id_to_name.get(pid, pid)  # 查不到就原樣顯示
        if name not in names:
            names.append(name)
    return ', '.join(names) if names else '未知'

with open('$JSON_FILE') as f:
    data = json.load(f)
critical = [(e['file'], '極高風險', resolve_affects(e['affects'])) for e in data.get('critical', [])]
shared = [(e['file'], '共用模組', resolve_affects(e['affects'])) for e in data.get('shared_modules', [])]
ai = [(e['file'], 'AI Ready', resolve_affects(e['affects'])) for e in data.get('ai_ready_auto', [])]
for f, cat, affects in critical + shared + ai:
    print(f'{f}|{cat}|{affects}')
" 2>/dev/null)

# 從 projects.json 取子專案名稱列表（用於提示訊息）
PROJECT_NAMES=$(python3 -c "
import json
try:
    with open('$PROJECTS_FILE') as f:
        data = json.load(f)
    names = [p['name'] for p in data.get('projects', [])]
    print('、'.join(names))
except: print('Paulkuo 網站、白沙屯 ESG 繞境、LLM Wiki、AI 協作力評量、讓 AI 懂我、阿哥拉廣場')
" 2>/dev/null)

if [[ -z "$SHARED_FILES_LIST" ]]; then
  echo "⚠️  無法解析 $JSON_FILE，跳過跨專案影響檢查"
  exit 0
fi

# ── 取得本次 commit 涉及的檔案 ──
STAGED_FILES=$(git diff --cached --name-only)

# ── worklog 同層原子化檢查（憲法第四條補款）──
# staged 的 worklog：「狀態變更」說完成的項目不應在「待辦快照」仍掛 [ ]

STAGED_WORKLOGS=$(echo "$STAGED_FILES" | grep '^worklogs/worklog-.*\.md$')

if [[ -n "$STAGED_WORKLOGS" ]]; then
  for wlog in $STAGED_WORKLOGS; do
    CONTRADICTIONS=$(python3 -c "
import re, sys

try:
    with open('$wlog') as f:
        content = f.read()
except:
    sys.exit(0)

status_section = re.search(r'## 狀態變更\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
if not status_section:
    sys.exit(0)

completed = set()
for line in status_section.group(1).split('\n'):
    m = re.match(r'^- (.+?)：.*(?:→\s*(?:已完成|✅|\[x\]|已解決|fixed))', line, re.IGNORECASE)
    if m:
        completed.add(m.group(1).strip())

if not completed:
    sys.exit(0)

todo_section = re.search(r'## 待辦快照\n(.*?)(?=\n## |\Z)', content, re.DOTALL)
if not todo_section:
    sys.exit(0)

contradictions = []
for line in todo_section.group(1).split('\n'):
    m = re.match(r'^- \[ \] (.+)', line)
    if m:
        item = m.group(1).strip()
        for c in completed:
            if c in item or item in c:
                contradictions.append(f'{c} (狀態變更) vs {item} (待辦快照)')

for c in contradictions:
    print(c)
" 2>/dev/null)

    if [[ -n "$CONTRADICTIONS" ]]; then
      echo ""
      echo "╔══════════════════════════════════════════════════════════╗"
      echo "║  ⚠️  worklog 原子化違反（憲法第四條補款）                   ║"
      echo "╚══════════════════════════════════════════════════════════╝"
      echo ""
      echo "檔案：$wlog"
      echo "以下項目在「狀態變更」標完成，但「待辦快照」仍掛著 [ ]："
      echo "$CONTRADICTIONS" | while read -r line; do
        echo "  - $line"
      done
      echo ""
      echo "請同步更新兩個區塊，確保同一事實的表達一致。"
      echo "（--no-verify 可跳過此檢查）"
      echo ""
      exit 1
    fi
  done
fi

TOUCHED_CRITICAL=()
TOUCHED_SHARED=()
AFFECTED_PROJECTS=()

while IFS='|' read -r shared_file category affects; do
  for staged in $STAGED_FILES; do
    if [[ "$staged" == "$shared_file" ]]; then
      if [[ "$category" == "極高風險" ]]; then
        TOUCHED_CRITICAL+=("$shared_file")
      else
        TOUCHED_SHARED+=("$shared_file")
      fi
      # 收集受影響的子專案（去重）
      IFS=', ' read -ra proj_array <<< "$affects"
      for proj in "${proj_array[@]}"; do
        if [[ ! " ${AFFECTED_PROJECTS[*]} " =~ " ${proj} " ]]; then
          AFFECTED_PROJECTS+=("$proj")
        fi
      done
    fi
  done
done <<< "$SHARED_FILES_LIST"

# ── 沒有動到共用檔案就放行 ──
if [[ ${#TOUCHED_CRITICAL[@]} -eq 0 && ${#TOUCHED_SHARED[@]} -eq 0 ]]; then
  exit 0
fi

# ── 組合建議標注 ──
SUGGESTED_AFFECTS=$(IFS=' + '; echo "${AFFECTED_PROJECTS[*]}")

# ── 檢查 commit message 是否包含 [影響: ...] 標注 ──
if ! echo "$COMMIT_MSG" | grep -qE '\[影響:.*\]'; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  跨子專案影響偵測：缺少影響範圍標注                    ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""

  if [[ ${#TOUCHED_CRITICAL[@]} -gt 0 ]]; then
    echo "🔴 極高風險（影響所有子專案）："
    for f in "${TOUCHED_CRITICAL[@]}"; do
      echo "   - $f"
    done
  fi

  if [[ ${#TOUCHED_SHARED[@]} -gt 0 ]]; then
    echo "🟡 跨專案共用模組："
    for f in "${TOUCHED_SHARED[@]}"; do
      echo "   - $f"
    done
  fi

  echo ""
  echo "建議在 commit message 加上："
  echo "  [影響: $SUGGESTED_AFFECTS]"
  echo ""
  echo "已註冊的子專案：${PROJECT_NAMES:-主站、Formosa、Wiki、ACP、AI Ready、TQEF}"
  echo "如果確定不影響其他子專案，可以寫 [影響: 僅 XXX]"
  echo ""
  exit 1
fi

# ── 有標注就放行，但印提醒 ──
echo ""
echo "✅ 跨子專案影響標注已確認"
if [[ ${#TOUCHED_CRITICAL[@]} -gt 0 ]]; then
  echo "   🔴 極高風險檔案：${TOUCHED_CRITICAL[*]}"
fi
if [[ ${#TOUCHED_SHARED[@]} -gt 0 ]]; then
  echo "   🟡 共用模組：${TOUCHED_SHARED[*]}"
fi
echo "   📋 部署後記得跑 smoke test（見 docs/shared-file-impact-map.md）"
echo ""

exit 0
