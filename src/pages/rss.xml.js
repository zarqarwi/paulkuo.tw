import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE, PILLAR_MAP } from '../config';

export async function GET(context) {
  const articles = (await getCollection('articles', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Paul Kuo — Thinking Out Loud',
    description: SITE.description,
    site: context.site || SITE.url,
    language: 'zh-Hant',
    items: articles.map((article) => {
      const slug = article.id.replace(/\.md$/, '');
      const pillar = PILLAR_MAP[article.data.pillar];
      return {
        title: article.data.title,
        pubDate: article.data.date,
        description: article.data.abstract || article.data.description,
        link: `/articles/${slug}/`,
        categories: [pillar.label, ...(article.data.tags || [])],
        // Include full content for RAG systems
        content: article.body || article.data.description,
      };
    }),
    customData: [
      '<atom:link href="https://paulkuo.tw/rss.xml" rel="self" type="application/rss+xml" />',
      '<language>zh-Hant</language>',
    ].join(''),
    xmlns: {
      atom: 'http://www.w3.org/2005/Atom',
    },
  });
}
