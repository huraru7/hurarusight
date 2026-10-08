// 記事リポジトリが手元になければ clone する(Cloudflare Pages のビルド用)
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { articlesRoot } from '../src/utils/articlesDir.js';

const repoUrl = process.env.ARTICLES_REPO ?? 'https://github.com/huraru7/hurarusight-articles.git';

if (existsSync(articlesRoot)) {
  console.log(`記事リポジトリは取得済みです: ${articlesRoot}`);
} else {
  console.log(`記事リポジトリを取得します: ${repoUrl} -> ${articlesRoot}`);
  execFileSync('git', ['clone', '--depth', '1', repoUrl, articlesRoot], { stdio: 'inherit' });
}
