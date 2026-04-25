#!/usr/bin/env bash
# pre-commit hook wrapper for governance-lint.sh
# Per H7 ADR §三 掛載點 + §五 Phase 1
set -euo pipefail
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
exec "$REPO_ROOT/scripts/governance-lint.sh" --pre-commit
