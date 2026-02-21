import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
  loader: glob({
    base: 'src/content/articles',
    pattern: '*.md',
  }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    description: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    pillar: z.enum(['ai', 'circular', 'faith', 'startup', 'life']),
    tags: z.array(z.string()).default([]),
    platform: z.string().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    readingTime: z.number().optional(),
    medium_url: z.string().optional(),
  }),
});

export const collections = { articles };
