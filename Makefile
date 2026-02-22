# paulkuo.tw — 一鍵工作流
# 使用: make <command>

SHELL := /bin/bash
PROJECT := ~/Desktop/01_專案進行中/paulkuo.tw
DEBATES := ~/Desktop/02_參考資料/debates

# ── 常用指令 ──────────────────────────────────────────

.PHONY: help status sync check publish dev build

help: ## 顯示所有可用指令
	@echo ""
	@echo "  paulkuo.tw 工作流指令"
	@echo "  ──────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?##' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?##"}; {printf "  %-18s %s\n", $$1, $$2}'
	@echo ""

status: ## 查看本地狀態（git + manifest + Actions）
	@echo "──── Git 狀態 ────"
	@cd $(PROJECT) && echo "branch: $$(git branch --show-current)" && echo "HEAD:   $$(git rev-parse --short HEAD)" && echo "dirty:  $$(git status --porcelain | wc -l | tr -d ' ') files"
	@echo ""
	@echo "──── 文章計數 ────"
	@cd $(PROJECT) && echo "繁中: $$(ls src/content/articles/*.md 2>/dev/null | wc -l | tr -d ' ')" && echo "EN:   $$(ls src/content/articles/en/*.md 2>/dev/null | wc -l | tr -d ' ')" && echo "JA:   $$(ls src/content/articles/ja/*.md 2>/dev/null | wc -l | tr -d ' ')" && echo "ZH-CN:$$(ls src/content/articles/zh-cn/*.md 2>/dev/null | wc -l | tr -d ' ')"
	@echo ""
	@echo "──── Manifest 狀態 ────"
	@cd $(PROJECT) && python3 -c "import json; m=json.load(open('data/translation-manifest.json')); total=len(m); complete=sum(1 for v in m.values() if len(v.get('translations',{}))==3); print(f'Total: {total}, Complete: {complete}, Missing: {total-complete}')"
	@echo ""
	@echo "──── 最近 Actions ────"
	@curl -s 'https://api.github.com/repos/zarqarwi/paulkuo.tw/actions/runs?per_page=5' | python3 -c "import json,sys; [print(f\"  {r['name'][:25]:25s} | {str(r['conclusion']):8s} | {r['created_at'][:16]}\") for r in json.load(sys.stdin).get('workflow_runs',[])]" 2>/dev/null || echo "  (需要網路連線)"

sync: ## 從 GitHub 拉回最新（翻譯、deploy 結果）
	@cd $(PROJECT) && git pull origin main && echo "✅ Synced to $$(git rev-parse --short HEAD)"

check: ## 比對本地 vs GitHub 是否一致
	@cd $(PROJECT) && \
	LOCAL=$$(git rev-parse HEAD) && \
	REMOTE=$$(git ls-remote origin HEAD | cut -f1) && \
	if [ "$$LOCAL" = "$$REMOTE" ]; then \
		echo "✅ 本地與 GitHub 同步 ($$LOCAL)"; \
	else \
		echo "⚠️  不同步！本地: $${LOCAL:0:8} / GitHub: $${REMOTE:0:8}"; \
		echo "   執行 make sync 或 make publish 來同步"; \
	fi

publish: ## git add + commit + push（觸發自動翻譯 + 部署 + 社群）
	@cd $(PROJECT) && \
	if [ -z "$$(git status --porcelain)" ]; then \
		echo "ℹ️  沒有變更可提交"; \
	else \
		git add -A && \
		read -p "Commit message: " msg && \
		git commit -m "$$msg" && \
		git push origin main && \
		echo "✅ Pushed. CI/CD 已觸發。"; \
	fi

dev: ## 啟動本地開發伺服器
	@cd $(PROJECT) && npx astro dev

build: ## 本地 build 測試
	@cd $(PROJECT) && npx astro build

# ── 辯論引擎 ──────────────────────────────────────────

.PHONY: debate-list debate article

debate-list: ## 列出辯論紀錄
	@cd $(PROJECT) && python3 scripts/debate-to-article.py --list

debate: ## 跑辯論引擎（需指定 TOPIC）
	@if [ -z "$(TOPIC)" ]; then echo "用法: make debate TOPIC='辯論主題'"; exit 1; fi
	@cd ~/Desktop/02_參考資料 && python3 debate_engine.py "$(TOPIC)"

article: ## 互動選擇辯論 → 轉成文章
	@cd $(PROJECT) && python3 scripts/debate-to-article.py

article-dry: ## 預覽辯論轉文章（不寫檔）
	@cd $(PROJECT) && python3 scripts/debate-to-article.py --dry-run

# ── 翻譯 ──────────────────────────────────────────────

.PHONY: translate translate-check

translate-check: ## 檢查翻譯完整性（不花 API）
	@cd $(PROJECT) && python3 -c "\
	import os, glob; \
	root='src/content/articles'; \
	slugs=[os.path.basename(f) for f in glob.glob(os.path.join(root,'*.md'))]; \
	missing=[(s,l) for s in slugs for l in ['en','ja','zh-cn'] if not os.path.exists(os.path.join(root,l,s))]; \
	print(f'✅ 全部翻譯齊全 ({len(slugs)} × 3 = {len(slugs)*3})') if not missing else [print(f'❌ {s}: 缺 {l}') for s,l in missing]"

# ── 維護 ──────────────────────────────────────────────

.PHONY: costs clean

costs: ## 查看 API 費用摘要
	@cd $(PROJECT) && python3 -c "\
	import json; \
	lines=[json.loads(l) for l in open('data/costs.jsonl') if l.strip()]; \
	total_usd=sum(r.get('costUSD',0) for r in lines); \
	total_twd=sum(r.get('costTWD',0) for r in lines); \
	by_action={}; \
	[by_action.update({r['action']: by_action.get(r['action'],0)+r.get('costUSD',0)}) for r in lines]; \
	print(f'總計: \$${ total_usd:.4f} USD / NT\$${ total_twd:.1f}'); \
	print(f'筆數: {len(lines)}'); \
	print('──'); \
	[print(f'  {k}: \$${v:.4f}') for k,v in sorted(by_action.items(), key=lambda x:-x[1])]" 2>/dev/null || echo "  (尚無費用記錄)"

clean: ## 清理本地 build 產物
	@cd $(PROJECT) && rm -rf dist .astro node_modules/.cache && echo "✅ 清理完成"
