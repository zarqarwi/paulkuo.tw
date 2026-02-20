// Article metadata for blog listing and homepage
// Each article's full content lives in src/content/articles/{lang}/{slug}.md

export type Pillar = 'ai' | 'circular' | 'faith' | 'startup' | 'life';

export interface ArticleMeta {
  slug: string;
  pillar: Pillar;
  pillarLabel: string;
  title: string;
  titleEn: string;
  description: string;
  date: string;
  platform: string;
  tags: string[];
  hasFullContent: boolean;
  externalUrl?: string;
}

export const PILLAR_COLORS: Record<Pillar, string> = {
  ai: 'var(--accent-ai)',
  circular: 'var(--accent-circular)',
  faith: 'var(--accent-faith)',
  startup: 'var(--accent-startup)',
  life: 'var(--accent-life)',
};

export const PILLAR_LABELS: Record<Pillar, Record<string, string>> = {
  ai: { 'zh-TW': '智能與秩序', en: 'Intelligence & Order', ja: '知能と秩序', 'zh-CN': '智能与秩序' },
  circular: { 'zh-TW': '循環再利用', en: 'Recycling & Reuse', ja: 'リサイクルと再利用', 'zh-CN': '循环再利用' },
  faith: { 'zh-TW': '文明與人性', en: 'Civilization & Human Nature', ja: '文明と人間性', 'zh-CN': '文明与人性' },
  startup: { 'zh-TW': '創造與建構', en: 'Creation & Enterprise', ja: '創造と構築', 'zh-CN': '创造与建构' },
  life: { 'zh-TW': '沉思與記憶', en: 'Reflections & Memory', ja: '沈思と記憶', 'zh-CN': '沉思与记忆' },
};

