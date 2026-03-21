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
