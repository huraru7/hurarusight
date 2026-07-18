/* =============================================================
   garden/index.js — 庭トップページ：一覧＋フィルターの描画
   ============================================================= */

import { garden } from "../../data/garden-index.js";
import { loadEntryBody } from "./load-entry.js";
import { toPlainPreview } from "./render-markdown.js";
import { formatTicks, formatDateRelative } from "../utils/format.js";
import { applyReadStyles, restoreGardenScroll } from "../world/memory.js";

const ALL = "すべて";
const GENRES = [ALL, "近況", "エッセイ", "メモ", "かけら"];

/* --- topicsを全記事から重複なく抽出 --- */

function extractTopics(posts) {
  const all = posts.flatMap((p) => p.topics || []);
  return [ALL, ...new Set(all)];
}

/* --- カードサイズ算出 --- */

function getCardSpan(article, bodyText) {
  const tending = article.history.length;
  const bodyLen = bodyText.replace(/[#*\->\[\]()]/g, "").length;
  const hasThumb = !!article.thumbnail;

  if (hasThumb) {
    const ratio = article.thumbnailRatio || 1;
    if (ratio >= 0.8 && ratio <= 1.2) return { col: 2, row: 2 };
    if (ratio < 0.5)                  return { col: 2, row: 1 };
    if (ratio > 1.5)                  return { col: 1, row: 2 };
    return { col: 2, row: 1 };
  }

  if (bodyLen >= 100 && tending >= 3) return { col: 2, row: 1 };
  if (bodyLen >= 50)                  return { col: 1, row: 1 };
  return { col: 1, row: 1 };
}

/* --- カードHTML --- */

function cardHTML(article, preview, bodyText) {
  const { col, row } = getCardSpan(article, bodyText);
  const latest = article.history[article.history.length - 1];
  const count = article.history.length;
  const topicsAttr = (article.topics || []).join(",");
  return `
    <a class="garden-card"
       href="article.html?slug=${article.slug}"
       style="grid-column: span ${col}; grid-row: span ${row};"
       data-genre="${article.genre}"
       data-slug="${article.slug}"
       data-topics="${topicsAttr}">
      <p class="garden-card__genre">${article.genre}</p>
      <h2 class="garden-card__title">${article.title}</h2>
      <p class="garden-card__body">${preview}</p>
      <p class="garden-card__meta">
        <span class="garden-card__date">${formatDateRelative(latest.date)}</span>
        ・
        <span class="garden-card__ticks">${formatTicks(count)} ×${count}</span>
      </p>
    </a>`;
}

/* --- フィルター描画（TOPICS横スクロール + Typeドロップダウン） --- */

function renderFilters(allTopics) {
  const host = document.querySelector("[data-garden-filters]");
  if (!host) return;

  const topicButtons = allTopics
    .map(
      (t) =>
        `<button class="garden-tab${t === ALL ? " is-active" : ""}" data-topic="${t}">${t}</button>`
    )
    .join("");

  const typeOptions = GENRES.map(
    (g) =>
      `<li><button class="garden-type-option${g === ALL ? " is-active" : ""}" data-type-option="${g}">
        ${g === ALL ? "すべて" : g}
      </button></li>`
  ).join("");

  host.innerHTML = `
    <div class="garden-filter-row garden-filter-row--topics">
      <span class="garden-filter-label">TOPICS</span>
      <span class="garden-filter-sep" aria-hidden="true"></span>
      <button class="garden-scroll-btn" data-scroll-dir="left" aria-label="左へスクロール">&#8249;</button>
      <div class="garden-topics-scroll" data-topics-scroll>
        ${topicButtons}
      </div>
      <button class="garden-scroll-btn" data-scroll-dir="right" aria-label="右へスクロール">&#8250;</button>
    </div>
    <div class="garden-filter-row garden-filter-row--type">
      <div class="garden-type-dropdown">
        <button class="garden-type-trigger" data-type-trigger aria-expanded="false" aria-haspopup="listbox">
          <span data-type-label>すべてのType</span>
          <span class="garden-type-trigger__caret">▼</span>
        </button>
        <ul class="garden-type-menu" data-type-menu role="listbox" hidden>
          ${typeOptions}
        </ul>
      </div>
    </div>
  `;
}

/* --- 件数ヘッダー --- */

function renderCount() {
  const el = document.querySelector("[data-garden-count]");
  if (el) el.textContent = `${garden.length}株`;
}

/* --- 一覧描画（全文fetch） --- */

async function renderList() {
  const host = document.querySelector("[data-garden-list]");
  if (!host) return;

  const bodies = await Promise.all(
    garden.map((a) => loadEntryBody(a.history[a.history.length - 1].file))
  );

  host.innerHTML = garden.map((article, i) => cardHTML(article, toPlainPreview(bodies[i]), bodies[i])).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCount();
  renderFilters(extractTopics(garden));
  renderList().then(() => {
    applyReadStyles();
    restoreGardenScroll();
  });
});
