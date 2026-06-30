/* =============================================================
   main.js — サイトの動き
   data/content.js（唯一の編集場所）を読み込み、HTML の印に流し込む。
     - data-bind="profile.tagline" … その値をテキストとして入れる
   各セクションの詳細な描画は、セクションごとの js/xxx.js が担当する。
   ============================================================= */

import { content } from "../data/content.js";

document.addEventListener("DOMContentLoaded", () => {
  bindText();
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
