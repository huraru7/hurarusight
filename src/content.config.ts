import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 記事（1記事 = 1ファイル。書いたら完結する単発記事）
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    // 記事の識別子(連番など。ファイル名やURLを変えても変わらない目印)
    id: z.string(),
    // URL表記用(半角英数字とハイフン)。/articles/<slug>/ になる
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    // 検索結果やSNS共有に出る説明文(120字前後まで)
    description: z.string(),
    date: z.string(),
  }),
});

export const collections = { articles };
