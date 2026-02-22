/**
 * Entity dictionary for AIO entity linking
 * Maps keywords to structured schema.org entities
 * Used in ArticlePage JSON-LD `mentions` array
 */

export interface EntityDef {
  '@type': string;
  name: string;
  url?: string;
  sameAs?: string[];
  description?: string;
  alternateName?: string[];
}

// Entities that can be auto-linked in JSON-LD schema
export const ENTITY_DICTIONARY: Record<string, EntityDef> = {
  // === Organizations ===
  'SDTI': {
    '@type': 'Organization',
    name: 'SDTI 佳龍科技',
    url: 'https://www.sdti.com.tw',
    description: '台日半導體合作與循環經濟技術公司',
    alternateName: ['佳龍科技', '佳龍'],
  },
  'CircleFlow': {
    '@type': 'SoftwareApplication',
    name: 'CircleFlow',
    description: 'AI 驅動的循環經濟數據平台',
    alternateName: ['CircleFlow Platform'],
  },
  'AppWorks': {
    '@type': 'Organization',
    name: 'AppWorks',
    url: 'https://appworks.tw',
    sameAs: ['https://en.wikipedia.org/wiki/AppWorks'],
    description: '東南亞最大的創業加速器與創投',
  },
  'Anthropic': {
    '@type': 'Organization',
    name: 'Anthropic',
    url: 'https://www.anthropic.com',
    sameAs: ['https://en.wikipedia.org/wiki/Anthropic'],
  },
  'OpenAI': {
    '@type': 'Organization',
    name: 'OpenAI',
    url: 'https://openai.com',
    sameAs: ['https://en.wikipedia.org/wiki/OpenAI'],
  },
  'Google DeepMind': {
    '@type': 'Organization',
    name: 'Google DeepMind',
    url: 'https://deepmind.google',
    sameAs: ['https://en.wikipedia.org/wiki/Google_DeepMind'],
  },

  // === AI Technologies ===
  'Claude': {
    '@type': 'SoftwareApplication',
    name: 'Claude',
    url: 'https://claude.ai',
    description: 'Anthropic 開發的 AI 助理',
    alternateName: ['Claude AI'],
  },
  'Gemini': {
    '@type': 'SoftwareApplication',
    name: 'Gemini',
    url: 'https://gemini.google.com',
    description: 'Google DeepMind 開發的多模態 AI 模型',
    alternateName: ['Google Gemini'],
  },
  'GPT': {
    '@type': 'SoftwareApplication',
    name: 'GPT',
    url: 'https://openai.com/gpt-4',
    description: 'OpenAI 開發的大型語言模型',
    alternateName: ['GPT-4', 'GPT-4o', 'ChatGPT'],
  },

  // === Concepts ===
  'AI Agent': {
    '@type': 'DefinedTerm',
    name: 'AI Agent',
    description: '能自主規劃、執行任務並與工具互動的 AI 系統',
    sameAs: ['https://en.wikipedia.org/wiki/Intelligent_agent'],
  },
  'Agentic AI': {
    '@type': 'DefinedTerm',
    name: 'Agentic AI',
    description: '具備自主行動能力的 AI 系統，能規劃、決策並執行多步驟任務',
  },
  'MCP': {
    '@type': 'DefinedTerm',
    name: 'Model Context Protocol',
    description: 'Anthropic 提出的模型上下文協議，讓 AI 模型與外部工具和資料互動的標準',
    alternateName: ['MCP', 'Model Context Protocol'],
  },
  'RAG': {
    '@type': 'DefinedTerm',
    name: 'Retrieval-Augmented Generation',
    description: '結合檢索與生成的 AI 技術，讓模型能參考外部知識庫回答問題',
    alternateName: ['RAG'],
    sameAs: ['https://en.wikipedia.org/wiki/Retrieval-augmented_generation'],
  },
  'LLM': {
    '@type': 'DefinedTerm',
    name: 'Large Language Model',
    description: '大型語言模型，以大量文本資料訓練的 AI 模型',
    alternateName: ['LLM', '大型語言模型'],
    sameAs: ['https://en.wikipedia.org/wiki/Large_language_model'],
  },
  'JSON-LD': {
    '@type': 'DefinedTerm',
    name: 'JSON-LD',
    description: 'Linked Data 的 JSON 格式，用於結構化資料標記',
    sameAs: ['https://en.wikipedia.org/wiki/JSON-LD'],
  },
  'Agentic SEO': {
    '@type': 'DefinedTerm',
    name: 'Agentic SEO',
    description: '針對 AI Agent 優化網站可讀性與可調用性的搜尋引擎優化策略',
    alternateName: ['AIO', 'AI Optimization'],
  },

  // === Industry Concepts ===
  '循環經濟': {
    '@type': 'DefinedTerm',
    name: '循環經濟',
    description: '以資源再生、再利用為核心的經濟模式，取代線性的取用-製造-丟棄模式',
    alternateName: ['Circular Economy'],
    sameAs: ['https://en.wikipedia.org/wiki/Circular_economy'],
  },
  '城市採礦': {
    '@type': 'DefinedTerm',
    name: '城市採礦',
    description: '從廢棄電子產品、建材等城市廢棄物中回收貴金屬與稀有資源的技術',
    alternateName: ['Urban Mining'],
    sameAs: ['https://en.wikipedia.org/wiki/Urban_mining'],
  },
  'PCB': {
    '@type': 'DefinedTerm',
    name: 'PCB 金屬回收',
    description: '從印刷電路板中提煉回收金、銀、銅、鈀等貴金屬的技術',
    alternateName: ['PCB Metal Recovery', '印刷電路板回收'],
  },
  '半導體': {
    '@type': 'DefinedTerm',
    name: '半導體產業',
    description: '設計與製造積體電路的產業，台灣在全球供應鏈中佔核心地位',
    alternateName: ['Semiconductor'],
    sameAs: ['https://en.wikipedia.org/wiki/Semiconductor_industry'],
  },
};

/**
 * Given article tags and body text, return matching entities for JSON-LD mentions
 */
export function getArticleEntities(
  tags: string[],
  body: string,
  pillar: string
): EntityDef[] {
  const matched = new Map<string, EntityDef>();

  // Check each entity keyword against tags and body
  for (const [keyword, entity] of Object.entries(ENTITY_DICTIONARY)) {
    const keywordLower = keyword.toLowerCase();

    // Match against tags
    const tagMatch = tags.some(
      (t) => t.toLowerCase().includes(keywordLower) || keywordLower.includes(t.toLowerCase())
    );

    // Match against body text (case-insensitive for English, exact for CJK)
    const bodyMatch = /[\u4e00-\u9fff]/.test(keyword)
      ? body.includes(keyword)
      : body.toLowerCase().includes(keywordLower);

    if (tagMatch || bodyMatch) {
      matched.set(entity.name, entity);
    }
  }

  return Array.from(matched.values()).slice(0, 10); // Cap at 10 entities per article
}
