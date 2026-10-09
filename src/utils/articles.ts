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

// 記事に付いたタグを、付いている記事数の多い順(同数なら名前順)で返す
export function collectTags(articles: CollectionEntry<'articles'>[]) {
  const counts = new Map<string, number>();
  for (const tag of articles.flatMap((a) => a.data.tags)) {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b, 'ja'));
}

// そのタグで絞り込んだ Articles ページのURL
export function tagFilterUrl(tag: string) {
  return `/articles/?tag=${encodeURIComponent(tag)}`;
}
