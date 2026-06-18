/* =============================================================
   main.js — サイトの動き
   data/content.js（唯一の編集場所）を読み込み、HTML の印に流し込む。
     - data-bind="profile.tagline" … その値をテキストとして入れる
   リンク（Links セクション）は js/links.js / data/links.js が、
   プロフィール詳細（About セクション）は js/about.js / data/profile.js が別途担当する。
   ============================================================= */

import { content } from "../data/content.js";

document.addEventListener("DOMContentLoaded", () => {
  bindText();
  console.log("huraru — content loaded");
});

/** "profile.tagline" のような文字列で content の中をたどる */
function getPath(obj, path) {
  return path.split(".").reduce((o, key) => (o == null ? o : o[key]), obj);
}

/** [data-bind] の要素に、対応する値を入れる */
function bindText() {
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const value = getPath(content, el.dataset.bind);
    if (value != null) el.textContent = value;
  });
}
