import { getCollection, type CollectionEntry } from 'astro:content';

// 下書き(draft)は、開発中(dev)だけ表示し、本番ビルドには出さない
const isVisible = (a: CollectionEntry<'articles'>) =>
  import.meta.env.DEV || a.data.status !== 'draft';

// URLを持つ記事(unlisted を含み、本番では draft を除く)
export async function getPublishedArticles() {
  return getCollection('articles', isVisible);
}

// 一覧に出す記事(unlisted を除く)を、日付の新しい順で返す
export async function getListedArticles() {
  const articles = await getCollection('articles', (a) => isVisible(a) && a.data.status !== 'unlisted');
  return articles.sort((a, b) => b.data.date.localeCompare(a.data.date));
}
