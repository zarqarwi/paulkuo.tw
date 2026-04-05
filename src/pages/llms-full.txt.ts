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

  // === Wiki Concepts ===
  const wikiConcepts = (await getCollection('wiki_concepts' as any, ({ data }: any) => data.visibility === 'public'))
    .sort((a: any, b: any) => (b.data.source_count || 0) - (a.data.source_count || 0));

  if (wikiConcepts.length > 0) {
    sections.push(
      '# Wiki — 知識圖譜概念',
      '',
      `> ${wikiConcepts.length} public concepts from Paul\'s LLM-compiled knowledge graph.`,
      `> Browse: ${base}/wiki/`,
      '',
      '---',
      '',
    );

    for (const concept of wikiConcepts) {
      const slug = concept.data.slug || concept.id.replace(/\.md$/, '');
      const pillar = PILLAR_MAP[concept.data.pillar as keyof typeof PILLAR_MAP];
      const pillarLabel = pillar ? `${pillar.label} / ${pillar.labelEn}` : '';
      const tags = concept.data.tags?.join(', ') || '';
      const url = `${base}/wiki/${slug}/`;

      sections.push(
        `## ${concept.data.title}`,
        '',
        `- URL: ${url}`,
        `- Pillar: ${pillarLabel}`,
        `- Sources: ${concept.data.source_count || 0}`,
        ...(tags ? [`- Tags: ${tags}`] : []),
        '',
        concept.body || '(No content)',
        '',
        '---',
        '',
      );
    }
  }

  // === Wiki Entities ===
  const wikiEntities = (await getCollection('wiki_entities' as any, ({ data }: any) => data.visibility === 'public'))
    .sort((a: any, b: any) => (b.data.source_count || 0) - (a.data.source_count || 0));

  if (wikiEntities.length > 0) {
    sections.push(
      '# Wiki — 人物與組織',
      '',
      `> ${wikiEntities.length} public entities in Paul's knowledge graph.`,
      '',
      '---',
      '',
    );

    for (const entity of wikiEntities) {
      const slug = entity.data.slug || entity.id.replace(/\.md$/, '');
      const pillar = PILLAR_MAP[entity.data.pillar as keyof typeof PILLAR_MAP];
      const pillarLabel = pillar ? `${pillar.label} / ${pillar.labelEn}` : '';
      const url = `${base}/wiki/${slug}/`;

      sections.push(
        `## ${entity.data.title}`,
        '',
        `- URL: ${url}`,
        `- Pillar: ${pillarLabel}`,
        `- Sources: ${entity.data.source_count || 0}`,
        '',
        entity.body || '(No content)',
        '',
        '---',
        '',
      );
    }
  }

  const body = sections.join('\n');

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
