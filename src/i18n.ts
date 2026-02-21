/**
 * i18n 多語設定
 * 語系代碼、collection 名稱、UI 字串對照
 */

export const LANGUAGES = {
  'zh-Hant': {
    code: 'zh-Hant',
    collectionName: 'articles' as const,
    pathPrefix: '',           // 根路徑，不加前綴
    label: '繁',
    name: '繁體中文',
    blogTitle: 'Thinking Out Loud',
    blogDesc: '智能、再生、文明、創造、記憶 — 在實作中思考，在思考中前進。',
    backToList: '← 返回思想列表',
    readingTime: (min: number) => `閱讀時間約 ${min} 分鐘`,
    showMore: '顯示更多文章',
    allFilter: '全部',
    noArticles: '文章即將上線。',
    dateLocale: 'zh-TW',
    dateOptions: { year: 'numeric' as const, month: 'long' as const },
  },
  en: {
    code: 'en',
    collectionName: 'articles_en' as const,
    pathPrefix: '/en',
    label: 'EN',
    name: 'English',
    blogTitle: 'Thinking Out Loud',
    blogDesc: 'Intelligence, regeneration, civilization, creation, memory — thinking through practice, advancing through thought.',
    backToList: '← Back to articles',
    readingTime: (min: number) => `${min} min read`,
    showMore: 'Show more articles',
    allFilter: 'All',
    noArticles: 'Articles coming soon.',
    dateLocale: 'en-US',
    dateOptions: { year: 'numeric' as const, month: 'long' as const },
  },
  ja: {
    code: 'ja',
    collectionName: 'articles_ja' as const,
    pathPrefix: '/ja',
    label: '日',
    name: '日本語',
    blogTitle: 'Thinking Out Loud',
    blogDesc: '知性、再生、文明、創造、記憶 — 実践の中で考え、思考の中で前進する。',
    backToList: '← 記事一覧に戻る',
    readingTime: (min: number) => `読了時間 約${min}分`,
    showMore: 'もっと見る',
    allFilter: 'すべて',
    noArticles: '記事は準備中です。',
    dateLocale: 'ja-JP',
    dateOptions: { year: 'numeric' as const, month: 'long' as const },
  },
  'zh-CN': {
    code: 'zh-CN',
    collectionName: 'articles_zhcn' as const,
    pathPrefix: '/zh-cn',
    label: '简',
    name: '简体中文',
    blogTitle: 'Thinking Out Loud',
    blogDesc: '智能、再生、文明、创造、记忆 — 在实作中思考，在思考中前进。',
    backToList: '← 返回文章列表',
    readingTime: (min: number) => `阅读时间约 ${min} 分钟`,
    showMore: '显示更多文章',
    allFilter: '全部',
    noArticles: '文章即将上线。',
    dateLocale: 'zh-CN',
    dateOptions: { year: 'numeric' as const, month: 'long' as const },
  },
} as const;

export type LangKey = keyof typeof LANGUAGES;

/** 從 URL path 判斷語系 */
export function getLangFromPath(path: string): LangKey {
  if (path.startsWith('/en/') || path === '/en') return 'en';
  if (path.startsWith('/ja/') || path === '/ja') return 'ja';
  if (path.startsWith('/zh-cn/') || path === '/zh-cn') return 'zh-CN';
  return 'zh-Hant';
}

/** 取得對應語系的 collection 名稱 */
export function getCollectionName(lang: LangKey) {
  return LANGUAGES[lang].collectionName;
}
