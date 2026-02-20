import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    titleEn: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    pillar: z.enum(['ai', 'circular', 'faith', 'startup', 'life']),
    pillarLabel: z.string(),
    platform: z.string().default('paulkuo.tw'),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['zh', 'en', 'ja', 'zh-cn']),
    canonicalSlug: z.string(),
    draft: z.boolean().default(false),
    image: z.string().optional(),
    externalUrl: z.string().url().optional(),
  })
});

export const collections = { articles };
