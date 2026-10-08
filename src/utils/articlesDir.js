// 記事リポジトリ(hurarusight-articles)の場所。環境変数 ARTICLES_DIR で変えられる。
// 既定は、サイトのリポジトリと同じ階層にある ../hurarusight-articles
export const articlesRoot = process.env.ARTICLES_DIR ?? '../hurarusight-articles';

// 記事(Markdown)を置くフォルダ
export const articlesDir = `${articlesRoot}/articles`;
