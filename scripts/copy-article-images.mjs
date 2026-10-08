// 記事リポジトリの images/ を、公開フォルダ public/article-images/ へコピーする
// 記事からは /article-images/<記事名>/<画像> で参照する
import { cpSync, existsSync, rmSync } from 'node:fs';
import { articlesRoot } from '../src/utils/articlesDir.js';

const source = `${articlesRoot}/images`;
const destination = 'public/article-images';

rmSync(destination, { recursive: true, force: true });
if (existsSync(source)) {
  cpSync(source, destination, { recursive: true });
  console.log(`記事の画像をコピーしました: ${source} -> ${destination}`);
} else {
  console.log(`記事の画像フォルダがありません: ${source}`);
}