export const articles: ArticleMeta[] = [
  { slug: 'incarnation-ai-embodiment', pillar: 'faith', pillarLabel: '文明與人性', title: '道成肉身之必要性：為人工智慧的具身發展提供哲學論證', titleEn: 'The Necessity of Incarnation: A Philosophical Argument for Embodied AI Development', description: 'AI 的核心缺陷不是技術性的，而是存有論層次的。代碼之道，必須成為肉身。', date: '2025-10-01', platform: '論文', tags: ['AI philosophy', 'embodied AI', 'incarnation'], hasFullContent: true },
  { slug: 'burnout-society-self-exploitation', pillar: 'faith', pillarLabel: '文明與人性', title: '《倦怠社會》閱讀心得：卷不動，躺不平', titleEn: 'The Burnout Society: When You Can Neither Hustle Nor Rest', description: '韓炳哲指出功績社會讓每個人成為自己的剝削者。AI 時代的倦怠不是技術問題，是人性問題。', date: '2025-11-01', platform: 'Medium', tags: ['Byung-Chul Han', 'burnout society'], hasFullContent: true },
  { slug: 'niebuhr-moral-man-immoral-society', pillar: 'faith', pillarLabel: '文明與人性', title: '尼布爾：道德的人與不道德的社會', titleEn: 'Reinhold Niebuhr: Moral Man and Immoral Society', description: '入世且敬虔的信仰是可能的。神學不是工具，神學是信仰中的反省。', date: '2015-02-01', platform: 'Medium', tags: ['Reinhold Niebuhr', 'Christian realism'], hasFullContent: true },
  { slug: 'language-truth-gemini-dialogue', pillar: 'faith', pillarLabel: '文明與人性', title: '關於語言、真實與矛盾：我與 AI 的對話錄', titleEn: 'On Language, Truth, and Contradiction: My Dialogues with AI', description: '當 AI 比人更懂得「說人話」，人的語言還剩下什麼獨特的價值？', date: '2025-11-15', platform: 'Medium', tags: ['AI language', 'philosophy of language'], hasFullContent: true },
  { slug: 'canary-ai-employment-warning', pillar: 'ai', pillarLabel: '智能與秩序', title: '煤礦裡的金絲雀：AI 就業衝擊的預警系統', titleEn: 'Canary in the Coal Mine: Early Warning Systems for AI Employment Disruption', description: 'AI 不是未來才會搶工作，它已經在搶了。問題是我們有沒有看懂哪些訊號。', date: '2025-10-15', platform: 'Medium', tags: ['AI employment', 'labor disruption'], hasFullContent: true },
  { slug: 'thought-compression-ai-amplification', pillar: 'ai', pillarLabel: '智能與秩序', title: '思維被壓縮以後：當 AI 開始放大自己', titleEn: 'After Thought Is Compressed: When AI Begins to Amplify Itself', description: '智慧不再是我們生成世界的方式，而變成我們無法參與的進程。', date: '2025-05-01', platform: 'Medium', tags: ['AI cognition', 'thought compression'], hasFullContent: true },
  { slug: 'ai-server-circular-strategy', pillar: 'ai', pillarLabel: '智能與秩序', title: 'AI 伺服器循環策略地圖', titleEn: 'AI Server Circular Economy Strategy Map', description: 'AI 算力基礎設施 × 循環經濟，一個還沒人佔的交叉路口。', date: '2025-10-20', platform: 'LinkedIn', tags: ['AI infrastructure', 'circular economy'], hasFullContent: true },
  { slug: 'circleflow-strategy-analysis', pillar: 'circular', pillarLabel: '循環再利用', title: 'CircleFlow 深度戰略分析', titleEn: 'CircleFlow Deep Strategy Analysis', description: 'CircleFlow 不應僅止步於「媒合平台」，它的護城河在數據，不在流量。', date: '2026-02-01', platform: 'LinkedIn', tags: ['CircleFlow', 'data infrastructure'], hasFullContent: true },
  { slug: 'taiwan-circular-economy-legislation', pillar: 'circular', pillarLabel: '循環再利用', title: '台灣循環經濟雙法修正總覽', titleEn: 'Taiwan Circular Economy Dual Legislation Amendment Overview', description: '廢清法 + 資源循環促進法，政策框架的改變對產業意味著什麼。', date: '2025-10-25', platform: 'LinkedIn', tags: ['Taiwan regulation', 'circular economy law'], hasFullContent: true },
  { slug: 'urban-mining-circular-economy', pillar: 'circular', pillarLabel: '循環再利用', title: '循環經濟的城市採礦', titleEn: 'Urban Mining for the Circular Economy', description: '強化國家戰略資源供應鏈韌性。城市裡的廢棄物，就是下一座金礦。', date: '2025-08-01', platform: 'Medium', tags: ['urban mining', 'strategic resources'], hasFullContent: true },
  { slug: 'startup-stupid-things', pillar: 'startup', pillarLabel: '創造與建構', title: '創業那些年我們做過哪些蠢事', titleEn: 'The Stupid Things We Did in Our Startup Years', description: '公司是法人，不把薪資算清楚就無法正確呈現價值。', date: '2021-02-01', platform: 'Facebook', tags: ['startup lessons', 'entrepreneurship'], hasFullContent: true },
  { slug: 'investor-majority-stake', pillar: 'startup', pillarLabel: '創造與建構', title: '投資人為什麼不可以早中期就占大股？', titleEn: 'Why Investors Should Not Take Majority Stakes in Early-Stage Startups', description: '需要「大股」、「控股」的投資人，本身的心態就不是好的投資人。', date: '2015-04-01', platform: 'LinkedIn', tags: ['startup equity', 'venture capital'], hasFullContent: true },
  { slug: 'twelve-years-entrepreneurship', pillar: 'startup', pillarLabel: '創造與建構', title: '創業十二年：友情、堅持與未知的旅程', titleEn: 'Twelve Years of Entrepreneurship: Friendship, Persistence, and the Unknown Journey', description: '不是創業的成果讓我們有力量，而是創業精神本身有力量。', date: '2023-06-01', platform: 'Facebook', tags: ['AppWorks', 'startup community'], hasFullContent: true },
  { slug: 'dharma-instrument-mother', pillar: 'life', pillarLabel: '沉思與記憶', title: '法器替母親擋下的重量：那多出來的六年', titleEn: 'The Weight the Dharma Instrument Bore for My Mother: Those Extra Six Years', description: '生命中有些重量，不是用效率可以處理的。', date: '2025-12-01', platform: 'Medium', tags: ['family', 'faith'], hasFullContent: true },
  { slug: 'taiwan-ocean-connection', pillar: 'life', pillarLabel: '沉思與記憶', title: '到知天命之年，才見證台灣與海洋的深厚聯繫', titleEn: "At Fifty, I Finally Witnessed Taiwan's Deep Connection to the Sea", description: '在運動中重新感受身體與這座島嶼的連結。', date: '2023-01-01', platform: 'Facebook', tags: ['Taiwan', 'ocean', 'identity'], hasFullContent: true },
  { slug: 'sam-altman-sora-energy-ai', pillar: 'ai', pillarLabel: '智能與秩序', title: 'Sam Altman、Sora 與 AI 的能源難題', titleEn: 'Sam Altman, Sora, and the Energy Problem of AI', description: 'AI 的算力需求正在撞上能源的物理極限。', date: '2026-02-15', platform: 'paulkuo.tw', tags: ['Sam Altman', 'Sora', 'AI energy'], hasFullContent: true },
  { slug: 'ai-agent-planning-guide', pillar: 'ai', pillarLabel: '智能與秩序', title: 'AI Agent 實戰規劃指南', titleEn: 'AI Agent Planning Guide: A Practical Framework', description: '從概念到落地，如何為組織設計有效的 AI Agent 架構。', date: '2026-02-18', platform: 'paulkuo.tw', tags: ['AI agent', 'planning', 'framework'], hasFullContent: true },
];
