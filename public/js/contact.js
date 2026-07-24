/* =============================================================
   contact.js — ⑤ 連絡先（再掲）セクションの DOM 生成
   ヒーローと同じリンクボタン行を再掲する。
   ============================================================= */

import { renderLinkButtons } from "./link-buttons.js";

document.addEventListener("DOMContentLoaded", () => {
  renderLinkButtons("[data-contact-links]");
});
