/**
 * OG Image endpoint: /og/wiki/[slug].png
 * Generates unique OG images for wiki concept + entity pages at build time.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../../utils/og-image';

export const getStaticPaths: GetStaticPaths = async () => {
  const concepts = await getCollection('wiki_concepts', ({ data }) => data.visibility === 'public');
  const entities = await getCollection('wiki_entities', ({ data }) => data.visibility === 'public');

  return [...concepts, ...entities].map((page) => {
    const slug = page.data.slug || page.id.replace(/\.md$/, '');
    return {
      params: { slug },
      props: { page },
    };
  });
};

export const GET: APIRoute = async ({ props }) => {
  const { page } = props as any;
  const { title, pillar, source_count, type } = page.data;

  const typeLabel = type === 'entity' ? '人物' : '概念';
  const description = `${typeLabel} · ${source_count || 0} 篇來源引用 · Paul Kuo 知識圖譜`;

  const png = await generateOgImage({
    title,
    pillar,
    description,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
