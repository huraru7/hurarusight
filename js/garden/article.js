/* =============================================================
   garden/article.js — 庭の記事個別ページ
   URLの ?slug=xxx から記事を特定し、最新の手入れ本文を表示する。
   手入れヘッダーをクリックすると過去のログをアコーディオン展開する。
   ============================================================= */

import { garden } from "../../data/garden-index.js";
import { loadEntryBody } from "./load-entry.js";
import { renderMarkdown } from "./render-markdown.js";
import { formatTicks, formatDateRelative } from "../utils/format.js";

function getSlugFromURL() {
  return new URLSearchParams(window.location.search).get("slug");
}

async function toggleAccordion(accordion, header, pastEntries) {
  const isOpen = accordion.classList.toggle("is-open");
  header.setAttribute("aria-expanded", String(isOpen));

  if (isOpen && !accordion.dataset.loaded) {
    const bodies = await Promise.all(pastEntries.map((e) => loadEntryBody(e.file)));
    accordion.innerHTML = pastEntries
      .map(
        (entry, i) => `
        <div class="tending-log__entry">
          <p class="tending-log__date">── ${formatDateRelative(entry.date)} ──</p>
          <div class="tending-log__body">${renderMarkdown(bodies[i])}</div>
        </div>`
      )
      .join("");
    accordion.dataset.loaded = "true";
  }

  accordion.style.maxHeight = isOpen ? accordion.scrollHeight + "px" : "0px";
}

async function renderArticle() {
  const root = document.querySelector("[data-article-root]");
  const slug = getSlugFromURL();
  const article = garden.find((a) => a.slug === slug);

  if (!article) {
    root.innerHTML = "<p>記事が見つかりませんでした。</p>";
    return;
  }

  const latest = article.history[article.history.length - 1];
  const past = article.history.slice(0, -1).reverse(); // 新しい順
  const tickCount = article.history.length;

  document.title = `${article.title} | ふらる`;
  document.querySelector("[data-article-genre]").textContent = article.genre;
  document.querySelector("[data-article-title]").textContent = article.title;

  const latestBody = await loadEntryBody(latest.file);
  document.querySelector("[data-article-body]").innerHTML = renderMarkdown(latestBody);

  const header = document.querySelector("[data-tending-header]");
  const label = `手入れ ${formatTicks(tickCount)} (${tickCount}) ・ ${formatDateRelative(latest.date)}に手入れ`;
  header.querySelector("[data-tending-label]").textContent = label;

  if (past.length === 0) {
    header.hidden = true;
    return;
  }

  const accordion = document.querySelector("[data-tending-log]");
  header.addEventListener("click", () => toggleAccordion(accordion, header, past));
}

document.addEventListener("DOMContentLoaded", renderArticle);
