# siteSchema.ts 新建 + SiteHead.astro 架構重構

> 目的：把 JSON-LD schema 定義從 SiteHead.astro 抽出來，讓 optimize Agent 能透過 allowed_files 修改
> 執行者：Code session
> 前置條件：無

---

## 新建檔案：src/data/siteSchema.ts

```typescript
/**
 * siteSchema.ts — 全站 JSON-LD Schema 定義
 * 
 * 此檔案定義 paulkuo.tw 的結構化資料（JSON-LD）。
 * 由 SiteHead.astro 引用，注入每個頁面的 <head>。
 * 
 * ⚠️ 此檔案在 ai-ready-opt 系統的 allowed_files 白名單中，
 *    optimize Agent 可以自動修改此檔案來改善 JSON-LD 分數。
 * 
 * Eval Worker 的 JSON-LD 計分邏輯（25 分）：
 * - Coverage (10 pts): 取樣頁面中有 JSON-LD 的比例
 * - Person @id (5 pts): Person schema 有 @id
 * - Property completeness (5 pts): Article schema 5 個必填欄位
 * - No duplicate entities (5 pts): 沒有缺少 @id 的 inline Person
 */

// ─── 核心實體 ───

export const personSchema = {
  "@type": "Person",
  "@id": "https://paulkuo.tw/#person",
  "name": "Paul Kuo",
  "alternateName": "郭曜郎",
  "url": "https://paulkuo.tw",
  "description": "Paul Kuo（郭曜郎）— 在技術與文明的交匯處，以 AI 策略、循環經濟與人文視角重建秩序。深度文章涵蓋智能趨勢、廢棄物資源化與文明反思。",
  "image": "https://paulkuo.tw/paul-photo.png",
  "jobTitle": "Circular Economy & AI Strategy Consultant",
  "worksFor": {
    "@type": "Organization",
    "name": "SDTI 佳龍科技",
    "url": "https://www.sdti.com.tw"
  },
  "knowsAbout": [
    "Circular Economy",
    "AI Systems",
    "Taiwan-Japan Industrial Cooperation",
    "Theology",
    "Urban Mining",
    "PCB Metal Recovery",
    "Startup Strategy",
    "Agentic SEO",
    "Taiwan-Japan Business"
  ],
  "alumniOf": ["AppWorks"],
  "nationality": { "@type": "Country", "name": "Taiwan" },
  "sameAs": [
    "https://www.linkedin.com/in/paulkuo",
    "https://x.com/zarqarwi",
    "https://www.threads.net/@zarqarwi",
    "https://www.youtube.com/@kuopaul8265",
    "https://www.facebook.com/guo.yao.lang.2025",
    "https://www.instagram.com/zarqarwi",
    "https://bsky.app/profile/paulkuo.bsky.social",
    "https://www.reddit.com/user/Constant-Variety1656"
  ]
};

export const websiteSchema = {
  "@type": "WebSite",
  "@id": "https://paulkuo.tw/#website",
  "name": "Paul Kuo",
  "url": "https://paulkuo.tw",
  "description": "Paul Kuo（郭曜郎）— 在技術與文明的交匯處，以 AI 策略、循環經濟與人文視角重建秩序。深度文章涵蓋智能趨勢、廢棄物資源化與文明反思。",
  "publisher": { "@id": "https://paulkuo.tw/#person" },
  "inLanguage": ["zh-Hant", "en", "ja", "zh-Hans"]
};

// ─── 頁面級 Schema ───

/** /about 頁面：用 @id reference 指向 #person，避免 duplicate Person */
export const aboutPageSchema = {
  "@type": "AboutPage",
  "@id": "https://paulkuo.tw/about#aboutpage",
  "name": "About Paul Kuo",
  "url": "https://paulkuo.tw/about",
  "mainEntity": { "@id": "https://paulkuo.tw/#person" },
  "isPartOf": { "@id": "https://paulkuo.tw/#website" }
};

/** /articles 列表頁：CollectionPage schema */
export const articlesPageSchema = {
  "@type": "CollectionPage",
  "@id": "https://paulkuo.tw/articles#collectionpage",
  "name": "Articles — Paul Kuo",
  "url": "https://paulkuo.tw/articles",
  "description": "Paul Kuo 的深度文章：AI 策略、循環經濟、文明反思、創造實踐",
  "isPartOf": { "@id": "https://paulkuo.tw/#website" },
  "author": { "@id": "https://paulkuo.tw/#person" }
};

// ─── 組裝函數 ───

/** 全站共用 @graph（每個頁面都有） */
export function getSiteGraph(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [personSchema, websiteSchema]
  };
}

/** /about 頁面的 @graph */
export function getAboutGraph(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [personSchema, websiteSchema, aboutPageSchema]
  };
}

/** /articles 列表頁的 @graph */
export function getArticlesGraph(): object {
  return {
    "@context": "https://schema.org",
    "@graph": [personSchema, websiteSchema, articlesPageSchema]
  };
}

/** 
 * 文章頁面的 Article schema 
 * 注意 5 個必填欄位：name, headline, description, author, datePublished
 */
export function getArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  tags?: string[];
}): object {
  return {
    "@type": "Article",
    "@id": `${article.url}#article`,
    "name": article.title,
    "headline": article.title,
    "description": article.description,
    "url": article.url,
    "author": { "@id": "https://paulkuo.tw/#person" },
    "publisher": { "@id": "https://paulkuo.tw/#person" },
    "datePublished": article.datePublished,
    ...(article.dateModified && { "dateModified": article.dateModified }),
    ...(article.image && { "image": article.image }),
    ...(article.tags && { "keywords": article.tags }),
    "isPartOf": { "@id": "https://paulkuo.tw/#website" },
    "inLanguage": "zh-Hant",
    "mainEntityOfPage": { "@id": article.url }
  };
}
```

---

## 修改檔案：src/components/SiteHead.astro

### 變更說明
- 移除硬寫的 `<script type="application/ld+json">` 區塊（約 30 行）
- 改為引用 siteSchema.ts 的 `getSiteGraph()`
- `schemaJson` prop 保持不變（供頁面級 schema 覆蓋用）

### 具體修改

**刪除的區塊（SiteHead.astro 尾部）：**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://paulkuo.tw/#person",
      ...（整個 Person + WebSite 定義）
    }
  ]
}
</script>
```

