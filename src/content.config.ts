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
  coverAlt: z.string().optional(),
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

// Wiki knowledge graph pages
const wikiSchema = z.object({
  title: z.string(),
  slug: z.string().optional(),
  type: z.enum(['concept', 'entity', 'topic', 'source', 'comparison']),
  pillar: z.enum(['ai', 'circular', 'faith', 'startup', 'life']),
  // Visibility & sensitivity rules: see docs/wiki-visibility-rules.md (SSOT).
  visibility: z.enum(['public', 'internal']).default('public'),
  sensitivity: z.enum([
    'safe',                    // default, no sensitive material
    'contains_pii',            // names, phone, email
    'business_confidential',   // company names, deal terms, amounts
    'personal_reflection',     // Paul's private reflections / memorials
  ]).optional().default('safe'),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  last_updated: z.coerce.date().optional(),
  source_count: z.number().default(0),
  confidence: z.enum(['low', 'medium', 'high']).default('low'),
  tags: z.array(z.string()).default([]),
  links_to: z.array(z.string()).default([]),
  linked_from: z.array(z.string()).default([]),
  raw_source_path: z.string().optional(),
  raw_source_type: z.string().optional(),
  raw_note_id: z.string().optional(),
  // Enrichment fields (populated by wiki-enrich.cjs)
  enriched_at: z.string().optional(),
  enriched_by: z.string().optional(),
  summary: z.string().optional(),
  key_points: z.array(z.string()).optional(),
  quotes: z.array(z.object({
    text: z.string(),
    timestamp: z.string(),
  })).optional(),
  chapters: z.array(z.object({
    title: z.string(),
    start: z.string(),
    summary: z.string(),
  })).optional(),
  concept_links: z.object({
    matched: z.array(z.string()),
    candidates: z.array(z.object({
      slug_zh: z.string(),
      title: z.string(),
      reason: z.string(),
    })),
  }).optional(),
  wrong_pillar_suspected: z.boolean().optional(),
  enrichment_notes: z.string().optional(),
  paul_perspective: z.string().optional(),
});

const wiki_concepts = defineCollection({
  loader: glob({
    base: 'src/content/wiki/concepts',
    pattern: '*.md',
  }),
  schema: wikiSchema,
});

const wiki_entities = defineCollection({
  loader: glob({
    base: 'src/content/wiki/entities',
    pattern: '*.md',
  }),
  schema: wikiSchema,
});

const wiki_sources = defineCollection({
  loader: glob({
    base: 'src/content/wiki/sources',
    pattern: '*.md',
  }),
  schema: wikiSchema,
});

export const collections = {
  articles,
  articles_en,
  articles_ja,
  articles_zhcn,
  wiki_concepts,
  wiki_entities,
  wiki_sources,
};
