/* =============================================================
   header.js — サイト共通ヘッダー
   パス判定でindex.html / garden配下どちらでも正しいリンクを生成する。
   ============================================================= */

export function initHeader() {
  const path = window.location.pathname;
  const isGarden = path.startsWith("/garden/");
  const isGardenIndex = path === "/garden/" || path === "/garden/index.html";

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="site-header__logo" href="/">ふらる</a>
    <nav class="site-header__nav" aria-label="メインナビゲーション">
      <a class="site-header__link ${!isGarden ? "is-current" : ""}"
         href="/">Top</a>
      <a class="site-header__link ${isGardenIndex ? "is-current" : ""}"
         href="/garden/">Garden</a>
      <a class="site-header__link"
         href="/#about">About</a>
    </nav>
  `;

  document.body.prepend(header);
}
