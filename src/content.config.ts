import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 記事メタデータ（1記事 = 1ファイル）
const garden = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/garden' }),
  schema: z.object({
    title: z.string(),
    genre: z.enum(['update', 'essay', 'note', 'fragment', 'creative', 'gamedev']),
    topics: z.array(z.string()).default([]),
    preview: z.string().default(''),
    thumbnail: z.string().default(''),
    thumbnailRatio: z.number().nullable().default(null),
  }),
});

// 手入れエントリ（1手入れ = 1ファイル、本文のみ）
// entry.id = "slug/YYYY-MM-DD" の形式
const gardenLog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/garden-log' }),
  schema: z.object({}),
});

export const collections = { garden, gardenLog };
