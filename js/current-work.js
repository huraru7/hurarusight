/* =============================================================
   current-work.js — ④ 今、手を出していること セクションの DOM 生成
   data/content.js（currentWork）を読み込み、罫線区切りのリストを描画する。
   ============================================================= */

import { content } from "../data/content.js";

function itemHTML(item) {
  return `
    <li class="current-work__item">
      <a class="current-work__link" href="${item.url}" target="_blank" rel="noopener noreferrer">
        <span class="current-work__genre">${item.genre}</span>
        <span class="current-work__teaser">${item.teaser}</span>
        <span class="current-work__arrow" aria-hidden="true">→</span>
      </a>
    </li>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector("[data-current-work-list]");
  if (!host) return;
  host.innerHTML = content.currentWork.map(itemHTML).join("");
});
