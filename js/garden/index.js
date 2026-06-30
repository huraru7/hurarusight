/* =============================================================
   garden/index.js — 庭トップページ：一覧＋フィルタータブの描画
   ============================================================= */

import { garden } from "../../data/garden-index.js";
import { loadEntryBody } from "./load-entry.js";
import { renderMarkdown } from "./render-markdown.js";
import { formatTicks, formatDateRelative } from "../utils/format.js";

const GENRES = ["近況", "エッセイ", "メモ", "かけら"];

function excerptOf(html) {
  return html.replace(/<[^>]+>/g, "").trim();
}

function itemHTML(article, excerpt) {
  const latest = article.history[article.history.length - 1];
  const count = article.history.length;
  return `
    <li class="garden-list__item" data-genre="${article.genre}">
      <a href="article.html?slug=${article.slug}">
        <p class="garden-list__meta">${article.genre} ・ 手入れ ${formatTicks(count)} (${count}) ・ ${formatDateRelative(latest.date)}</p>
        <h2 class="garden-list__title">${article.title}</h2>
        <p class="garden-list__excerpt">${excerpt}</p>
      </a>
    </li>`;
}

function renderTabs() {
  const host = document.querySelector("[data-garden-tabs]");
  if (!host) return;
  host.innerHTML = GENRES.map((g) => `<button class="garden-tab" data-genre="${g}">${g}</button>`).join("");
}

async function renderList() {
  const host = document.querySelector("[data-garden-list]");
  if (!host) return;

  const excerpts = await Promise.all(
    garden.map(async (article) => {
      const latest = article.history[article.history.length - 1];
      const body = await loadEntryBody(latest.file);
      return excerptOf(renderMarkdown(body));
    })
  );

  host.innerHTML = garden.map((article, i) => itemHTML(article, excerpts[i])).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderTabs();
  renderList();
});