**替換為：**
```astro
---
// 在 frontmatter 區塊頂部加入 import
import { getSiteGraph } from '../data/siteSchema';

// 已有的 Props interface 和 destructuring 不變
// ...

// 在 frontmatter 底部加：
const defaultSchema = JSON.stringify(getSiteGraph());
---

<!-- 在 HTML 區塊中，替換原本的硬寫 JSON-LD -->
{schemaJson 
  ? <script type="application/ld+json" set:html={schemaJson} />
  : <script type="application/ld+json" set:html={defaultSchema} />
}
```

**注意：** 原本 SiteHead 有兩段 JSON-LD 邏輯：
1. `{schemaJson && <script type="application/ld+json" set:html={schemaJson} />}` — 頁面級（來自 prop）
2. 硬寫的 `<script type="application/ld+json">` — 全站共用

修改後邏輯：如果頁面傳了 `schemaJson`，用頁面的；否則用 `getSiteGraph()` 預設。

**⚠️ 需要同時修改 about.astro 和 articles 列表頁，讓它們傳正確的 schemaJson prop。**

---

## 需連帶修改的頁面

### src/pages/about.astro
- 需要看它目前傳什麼 `schemaJson` 給 SiteHead
- 改為使用 `getAboutGraph()` 的輸出
- 確保不再 inline 一個沒有 @id 的 Person

### src/pages/articles/index.astro（或 BlogPage.astro）
- 需要傳 `getArticlesGraph()` 作為 schemaJson
- 讓 /articles 列表頁有 CollectionPage schema

### 文章頁面模板（ArticlePage.astro 或 [...slug].astro）
- 需要用 `getArticleSchema()` 產生 Article schema
- 確保 5 個必填欄位都有值
- 把 Article schema 合併到 @graph 中

---

## 驗證步驟

1. `npm run build` 或 `astro build` 確認無編譯錯誤
2. 檢查產出的 HTML 中 JSON-LD 正確：
   - `curl https://paulkuo.tw/ | grep -A 50 'ld+json'`
   - `curl https://paulkuo.tw/about | grep -A 50 'ld+json'`
   - `curl https://paulkuo.tw/articles | grep -A 50 'ld+json'`
3. 確認 /about 頁面沒有 duplicate Person（沒有缺 @id 的 inline Person）
4. 確認 /articles 頁面有 CollectionPage schema
5. 手動跑一次 eval：`curl -X POST https://paulkuo-eval.paul-4bf.workers.dev/evaluate -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"target_url":"https://paulkuo.tw"}'`
6. 確認 JSON-LD 分數從 12 提升
