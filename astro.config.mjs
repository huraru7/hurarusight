import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import remarkSubtext from './src/plugins/remark-subtext.ts';
import remarkLinkCard from './src/plugins/remark-link-card.ts';
import { articlesDir } from './src/utils/articlesDir.js';

// 記事が0本のまま公開されないよう、ビルドを止める
const articleFiles = readdirSync(articlesDir).filter((f) => f.endsWith('.md'));
if (articleFiles.length === 0) throw new Error(`記事が見つかりません: ${articlesDir}`);

// frontmatter の status が unlisted の記事のURLを集める(サイトマップから除外するため)
const unlistedPaths = articleFiles
  .filter((f) => /^status:\s*unlisted\s*$/m.test(readFileSync(`${articlesDir}/${f}`, 'utf-8').split('---')[1] ?? ''))
  .map((f) => `/articles/${f.replace(/\.md$/, '')}/`);

export default defineConfig({
  site: 'https://huraru.com',
  // remark プラグイン(改行の反映・サブテキスト・リンクカード)を使うため、標準のSätteriではなく unified を使う
  markdown: { processor: unified({ remarkPlugins: [remarkBreaks, remarkSubtext, remarkLinkCard] }) },
  integrations: [
    sitemap({
      // 404ページと unlisted の記事は検索に載せないので、サイトマップから除外する
      filter: (page) =>
        !page.endsWith('/404/') && !unlistedPaths.some((p) => page.endsWith(p)),
    }),
  ],
});
