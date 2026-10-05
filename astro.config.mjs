import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkBreaks from 'remark-breaks';
import remarkSubtext from './src/plugins/remark-subtext.ts';
import remarkLinkCard from './src/plugins/remark-link-card.ts';

// frontmatter に `unlisted: true` がある記事のURLを集める(サイトマップから除外するため)
const articlesDir = './src/content/articles';
const unlistedPaths = readdirSync(articlesDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => readFileSync(`${articlesDir}/${f}`, 'utf-8').split('---')[1] ?? '')
  .filter((fm) => /^unlisted:\s*true\s*$/m.test(fm))
  .map((fm) => `/articles/${/^slug:\s*(\S+)\s*$/m.exec(fm)?.[1]}/`);

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
