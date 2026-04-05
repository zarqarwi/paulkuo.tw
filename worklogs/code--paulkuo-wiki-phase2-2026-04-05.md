# Handoff: LLM Wiki Phase 2 — paulkuo.tw 前端整合

> 來源：Cowork session 2026-04-05
> 目標：Code session 執行
> 前置：Phase 1 已全部完成（226 頁 / 436 edges / 3 排程）

---

## 背景

Phase 1 建好了完整的 wiki 知識圖譜資料層（226 個 markdown 頁面 + graph.json + 完整 frontmatter）。
Phase 2 的目標是把這些資料在 paulkuo.tw 上呈現出來：一個 `/wiki/` 路由，有 Graph View 視覺化 + 可瀏覽的概念頁面。

現有架構：Astro (static output) + React integration + Cloudflare Pages。
已經有 `/tags-graph` 做過類似的 D3.js force-directed graph（以 tags 為中心），可以參考但 wiki graph 要獨立實作。

---

## Step 0 偵察（先查再做）

```bash
# 確認 wiki 資料完整性
ls src/content/wiki/concepts/ | wc -l          # 應為 17
ls src/content/wiki/sources/ | wc -l           # 應為 208
cat src/content/wiki/meta/stats.json           # 確認 226 pages
cat src/content/wiki/meta/graph.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'nodes:{len(d[\"nodes\"])} edges:{len(d[\"edges\"])}')"

# 確認沒有 wiki content collection（Phase 2 要建）
grep -rn "wiki" src/content.config.ts

# 看 tags-graph 怎麼做 D3（可參考）
cat src/pages/tags-graph.astro

# 看現有 layout / component 結構
ls src/layouts/
ls src/components/
```

---

## 2A: Wiki Content Collection + 路由

### 目的
讓 Astro 能讀取 wiki markdown 並產生靜態頁面。

### 步驟

**1. 新增 wiki content collection**

`src/content.config.ts` 加入：

```typescript
const wikiSchema = z.object({
  title: z.string(),
  type: z.enum(['concept', 'entity', 'topic', 'source', 'comparison']),
  pillar: z.enum(['ai', 'circular', 'faith', 'startup', 'life']),
  visibility: z.enum(['public', 'internal']),
  created: z.coerce.date(),
  updated: z.coerce.date(),
  source_count: z.number().default(0),
  confidence: z.enum(['low', 'medium', 'high']).default('low'),
  tags: z.array(z.string()).default([]),
  links_to: z.array(z.string()).default([]),
  linked_from: z.array(z.string()).default([]),
  raw_source_path: z.string().optional(),
  raw_source_type: z.string().optional(),
});

// Wiki concepts（只 build public 的概念頁）
const wiki_concepts = defineCollection({
  loader: glob({
    base: 'src/content/wiki/concepts',
    pattern: '*.md',
  }),
  schema: wikiSchema,
});

// Wiki sources（不產生獨立頁面，但供 collection query）
const wiki_sources = defineCollection({
  loader: glob({
    base: 'src/content/wiki/sources',
    pattern: '*.md',
  }),
  schema: wikiSchema,
});
```

記得加到 `export const collections = { ... }` 裡。

**2. 建立 Wiki 路由結構**

```
src/pages/wiki/
├── index.astro              ← /wiki/ 首頁（Graph View + 概念列表）
└── [slug].astro             ← /wiki/{concept-slug}/ 概念頁
```

**3. /wiki/index.astro — Wiki 首頁**

- 頂部：簡短介紹（Paul 的個人知識圖譜）
- 主體：Graph View（React component，client:load）
- 下方：按 pillar 分組的概念列表（17 個 concept pages）
- 統計：226 頁面 / 17 概念 / 5 支柱
- 只顯示 `visibility: public` 的內容

**4. /wiki/[slug].astro — 概念頁動態路由**

