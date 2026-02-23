import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string(),
  abstract: z.string().optional(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  pillar: z.enum(['ai', 'circular', 'faith', 'startup', 'life']),
  tags: z.array(z.string()).default([]),
  platform: z.string().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  readingTime: z.number().optional(),
  medium_url: z.string().optional(),
  cover: z.string().optional(),
});

// 繁體中文（主語系）
const articles = defineCollection({
  loader: glob({
    base: 'src/content/articles',
    pattern: '*.md',
  }),
  schema: articleSchema,
});

// English
const articles_en = defineCollection({
  loader: glob({
    base: 'src/content/articles/en',
    pattern: '*.md',
  }),
  schema: articleSchema,
});

// 日本語
const articles_ja = defineCollection({
  loader: glob({
    base: 'src/content/articles/ja',
    pattern: '*.md',
  }),
  schema: articleSchema,
});

// 简体中文
const articles_zhcn = defineCollection({
  loader: glob({
    base: 'src/content/articles/zh-cn',
    pattern: '*.md',
  }),
  schema: articleSchema,
});

export const collections = {
  articles,
  articles_en,
  articles_ja,
  articles_zhcn,
};
