/**
 * OG Image endpoint: /og/[...slug].png
 * Generates a unique OG image for each article at build time
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../utils/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  return articles.map((article) => ({
    params: { slug: article.id.replace(/\.md$/, '') },
    props: { article },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as any;
  const { title, description, pillar, date } = article.data;

  const png = await generateOgImage({
    title,
    pillar,
    description,
    date: date.toISOString().split('T')[0],
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
