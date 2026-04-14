#!/usr/bin/env bash
# mcp-register-global.sh
# 一鍵把 MCP server 註冊到兩個設定檔，讓任何 Claude 客戶端都能用：
#   1. Claude Desktop / Cowork → ~/Library/Application Support/Claude/claude_desktop_config.json
#   2. Claude Code (user scope) → ~/.claude.json 的 mcpServers
#
# 每次寫入前會自動備份原檔案為 *.bak.YYYYMMDD-HHMMSS
#
# 支援兩種 transport：
#
# === STDIO 模式（本地 Node.js MCP server）===
#   bash scripts/mcp-register-global.sh add <name> --cmd <command> \
#        [--arg <arg> ...] [--env KEY=VALUE ...]
#
#   範例：
#     bash scripts/mcp-register-global.sh add filesystem \
#       --cmd /usr/local/bin/npx \
#       --arg -y --arg @modelcontextprotocol/server-filesystem --arg /Users/me/Desktop
#
# === HTTP 模式（遠端 HTTP MCP server，例如 Stitch、未來 Notion remote 等）===
#   bash scripts/mcp-register-global.sh add <name> --http \
#        --url <url> [--header "Key: value" ...]
#
#   範例：
#     bash scripts/mcp-register-global.sh add stitch --http \
#       --url https://stitch.googleapis.com/mcp \
#       --header "X-Goog-Api-Key: AQ.xxxxx"
#
#   兩個 client 會寫入不同格式：
#     - Claude Code：原生 type:"http" 格式
#     - Cowork/Desktop：用 mcp-remote stdio↔HTTP bridge 包裝（因為 Desktop 還不支援 type:http）
#
# === 其他 ===
#   bash scripts/mcp-register-global.sh remove <name>     # 兩個 config 都移除
#   bash scripts/mcp-register-global.sh list              # 列出兩邊各自有哪些 MCP
#
# 裝完後：
#   - 重啟 Cowork / Claude Desktop app
#   - 新開的 Claude Code session 會自動看到
#   - 既有對話 session 不會動態載入新工具，要新開對話

set -euo pipefail

DESKTOP_CFG="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
CODE_CFG="$HOME/.claude.json"
NPX_PATH="/usr/local/bin/npx"

die()  { echo "❌ $*" >&2; exit 1; }
info() { echo "▶ $*"; }
ok()   { echo "✅ $*"; }

command -v jq >/dev/null || die "jq 沒裝。先跑：brew install jq"

ACTION="${1:-}"
if [[ -z "$ACTION" ]]; then
  sed -n '4,40p' "$0"
  exit 1
fi
shift || true

backup() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  local b="${f}.bak.$(date +%Y%m%d-%H%M%S)"
  cp "$f" "$b"
  info "備份 → $b"
}

ensure_shape() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo '{"mcpServers":{}}' > "$f"
    return
  fi
  if ! jq -e 'type == "object"' "$f" >/dev/null 2>&1; then
    die "$f 不是合法的 JSON object，請手動檢查"
  fi
  if ! jq -e 'has("mcpServers")' "$f" >/dev/null 2>&1; then
    local tmp; tmp=$(mktemp)
    jq '. + {mcpServers: {}}' "$f" > "$tmp" && mv "$tmp" "$f"
  fi
}

# write_entry <file> <name> <entry-json>
write_entry() {
  local F="$1" NAME="$2" ENTRY="$3"
  ensure_shape "$F"
  backup "$F"
  local tmp; tmp=$(mktemp)
  jq --arg name "$NAME" --argjson entry "$ENTRY" \
    '.mcpServers[$name] = $entry' "$F" > "$tmp" && mv "$tmp" "$F"
  ok "寫入 $F"
}

do_add() {
  local NAME="${1:-}"
  [[ -z "$NAME" || "$NAME" == --* ]] && die "缺 MCP 名稱（用法見 --help）"
  shift

  local MODE="stdio"
  local CMD=""
  local URL=""
  local ARGS=()
  local ENVS=()
  local HEADERS=()

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --http)    MODE="http"; shift;;
      --url)     URL="${2:-}"; shift 2;;
      --header)  HEADERS+=("${2:-}"); shift 2;;
      --cmd)     CMD="${2:-}"; shift 2;;
      --arg)     ARGS+=("${2:-}"); shift 2;;
      --env)     ENVS+=("${2:-}"); shift 2;;
      *) die "未知參數：$1";;
    esac
  done

  if [[ "$MODE" == "http" ]]; then
    add_http "$NAME"
  else
    add_stdio "$NAME"
  fi
}

