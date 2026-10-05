import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://huraru.com',
  // 404ページは検索に載せないのでサイトマップから除外する
  integrations: [sitemap({ filter: (page) => !page.endsWith('/404/') })],
});
