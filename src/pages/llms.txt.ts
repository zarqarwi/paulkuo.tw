import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, PILLAR_MAP } from '../config';

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .filter(a => !a.id.startsWith('en/') && !a.id.startsWith('ja/') && !a.id.startsWith('zh-cn/'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const base = SITE.url;

  const lines: string[] = [
    `# ${SITE.author}`,
    '',
    `Site: ${base}`,
    `Description: ${SITE.description}`,
    `Author: ${SITE.author}（${SITE.authorAlt}）`,
    '',
    `> For full article content, see: ${base}/llms-full.txt`,
    '',
    '## About',
    'Paul Kuo 是一位跨領域的 AI × 文明秩序觀察者，擁有 15 年神學訓練、10+ 年 PCB 金屬回收產業經驗，',
    '從 AppWorks 到厚生市集到半畝塘的創業歷程。現任佳龍科技（SDTI）數位長，',
    '推動台日半導體合作、循環經濟數據基礎建設與 AI 平台開發。',
    '',
    '## Content Pillars',
    ...Object.entries(PILLAR_MAP).map(([key, v]) => `- ${v.label}（${v.labelEn}）→ ${base}/blog#${key}`),
    '',
    '## Key URLs',
    `- Homepage: ${base}/`,
    `- Blog: ${base}/blog`,
    `- About: ${base}/about`,
    `- Projects: ${base}/projects`,
    `- Tags: ${base}/tags`,
    `- Search: ${base}/search`,
    `- RSS: ${base}/rss.xml`,
    `- Full content for LLMs: ${base}/llms-full.txt`,
    `- Sitemap: ${base}/sitemap-index.xml`,
    '',
    '## Languages',
    `- 正體中文（default）: ${base}/`,
    `- English: ${base}/en/`,
    `- 日本語: ${base}/ja/`,
    `- 简体中文: ${base}/zh-cn/`,
    '',
    `## Recent Articles (${articles.length} total)`,
  ];

  for (const article of articles.slice(0, 50)) {
    const slug = article.id.replace(/\.md$/, '');
    const pillar = PILLAR_MAP[article.data.pillar as keyof typeof PILLAR_MAP];
    const pillarLabel = pillar ? pillar.label : '';
    lines.push(`- [${pillarLabel}] ${article.data.title} | ${base}/articles/${slug}/`);
  }

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