add_stdio() {
  local NAME="$1"
  [[ -z "$CMD" ]] && die "stdio 模式缺 --cmd <command>"

  local ARGS_JSON="[]"
  if [[ ${#ARGS[@]} -gt 0 ]]; then
    ARGS_JSON=$(printf '%s\n' "${ARGS[@]}" | jq -R . | jq -s .)
  fi

  local ENV_JSON="{}"
  if [[ ${#ENVS[@]} -gt 0 ]]; then
    ENV_JSON=$(
      for kv in "${ENVS[@]}"; do
        [[ "$kv" != *=* ]] && die "--env 格式錯誤（應為 KEY=VALUE）：$kv"
        local k="${kv%%=*}" v="${kv#*=}"
        jq -n --arg k "$k" --arg v "$v" '{($k): $v}'
      done | jq -s 'add // {}'
    )
  fi

  local ENTRY
  if [[ "$(echo "$ENV_JSON" | jq 'length')" -gt 0 ]]; then
    ENTRY=$(jq -n --arg cmd "$CMD" --argjson args "$ARGS_JSON" --argjson env "$ENV_JSON" \
      '{command: $cmd, args: $args, env: $env}')
  else
    ENTRY=$(jq -n --arg cmd "$CMD" --argjson args "$ARGS_JSON" \
      '{command: $cmd, args: $args}')
  fi

  write_entry "$DESKTOP_CFG" "$NAME" "$ENTRY"
  write_entry "$CODE_CFG" "$NAME" "$ENTRY"

  echo
  info "新的 $NAME 設定（兩邊相同 stdio 格式）："
  jq --arg n "$NAME" '.mcpServers[$n]' "$DESKTOP_CFG"
  echo
  ok "完成。請重啟 Cowork / Claude Desktop；新開 Claude Code session 也會看到。"
}

add_http() {
  local NAME="$1"
  [[ -z "$URL" ]] && die "http 模式缺 --url <url>"

  # 把 --header "Key: value" 解析成 {key: value} JSON object
  local HEADERS_JSON="{}"
  if [[ ${#HEADERS[@]} -gt 0 ]]; then
    HEADERS_JSON=$(
      for h in "${HEADERS[@]}"; do
        [[ "$h" != *:* ]] && die "--header 格式錯誤（應為 'Key: value'）：$h"
        local k="${h%%:*}" rest="${h#*:}"
        # 去掉 value 前的空格
        local v="${rest# }"
        jq -n --arg k "$k" --arg v "$v" '{($k): $v}'
      done | jq -s 'add // {}'
    )
  fi

  # === Claude Code：原生 type:http 格式 ===
  local CODE_ENTRY
  CODE_ENTRY=$(jq -n --arg url "$URL" --argjson h "$HEADERS_JSON" \
    '{type: "http", url: $url, headers: $h}')

  # === Cowork/Desktop：mcp-remote bridge 包成 stdio ===
  # args: ["-y", "mcp-remote", URL, "--header", "K1: V1", "--header", "K2: V2", ...]
  local BRIDGE_ARGS_JSON
  BRIDGE_ARGS_JSON=$(jq -n --arg url "$URL" --argjson h "$HEADERS_JSON" '
    ["-y", "mcp-remote", $url] +
    ($h | to_entries | map(["--header", "\(.key): \(.value)"]) | add // [])
  ')
  local DESKTOP_ENTRY
  DESKTOP_ENTRY=$(jq -n --arg cmd "$NPX_PATH" --argjson args "$BRIDGE_ARGS_JSON" \
    '{command: $cmd, args: $args}')

  write_entry "$DESKTOP_CFG" "$NAME" "$DESKTOP_ENTRY"
  write_entry "$CODE_CFG"    "$NAME" "$CODE_ENTRY"

  echo
  info "Cowork/Desktop entry（mcp-remote bridge）："
  jq --arg n "$NAME" '.mcpServers[$n]' "$DESKTOP_CFG"
  echo
  info "Claude Code entry（type:http 原生）："
  jq --arg n "$NAME" '.mcpServers[$n]' "$CODE_CFG"
  echo
  ok "完成。請重啟 Cowork / Claude Desktop；新開 Claude Code session 也會看到。"
}

do_remove() {
  local NAME="${1:-}"
  [[ -z "$NAME" ]] && die "缺 MCP 名稱"
  for F in "$DESKTOP_CFG" "$CODE_CFG"; do
    [[ -f "$F" ]] || continue
    backup "$F"
    local tmp; tmp=$(mktemp)
    jq --arg n "$NAME" 'del(.mcpServers[$n])' "$F" > "$tmp" && mv "$tmp" "$F"
    ok "$F 已移除 $NAME"
  done
}

do_list() {
  echo "=== Desktop / Cowork ($DESKTOP_CFG) ==="
  if [[ -f "$DESKTOP_CFG" ]]; then
    jq -r '.mcpServers // {} | to_entries[] | "\(.key)\t[\(if .value.type == "http" then "http" elif .value.command then "stdio" else "?" end)]"' "$DESKTOP_CFG" 2>/dev/null || echo "(無 mcpServers)"
  else
    echo "(檔案不存在)"
  fi
  echo
  echo "=== Claude Code user scope ($CODE_CFG) ==="
  if [[ -f "$CODE_CFG" ]]; then
    jq -r '.mcpServers // {} | to_entries[] | "\(.key)\t[\(if .value.type == "http" then "http" elif .value.command then "stdio" else "?" end)]"' "$CODE_CFG" 2>/dev/null || echo "(無 mcpServers)"
  else
    echo "(檔案不存在)"
  fi
}

case "$ACTION" in
  add)            do_add "$@";;
  remove|rm)      do_remove "$@";;
  list|ls)        do_list;;
  -h|--help|help) sed -n '4,40p' "$0";;
  *) die "未知 action：$ACTION（用 add / remove / list）";;
esac
