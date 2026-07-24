/* =============================================================
   why.js — ③ なぜ色々作るのか セクションの DOM 生成
   data/content.js（why）を読み込み、本文＋庭への控えめなリンクを描画する。
   最後の段落の末尾に、地の文の続きとしてリンクを挿入する。
   ============================================================= */

import { content } from "../data/content.js";

document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector("[data-why-body]");
  if (!host) return;

  const { paragraphs, linkText, linkHref } = content.why;
  const lastIndex = paragraphs.length - 1;

  host.innerHTML = paragraphs
    .map((p, i) => {
      if (i !== lastIndex) return `<p>${p}</p>`;
      return `<p>${p} <a class="why__link" href="${linkHref}">${linkText}</a></p>`;
    })
    .join("");
});
