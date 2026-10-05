import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 記事（1記事 = 1ファイル。書いたら完結する単発記事）
const notes = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.string(),
  }),
});

export const collections = { notes };
