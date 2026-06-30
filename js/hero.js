/* =============================================================
   hero.js — ① ファーストビューの DOM 生成
   data/content.js（profile）を読み込み、アバター頭文字とリンクボタンを描画する。
   ============================================================= */

import { content } from "../data/content.js";
import { renderLinkButtons } from "./link-buttons.js";

function renderHeroAvatar() {
  const el = document.querySelector("[data-hero-avatar]");
  if (el) el.textContent = content.profile.name.charAt(0);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeroAvatar();
  renderLinkButtons("[data-hero-links]");
});
