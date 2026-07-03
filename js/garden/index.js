/* =============================================================
   garden/index.js — 庭トップページ：一覧＋フィルタータブの描画
   ============================================================= */

import { garden } from "../../data/garden-index.js";
import { loadEntryBody } from "./load-entry.js";
import { toPlainPreview } from "./render-markdown.js";
import { formatTicks, formatDateRelative } from "../utils/format.js";

const ALL_GENRE = "すべて";
const GENRES = [ALL_GENRE, "近況", "エッセイ", "メモ", "かけら"];

/* --- コンテンツスコアリング --- */

function scoreCard(article, bodyText) {
  const wordCount = bodyText.trim().split(/\s+/).filter(Boolean).length;
  let score = 0;
  score += Math.min(wordCount / 80, 3);            // 本文の長さ: 0〜3点
  score += Math.min(article.history.length / 3, 1); // 手入れ回数: 0〜1点
  return score;
}

function getIdealSpan(score) {
  if (score >= 3.5) return 3;
  if (score >= 2)   return 2;
  return 1;
}

/* --- 3列グリッドへの貪欲法span割当 --- */

function assignSpans(items) {
  const COLS = 3;
  let colsUsed = 0;
  return items.map((item) => {
    let span = item.idealSpan;
    if (colsUsed + span > COLS) {
      const remaining = COLS - colsUsed;
      if (remaining > 0) {
        span = remaining;
      } else {
        colsUsed = 0;
        span = Math.min(item.idealSpan, COLS);
      }
    }
    colsUsed = (colsUsed + span) % COLS;
    return { ...item, span };
  });
}

/* --- カードHTML --- */

function cardHTML(item) {
  const { article, preview, span } = item;
  const latest = article.history[article.history.length - 1];
  const count = article.history.length;
  return `
    <a class="garden-card" href="article.html?slug=${article.slug}" data-span="${span}" data-genre="${article.genre}">
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

/* --- タブ描画 --- */

function renderTabs() {
  const host = document.querySelector("[data-garden-tabs]");
  if (!host) return;
  host.innerHTML = GENRES.map(
    (g) =>
      `<button class="garden-tab${g === ALL_GENRE ? " is-active" : ""}" data-genre="${g}">${g}</button>`
  ).join("");
}

/* --- 件数ヘッダー --- */

function renderCount() {
  const el = document.querySelector("[data-garden-count]");
  if (el) el.textContent = `${garden.length}株`;
}

/* --- 一覧描画（全文fetch・スコア計算・グリッド配置） --- */

async function renderList() {
  const host = document.querySelector("[data-garden-list]");
  if (!host) return;

  const bodies = await Promise.all(
    garden.map((a) => loadEntryBody(a.history[a.history.length - 1].file))
  );

  const withScores = garden.map((article, i) => ({
    article,
    preview: toPlainPreview(bodies[i]),
    idealSpan: getIdealSpan(scoreCard(article, bodies[i])),
  }));

  const placed = assignSpans(withScores);
  host.innerHTML = placed.map(cardHTML).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  renderCount();
  renderTabs();
  renderList();
});
