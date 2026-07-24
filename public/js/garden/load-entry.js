/* =============================================================
   load-entry.js — 庭の記事 .md ファイルを fetch して本文を取得する
   一度取得したファイルはキャッシュし、再フェッチしない。
   ============================================================= */

const cache = new Map();
const BASE = "../data/garden/"; // garden/*.html から見た data/garden/ への相対パス

export async function loadEntryBody(filePath) {
  if (cache.has(filePath)) return cache.get(filePath);
  const res = await fetch(BASE + filePath);
  const text = res.ok ? await res.text() : "";
  cache.set(filePath, text);
  return text;
}
