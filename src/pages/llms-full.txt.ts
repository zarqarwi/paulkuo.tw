import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE, PILLAR_MAP } from '../config';

export const GET: APIRoute = async () => {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .filter(a => !a.id.startsWith('en/') && !a.id.startsWith('ja/') && !a.id.startsWith('zh-cn/'))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const base = SITE.url;

  const sections: string[] = [
    `# ${SITE.author} — Full Site Content for LLMs`,
    '',
    `> Generated at build time. ${articles.length} articles included.`,
    `> Site: ${base}`,
    `> Author: ${SITE.author}（${SITE.authorAlt}）`,
    `> For the concise index version, see: ${base}/llms.txt`,
    '',
    '---',
    '',
  ];

  for (const article of articles) {
    const slug = article.id.replace(/\.md$/, '');
    const pillar = PILLAR_MAP[article.data.pillar as keyof typeof PILLAR_MAP];
    const pillarLabel = pillar ? `${pillar.label} / ${pillar.labelEn}` : '';
    const dateStr = article.data.date.toISOString().slice(0, 10);
    const tags = article.data.tags?.join(', ') || '';
    const url = `${base}/articles/${slug}/`;

    sections.push(
      `## ${article.data.title}`,
      '',
      `- URL: ${url}`,
      `- Date: ${dateStr}`,
      `- Pillar: ${pillarLabel}`,
      ...(tags ? [`- Tags: ${tags}`] : []),
      ...(article.data.description ? [`- Description: ${article.data.description}`] : []),
      '',
      article.body || '(No content)',
      '',
      '---',
      '',
    );
  }

  const body = sections.join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
