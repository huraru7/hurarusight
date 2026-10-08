import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { articlesDir } from './utils/articlesDir.js';

// 記事（1記事 = 1ファイル。書いたら完結する単発記事）
const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: articlesDir }),
  schema: z.object({
    // URLはファイル名で決まる(/articles/<ファイル名>/)
    title: z.string(),
    // 検索結果やSNS共有に出る説明文(120字前後まで)
    description: z.string(),
    date: z.string(),
    // draft: 下書き(本番ビルドには出さない。devでは見える)
    // unlisted: 一覧(トップ・Articles)とサイトマップに出さず、検索にも載せない。URLを直接開けば読める
    // published: 公開
    status: z.enum(['draft', 'unlisted', 'published']).default('draft'),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
