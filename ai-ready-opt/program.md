# AI-Ready Autoresearch — 策略與評分規格

> paulkuo.tw 的 AI-Ready SEO 持續優化系統
> Eval Worker: https://paulkuo-eval.paul-4bf.workers.dev

---

## Strategy Config

```yaml
goal: 提升 AI-Ready Score
target_score: 95
current_baseline: 85
min_improvement: 2
max_iterations: 5
stop_after_no_improvement: 2
model: claude-sonnet-4-20250514
model_fallback: claude-opus-4-20250514

allowed_files:
  - public/llms.txt
  - src/data/siteSchema.ts
  - public/mcp.json
  - public/.well-known/agent-card.json
  - public/robots.txt
  - src/content/articles/**/*.md  # 僅限 faq frontmatter 欄位

focus_areas:
  - json-ld: "/about 頁 duplicate Person 去重、/articles 路徑加 CollectionPage"
  - llms-txt: "維持滿分，新文章發布時同步更新"
  - mcp-a2a: "維持滿分"
  - faq-schema: "自動為適合的文章生成 FAQ frontmatter，觸發 FAQPage JSON-LD"

constraints:
  - 不修改文章 body 內容
  - 不修改文章 faq 以外的 frontmatter 欄位
  - 不修改 Worker source
  - 不修改 layout 核心模板
  - 不修改部署配置
  - 不修改評分器
  - 每輪只改一個檔案
```

---

## 分數紀錄

| 日期 | 總分 | llms.txt | JSON-LD | MCP+A2A | AI理解 | 備註 |
|------|------|----------|---------|---------|--------|------|
| 2026-03-17 | 65 | 18 | 12 | 25 | 10 | 初始 baseline |
| 2026-03-21 | 85 | 25 | 12 | 25 | 23 | R2: llms.txt 替換 + JSON-LD 首頁去重 |

## 已知待修缺口

- JSON-LD +13 可撿：/about duplicate Person、/articles 路徑缺 CollectionPage
- AI 理解 +2 可撿：第 10 題答錯，可能需要 llms.txt 微調
