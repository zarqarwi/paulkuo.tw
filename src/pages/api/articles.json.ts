/**
 * /api/articles.json — Build-time generated article index for WebMCP search
 * AI agents fetch this to search Paul's articles
 */
import { getCollection } from 'astro:content';
import { PILLAR_MAP } from '../../config';

export async function GET() {
  const articles = await getCollection('articles', (a: any) => !a.data.draft);

  // Only include zh-TW (root) articles, not translations
  const zhArticles = articles.filter((a: any) => !a.id.match(/^(en|ja|zh-cn)\//));

  const index = zhArticles.map((a: any) => {
    const p = PILLAR_MAP[a.data.pillar as keyof typeof PILLAR_MAP];
    const slug = a.id.replace(/\.md$/, '');
    return {
      title: a.data.title,
      description: a.data.description,
      abstract: a.data.abstract || a.data.description,
      pillar: a.data.pillar,
      pillarLabel: p?.label || a.data.pillar,
      tags: a.data.tags || [],
      date: a.data.date.toISOString().split('T')[0],
      url: `/articles/${slug}`,
      readingTime: a.data.readingTime,
    };
  });

  // Sort by date descending
  index.sort((a: any, b: any) => b.date.localeCompare(a.date));

  return new Response(JSON.stringify(index, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
