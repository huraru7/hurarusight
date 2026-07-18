/* =============================================================
   header.js — サイト共通ヘッダー
   パス判定でindex.html / garden配下どちらでも正しいリンクを生成する。
   ============================================================= */

export function initHeader() {
  const isGarden = window.location.pathname.includes("/garden/");
  const base = isGarden ? "../" : "./";

  // 現在ページの判定（ナビリンクのis-current用）
  const path = window.location.pathname;
  const isTop    = !isGarden;
  const isGardenIndex = isGarden && (path.endsWith("index.html") || path.endsWith("/garden/"));
  const isAbout  = false; // aboutはトップの#aboutセクションなのでページ判定不要

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="site-header__logo" href="${base}index.html">ふらる</a>
    <nav class="site-header__nav" aria-label="メインナビゲーション">
      <a class="site-header__link ${isTop ? "is-current" : ""}"
         href="${base}index.html">Top</a>
      <a class="site-header__link ${isGardenIndex ? "is-current" : ""}"
         href="${base}garden/index.html">Garden</a>
      <a class="site-header__link"
         href="${base}index.html#about">About</a>
    </nav>
  `;

  document.body.prepend(header);
}