- `getStaticPaths()` 從 `wiki_concepts` collection 取 public 概念
- 渲染概念頁 markdown 內容
- 側邊或底部：相關連結（links_to / linked_from 中的其他 public 概念）
- 來源引用區：列出 linked_from 中的 source pages（只列標題，不需連結到 source 頁面）

### 關鍵注意

- **只 build `visibility: public` 的頁面**，CLAUDE.md 有明確規定
- source pages 不需要獨立路由（數量太多、很多是 internal），只在概念頁裡引用
- entity pages 暫不建路由（目前只有 1 個）

---

## 2B: Graph View（D3.js Force-Directed）

### 目的
視覺化 226 個 wiki nodes 的連結關係，讓使用者直覺探索知識圖譜。

### 步驟

**1. 建立 React component**

`src/components/wiki/WikiGraph.tsx`

- 讀取 `meta/graph.json`（build time 注入 or fetch）
- D3.js force-directed layout
- 節點大小 = source_count（被引用越多越大）
- 節點顏色 = pillar 色（用 `PILLAR_MAP` from `src/config`）

**2. 視覺設計**

```
節點類型區分：
- concept：大圓（填色 by pillar）
- source：小圓（半透明，同 pillar 色）
- entity：菱形或特殊形狀

互動：
- hover 顯示 tooltip（title + type + source_count）
- click concept → 導航到 /wiki/{slug}/
- 搜尋框：即時過濾節點（fuzzy match title）
- pillar 篩選：5 個 toggle 按鈕切換顯示
- zoom + pan
```

**3. 效能考量**

- 226 nodes / 436 edges 對 D3 來說不大，直接渲染即可
- 但考慮到 source nodes 太多（208 個），預設可能只顯示 concepts + entities
- 提供 toggle：「顯示來源頁」展開完整圖

**4. 參考 tags-graph.astro**

現有的 `/tags-graph` 已經做了：
- D3 force simulation
- pillar 色彩映射
- hover tooltip
- responsive canvas

可以複製結構但重新實作邏輯（wiki graph 的 data schema 不同）。

---

## 2C: 概念頁面渲染

### 目的
每個 public concept 都有一個漂亮的頁面，展示核心觀點、來源引用、相關連結。

### 步驟

**1. 建立 WikiConceptPage component**

`src/components/wiki/WikiConceptPage.astro` 或直接寫在 `[slug].astro`

**2. 頁面結構**

```
┌─────────────────────────────────────┐
│  Breadcrumb: 首頁 > Wiki > {title}  │
├─────────────────────────────────────┤
│  # {title}                          │
│  {pillar badge} {confidence badge}  │
│  {source_count} 篇來源引用           │
├─────────────────────────────────────┤
│  ## 摘要                            │
│  {markdown content}                 │
├─────────────────────────────────────┤
│  ## 核心觀點                        │
│  {markdown content}                 │
├─────────────────────────────────────┤
│  ## 來源引用（{n} 篇）              │
│  - 📄 {source title} [article]      │
│  - 📝 {source title} [getnote]      │
│  - 🌐 {source title} [clip]         │
├─────────────────────────────────────┤
│  ## 延伸連結                        │
│  → {related concept} — 一句話描述    │
│  → {related concept} — 一句話描述    │
├─────────────────────────────────────┤
│  Mini Graph（只顯示本概念 ±1 hop）   │
└─────────────────────────────────────┘
```

**3. 來源引用列表**

- 從 `wiki_sources` collection 撈 linked_from 包含本 concept slug 的 source pages
- **只顯示 public 的 source**（internal 的只計數：「另有 {n} 篇 internal 來源」）
- 按 raw_source_type 分類顯示（article / getnote / clip）

**4. Mini Graph**

- 只顯示本概念 + 直接相連的 concepts（1-hop）
- 比首頁 Graph View 小很多，嵌在頁面底部
- 可用同一個 WikiGraph component 加 filter prop

---

## 2D: Publish Pipeline

### 目的
確保只有 public 內容進入 build、sitemap、SEO。

