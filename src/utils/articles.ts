import { getCollection } from 'astro:content';

// 一覧に出す記事(unlisted を除く)を、日付の新しい順で返す
export async function getListedArticles() {
  const articles = await getCollection('articles', (a) => !a.data.unlisted);
  return articles.sort((a, b) => b.data.date.localeCompare(a.data.date));
}
