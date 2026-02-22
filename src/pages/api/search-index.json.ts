/**
 * search-index.json.ts — Build-time search index for WebMCP + client-side search
 * Generates a lightweight JSON of all articles for AI agent tool calls
 */
import { getCollection } from 'astro:content';
import { PILLAR_MAP } from '../../config';

export async function GET() {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const index = articles.map((article) => ({
    slug: article.id.replace(/\.md$/, ''),
    title: article.data.title,
    description: article.data.description,
    tags: article.data.tags || [],
    pillar: article.data.pillar,
    pillarLabel: PILLAR_MAP[article.data.pillar]?.label || article.data.pillar,
    date: article.data.date.toISOString().split('T')[0],
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
