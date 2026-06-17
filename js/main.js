/* =============================================================
   main.js — サイトの動き
   data/content.js（唯一の編集場所）を読み込み、HTML の印に流し込む。
     - data-bind="profile.tagline" … その値をテキストとして入れる
     - data-links                   … links を <li><a> で一覧化
     - data-intro                   … profile.intro を <p> 段落で展開
   ============================================================= */

import { content } from "../data/content.js";

document.addEventListener("DOMContentLoaded", () => {
  bindText();
  renderLinks();
  renderIntro();
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

/** [data-links] の中に、links をリンク一覧として生成 */
function renderLinks() {
  const host = document.querySelector("[data-links]");
  if (!host) return;
  host.innerHTML = content.links
    .map((l) => `<li><a href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a></li>`)
    .join("");
}

/** [data-intro] の中に、自己紹介を段落として生成 */
function renderIntro() {
  const host = document.querySelector("[data-intro]");
  if (!host) return;
  host.innerHTML = content.profile.intro.map((p) => `<p>${p}</p>`).join("");
}