### 步驟

**1. Visibility 過濾**

所有 `getCollection()` 呼叫都加 filter：
```typescript
const publicConcepts = await getCollection('wiki_concepts', 
  ({ data }) => data.visibility === 'public'
);
```

**2. Sitemap 整合**

`astro.config.mjs` 的 sitemap integration 已經存在，新的 `/wiki/*` 路由會自動收錄。
確認 internal pages 不會被 build（因為 getStaticPaths 只回傳 public 的）。

**3. llms-full.txt 整合**

`src/pages/llms-full.txt.ts` 要加入 wiki 概念頁的內容。
格式：每個 public concept 一段，包含 title + summary。

**4. graph.json public 版**

Build 時從 `meta/graph.json` 過濾掉 `visibility: internal` 的節點和相關邊，
輸出 `public/wiki/graph.json` 給前端 fetch。

---

## 2E: SEO

### 步驟

**1. JSON-LD**

每個概念頁加 `DefinedTerm` 或 `Article` schema：
```json
{
  "@type": "DefinedTerm",
  "name": "AI Agent 經濟",
  "description": "...",
  "inDefinedTermSet": {
    "@type": "DefinedTermSet",
    "name": "Paul Kuo 知識圖譜"
  }
}
```

Wiki 首頁加 `CollectionPage` schema。

**2. OG Image**

Wiki 頁面的 OG image 可以：
- 用固定模板 + 動態文字（concept title + pillar badge）
- 或用 Astro 的 `@astrojs/og` 之類的方案

**3. robots.txt / WebMCP**

確認 `/wiki/` 路徑已在 robots.txt 允許範圍。
WebMCP tools 可以新增 wiki 相關 tool。

---

## 驗證方式

每個子步驟的驗證：

| Step | 驗證方式 |
|------|---------|
| 2A | `astro build` 成功 + `/wiki/` 頁面在 dist/ 中存在 |
| 2B | 本地 `astro dev` 開 /wiki/，Graph 正確渲染 226 nodes |
| 2C | 點任一 concept → 頁面正確顯示內容 + 來源列表 |
| 2D | `grep -r "internal" dist/wiki/` 不出現 internal 內容 |
| 2E | Lighthouse SEO score ≥ 90 + JSON-LD 驗證通過 |

最終驗證：`astro build && npx serve dist` → 瀏覽 /wiki/ 和至少 3 個概念頁。

---

## 注意事項

1. **output: 'static'** — 現有是 static build，wiki 也應該是 static（SSG）
2. **i18n** — Phase 2 先做 zh-Hant only，多語等 Phase 4
3. **React** — 已有 `@astrojs/react` integration，Graph View 用 React + D3 即可
4. **不要動現有頁面** — wiki 是新增路由，不影響 articles / dashboard / projects 等
5. **PILLAR_MAP** — 五支柱色彩映射已在 `src/config` 定義，直接引用
6. **graph.json 格式** — 目前的 graph.json nodes 有 `id, title, type, pillar, visibility`，edges 有 `source, target`，缺少 CLAUDE.md 規定的 `weight` 和 `labels` 欄位，build graph component 時可用 source_count 當 weight

---

## 回報格式

完成後請更新 worklog：
```markdown
## 完成日誌
- {HH:MM} Wiki Phase 2A: content collection + routing ({commit}) Code
- {HH:MM} Wiki Phase 2B: Graph View D3.js ({commit}) Code
...

## 待 Paul 執行
- [ ] git push origin main → 觸發 Cloudflare Pages deploy → 驗證: curl https://paulkuo.tw/wiki/ 確認 200
```

---

## 建議執行順序

2A → 2C → 2D → 2B → 2E

理由：先有路由和頁面（2A+2C），再做 publish 過濾（2D），Graph View 最花時間放中間（2B），SEO 最後收尾（2E）。
Graph View 可以先做基本版，之後再迭代美化。
