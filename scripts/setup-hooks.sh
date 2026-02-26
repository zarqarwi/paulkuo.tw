#!/bin/bash
# 安裝 git pre-commit hook
# 執行一次即可：bash scripts/setup-hooks.sh

ROOT="$(git rev-parse --show-toplevel)"
HOOK="$ROOT/.git/hooks/pre-commit"

cat > "$HOOK" << 'EOF'
#!/bin/bash
# 只在有 .md 或圖片變更時才跑驗證
if git diff --cached --name-only | grep -qE '\.(md|jpg|jpeg|png|webp)$'; then
  bash "$(git rev-parse --show-toplevel)/scripts/validate-articles.sh"
fi
EOF

chmod +x "$HOOK"
echo "✅ pre-commit hook 已安裝"
