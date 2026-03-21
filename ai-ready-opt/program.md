# AI-Ready Autoresearch — 策略與評分規格 V2

> paulkuo.tw 的 AI-Ready SEO 持續優化系統
> Eval Worker: https://paulkuo-eval.paul-4bf.workers.dev
> 策略版本：v2（2026-03-21 更新）
> 更新原因：V1 Agent 連續 3 輪只加文章 FAQ 但分數不變，需修正策略引導

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
  - src/data/siteSchema.ts        # JSON-LD schema 定義（Person, WebSite, 頁面級 schema）
  - public/mcp.json
  - public/.well-known/agent-card.json
  - public/robots.txt
  - src/content/articles/**/*.md   # 僅限 faq frontmatter 欄位

action_priority:
  1_structural_schema: "修改 src/data/siteSchema.ts 解決 JSON-LD 結構性扣分（duplicate Person、缺少 CollectionPage 等）"
  2_llms_txt: "修改 public/llms.txt 提升 AI comprehension 分數"
  3_mcp_a2a: "修改 mcp.json 或 agent-card.json（通常已滿分，僅在丟分時修）"
  4_article_faq: "為文章加 FAQ frontmatter（最低優先——目前 eval 不額外計分，僅在以上都做完後考慮）"

focus_areas:
  json-ld:
    current_score: 12
    max_score: 25
    gap: 13
    breakdown:
      coverage: "~7/10 — 取樣頁面中有 JSON-LD 的比例。/articles 列表頁可能缺少 schema。"
      person_id: "5/5 — 已滿分。"
      property_completeness: "~0/5 — 文章頁面是否有 Article schema 且 5 個必填欄位齊全。"
      no_duplicate_entities: "0/5 — /about 頁有 inline Person（沒有 @id），被判定為 duplicate。"
    actions:
      - "在 siteSchema.ts 新增 /about 專用 schema：用 @id reference 指向 #person，不要 inline 一個新的 Person"
      - "在 siteSchema.ts 新增 /articles 列表頁的 CollectionPage schema"
      - "確認文章頁面的 Article schema 有完整的 5 個必填欄位"
  llms-txt:
    current_score: 25
    max_score: 25
    gap: 0
    note: "已滿分。新文章發布時同步更新即可。"
  mcp-a2a:
    current_score: 25
    max_score: 25
    gap: 0
    note: "已滿分。維持即可。"
  ai-comprehension:
    current_score: 23
    max_score: 25
    gap: 2
    breakdown:
      correct_answers: "9/10 題正確（第 10 題答錯）"
    actions:
      - "檢查 llms.txt 中 Paul 所在地資訊是否明確"
      - "微調 llms.txt 中相關段落的表述"

anti_patterns:
  - "不要為文章加 FAQ frontmatter 來試圖提升 JSON-LD 分數 — eval Worker 的 scoreJsonLd 不檢查 FAQ schema"
  - "不要重複嘗試同一個策略 — 如果上一輪沒提分，這一輪不要再做同樣的事"
  - "不要在所有可做項都已滿分的情況下強行修改 — 輸出 no_action 即可"
  - "不要只優化內部 eval 可見的指標 — 未來會有外部 AI 交叉驗證層，只刷內部分數不代表真實改善"

constraints:
  - 不修改文章 body 內容
  - 不修改文章 faq 以外的 frontmatter 欄位
  - 不修改 Worker source（eval-worker/）
  - 不修改 layout 核心模板（src/layouts/、src/components/ 中非 siteSchema 的檔案）
  - 不修改部署配置（wrangler.toml、wrangler.jsonc、.github/workflows/）
  - 不修改評分器
  - 每輪只改一個檔案
```

---

## Eval Worker 計分邏輯（供 Agent 參考）

### Layer 1: llms.txt (25 分)
| 子項 | 分數 | 檢查內容 |
|------|------|----------|
| H1 品牌名 | 5 | `# 開頭` |
| Blockquote 描述 | 5 | `> 開頭` |
| H2 sections ≥ 3 | 5 | `## 開頭` 數量 |
| 有連結 | 3 | `[text](url)` 格式 |
| 連結可達性 | 7 | 抽樣 5 個連結 HEAD 請求 |

### Layer 2: JSON-LD (25 分)
| 子項 | 分數 | 檢查內容 |
|------|------|----------|
| Coverage | 10 | 取樣頁面（/, /about, /articles, + 最多 3 篇文章）中有 JSON-LD 的比例 |
| Person @id | 5 | 任何頁面的 Person schema 有 `@id` 屬性 |
| Property completeness | 5 | Article schema 必填欄位齊全度（name, headline, description, author, datePublished） |
| No duplicate entities | 5 | 沒有缺少 `@id` 的 inline Person schema |

⚠️ FAQ schema 不在此層計分範圍。加 FAQ 不會影響此層分數。

### Layer 3: MCP + A2A (25 分)
| 子項 | 分數 | 檢查內容 |
|------|------|----------|
| mcp.json 可達 + valid | 5 | HTTP 200 + JSON parse |
| tools 陣列有內容 | 3 | Array.isArray + length > 0 |
| tools 欄位完整 | 2 | name + description + inputSchema |
| agent-card.json 可達 + valid | 5 | HTTP 200 + JSON parse |
| 必填欄位 | 3 | name, description, url, version |
| 有 skills | 2 | skills array length > 0 |
| tools-skills 交叉比對 | 5 | mcp.json tools 與 agent-card.json skills 名稱一致 |

### Layer 4: AI Comprehension (25 分)
- Claude 回答 10 題事實問題（基於 llms.txt 內容），每題 2.5 分

---

## Future Layers（即將到來，不在目前 config 中）

### Layer 5a: External AI Cross-Validation

**狀態：Step 2 規劃完成，待 Step 1 驗收後實施。**

用多個外部 AI 模型（Perplexity 為核心）問關於 paulkuo.tw 的問題，建立 internal score 與 external outcome 之間的因果關係。包含正向測試和反幻覺負面測試。

Agent 注意：即使 Layer 5 尚未上線，修改仍應考慮「外部 AI 能不能因此更正確地理解 paulkuo.tw」。

---

## 分數紀錄

| 日期 | 版本 | 總分 | llms.txt | JSON-LD | MCP+A2A | AI理解 | 備註 |
|------|------|------|----------|---------|---------|--------|------|
| 2026-03-17 | v0 | 65 | 18 | 12 | 25 | 10 | 初始 baseline |
| 2026-03-21 | v1 | 85 | 25 | 12 | 25 | 23 | llms.txt 替換 + JSON-LD 首頁去重 |

## 已知待修缺口

- JSON-LD +13 可撿：/about duplicate Person (+5), /articles 缺 CollectionPage (+3~5), 文章 Article completeness (+3~5)
- AI 理解 +2 可撿：第 10 題答錯（Where is Paul based?）
