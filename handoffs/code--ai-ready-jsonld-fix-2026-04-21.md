# code--ai-ready-jsonld-fix-2026-04-21.md

建議模型: Sonnet

---

## 背景

AI Ready 評分系統（eval-worker）的 JSON-LD 層目前得 12/25，缺口 +13。
Chat session 讀過 siteSchema.ts、ArticlePage.astro、about.astro、articles/ 後，診斷出三個具體問題。

**重要：siteSchema.ts 本身的 schema 定義是對的，問題在「如何被頁面使用」。**

---

## Step -1 環境準備

```bash
cd ~/Desktop/01_專案進行中/paulkuo.tw && git pull
grep -rn "personSchema\|getAboutGraph\|getArticlesGraph\|getArticleSchema" src/ --include="*.astro" --include="*.ts"
```

確認目前引用情況再動手。

---

## Step 0 診斷確認（先跑，確認與分析一致再繼續）

```bash
# 確認 /blog 頁面有沒有 JSON-LD
grep -n "schemaJson\|schema\|JSON-LD" src/pages/blog.astro

# 確認 ArticlePage.astro 的 personSchema 是 inline 還是 @id 引用
grep -n "personSchema\|@id.*person" src/components/ArticlePage.astro
```

預期看到：
- `blog.astro` 沒有 schemaJson（缺 CollectionPage schema）
- `ArticlePage.astro` 直接 spread 了 `personSchema` 物件（inline，非 @id 引用）

---

## 三個問題與修法

### 問題 1：ArticlePage.astro — personSchema inline 重複（扣「No duplicate entities」5 分）

**現況：**
```typescript
// ArticlePage.astro 約第 18 行
import { personSchema, websiteSchema } from '../data/siteSchema';

// 約第 72 行
const schemaJson = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    personSchema,   // ← 完整 inline，每篇文章都重複一個 Person entity
    websiteSchema,  // ← 同上
    { "@type": "BlogPosting", ... }
  ]
});
```

**修法：** 把 `personSchema` / `websiteSchema` 改成 `@id` 引用

```typescript
// 修改後（不需要再 import personSchema, websiteSchema）
const schemaJson = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@id": "https://paulkuo.tw/#person" },    // ← @id 引用，不 inline
    { "@id": "https://paulkuo.tw/#website" },   // ← @id 引用，不 inline
    {
      "@type": "BlogPosting",
      // ... 其他欄位不變 ...
    }
  ]
});
```

**影響範圍：** 只改 `src/components/ArticlePage.astro`，不改 siteSchema.ts。
**注意：** `author` 和 `publisher` 欄位本來就已經用 `{ "@id": "..." }` 引用了，不用改。

---

### 問題 2：/blog 頁面缺 CollectionPage schema（扣「Coverage」分）

**現況：** `/articles/index.astro` → 301 redirect 到 `/blog`
`getArticlesGraph()` 定義在 siteSchema.ts 但從來沒被任何頁面呼叫。
`/blog` 頁面沒有 JSON-LD（或只有全站基本的，沒有 CollectionPage）。

**修法：** 在 `src/pages/blog.astro` 加入 CollectionPage schema

先確認 blog.astro 的 BaseLayout 呼叫方式：
```bash
head -30 src/pages/blog.astro
```

然後在 frontmatter 加：
```typescript
import { getArticlesGraph } from '../data/siteSchema';
const blogSchemaJson = JSON.stringify(getArticlesGraph());
```

並把 `schemaJson={blogSchemaJson}` 傳給 `<BaseLayout>`。

**注意：** `getArticlesGraph()` 裡面包含完整的 `personSchema` — 這是「@graph 的根節點定義」，根節點定義 inline 是正確的。問題是文章頁每次都重複 inline，才是 duplicate。

---

### 問題 3：/about 頁面的 getAboutGraph() 也有 inline 重複（次要，確認後處理）

**現況：** `about.astro` 用 `getAboutGraph()`，但 `getAboutGraph()` 返回：
```typescript
{
  "@graph": [personSchema, websiteSchema, aboutPageSchema]  // personSchema 完整 inline
}
```

**siteSchema.ts 的修法：** 修改 `getAboutGraph()` 使其只把 personSchema 用於根節點宣告，aboutPageSchema 的 mainEntity 已經是 `{ "@id": "..." }`（這個對了）：

實際上 `/about` 是首次宣告 person entity 的合理場所，所以 inline 沒問題。
⚠️ **這個問題等 Eval Worker 跑分後確認是否真的扣分再決定要不要改。優先做問題 1 和 2。**

---

## 執行順序

```
修問題 1 → commit → 修問題 2 → commit → npm run build（確認無 TS error）→ push → 等 Cloudflare 重建
```

---

## Smoke Test（每個 commit 後）

```bash
# 確認 TS 沒有 error
npm run build 2>&1 | grep -i "error\|warning"

# build 成功後，用 curl 確認文章頁有 BlogPosting schema（本地 dev server）
npm run dev &
sleep 5
curl -s http://localhost:4321/articles/beyond-man-days/ | grep -o '"@type":"BlogPosting"'
# 預期輸出："@type":"BlogPosting"

# 確認 Person 在文章頁只出現 @id 引用（不是完整 inline）
curl -s http://localhost:4321/articles/beyond-man-days/ | python3 -c "
import sys, json, re
html = sys.stdin.read()
match = re.search(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.DOTALL)
if match:
    data = json.loads(match.group(1))
    graph = data.get('@graph', [])
    print(f'Graph nodes: {len(graph)}')
    for node in graph:
        print(f'  - {node.get(\"@type\", \"ref\")} @id={node.get(\"@id\", \"none\")}')
"
```

預期結果（修後）：
```
Graph nodes: 4
  - ref @id=https://paulkuo.tw/#person
  - ref @id=https://paulkuo.tw/#website
  - BlogPosting @id=https://paulkuo.tw/articles/beyond-man-days/#article
  - BreadcrumbList @id=...
```

---

## 驗證方式

1. `npm run build` 無 error
2. 文章頁 `<script type="application/ld+json">` 裡的 `@graph` 中，Person 和 WebSite 節點改為純 `@id` 引用（只有一個 key）
3. `/blog` 頁面有 `"@type":"CollectionPage"`

---

## 注意事項

- ⚠️ `ArticlePage.astro` 被多語言版本共用（`/en/articles/`、`/ja/articles/` 等），改一次就全語言生效
- ⚠️ siteSchema.ts 是 AI Ready 自動化的白名單檔案——這次手動改 ArticlePage.astro 不在白名單內，但影響的是頁面的 schema 輸出，下次 AI Ready 自動跑時不會覆蓋（它只改白名單檔案）
- 只改這兩個檔案：`src/components/ArticlePage.astro`、`src/pages/blog.astro`
- 不動 `src/data/siteSchema.ts`（它已經是對的）

---

## 回報格式

完成後請回報：
```
✅ ArticlePage.astro — personSchema 改為 @id 引用（commit: XXXXX）
✅ blog.astro — CollectionPage schema 加入（commit: XXXXX）
✅ npm run build 無 error
✅ Smoke test：文章頁 @graph nodes 正確（Person/WebSite 都是純 @id 引用）
⚠️ push 後等 Cloudflare 重建（約 2-3 分鐘）再跑 eval
```

---

## 本輪 metrics

目標：JSON-LD 12/25 → 預計 20-22/25（+8~+10 分）
- 修問題 1（No duplicate entities）：+5 分
- 修問題 2（Coverage — blog CollectionPage）：+3~5 分
- 問題 3 暫緩，待跑分確認
