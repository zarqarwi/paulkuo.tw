# Handoff → Code：Commit mcp-register-global.sh

- **建議模型**：Haiku 4.5（單一 commit、無判斷）
- **Size**：XS（2 分鐘）

---

## 起手

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw
git status scripts/mcp-register-global.sh
# 預期：Untracked
```

---

## Commit

```bash
git add scripts/mcp-register-global.sh handoffs/code--commit-mcp-register-script-2026-04-14.md

git commit -m "$(cat <<'EOF'
feat(scripts): add mcp-register-global.sh — MCP 註冊 SOP 執行層

一鍵同步註冊 MCP server 到兩個 Claude client 設定檔：
- Claude Desktop / Cowork → ~/Library/Application Support/Claude/claude_desktop_config.json
- Claude Code (user scope) → ~/.claude.json

支援兩種 transport：
- stdio（本地 Node.js MCP server）
- http（遠端 HTTP MCP，例如 Stitch / 未來 Notion remote）
  兩個 client 寫入不同格式：Claude Code 原生 type:http、
  Cowork / Desktop 需 mcp-remote bridge 包裝

每次寫入前自動備份原檔案為 *.bak.YYYYMMDD-HHMMSS。

作為治理 SOP 的執行層：CLAUDE.md 規範是被動文件，本 script
是主動防線。未來新增 MCP 一行指令解決，避免重複踩坑。

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## 不要做

- ❌ 不 push（Paul 統一 push）
- ❌ 不加 `chmod +x`（Paul 本機已設權限，git 保留 executable bit）

## 完成後

1. 回貼 commit hash
2. `worklogs/PENDING.md` 本 handoff 標 `[x]`
