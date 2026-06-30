/* =============================================================
   about.js — ② 人柄紹介セクションの DOM 生成
   data/content.js（about.paragraphs）を読み込み、本文を描画する。
   ============================================================= */

import { content } from "../data/content.js";

document.addEventListener("DOMContentLoaded", () => {
  const host = document.querySelector("[data-about-body]");
  if (!host) return;
  host.innerHTML = content.about.paragraphs.map((p) => `<p>${p}</p>`).join("");
});
