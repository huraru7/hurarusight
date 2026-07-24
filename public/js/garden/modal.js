/* =============================================================
   garden/modal.js — 記事をモーダルで表示する
   - カードクリック → モーダル表示 + URL を ?slug=xxx に更新
   - オーバーレイ / ✕ / Escape → 閉じる + URL を元に戻す
   - ブラウザの戻る/進む → popstate で同期
   - 直接 ?slug=xxx でアクセスしてもモーダルが開く
   ============================================================= */

import { garden } from "../../data/garden-index.js";
import { loadEntryBody } from "./load-entry.js";
import { renderMarkdown } from "./render-markdown.js";
import { formatTicks, formatDateRelative } from "../utils/format.js";
import { markAsRead } from "../world/memory.js";

/* --- DOM参照 --- */

const modal         = document.getElementById("garden-modal");
const overlay       = modal.querySelector(".garden-modal__overlay");
const panel         = modal.querySelector(".garden-modal__panel");
const elGenre       = modal.querySelector("[data-modal-genre]");
const elTitle       = modal.querySelector("[data-modal-title]");
const elBody        = modal.querySelector("[data-modal-body]");
const elTendingHdr  = modal.querySelector("[data-modal-tending-header]");
const elTendingLbl  = modal.querySelector("[data-modal-tending-label]");
const elTendingLog  = modal.querySelector("[data-modal-tending-log]");

/* --- 状態 --- */

let currentSlug = null;

/* --- モーダルを開く --- */

async function openModal(slug) {
  const article = garden.find((a) => a.slug === slug);
  if (!article) return;

  currentSlug = slug;

  // URL更新（履歴に積む）
  history.pushState({ slug }, "", `?slug=${slug}`);
  document.title = `${article.title} | ふらる`;

  // ローディング状態でまず表示
  elGenre.textContent = article.genre;
  elTitle.textContent = article.title;
  elBody.textContent = "読み込み中…";
  elTendingHdr.hidden = true;
  elTendingHdr.onclick = null;
  elTendingLog.innerHTML = "";
  elTendingLog.style.maxHeight = "0";
  elTendingLog.classList.remove("is-open");
  delete elTendingLog.dataset.loaded;

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  panel.scrollTop = 0;

  markAsRead(slug);

  // コンテンツ取得
  await loadModalContent(article);
}

async function loadModalContent(article) {
  const latest    = article.history[article.history.length - 1];
  const past      = article.history.slice(0, -1).reverse();
  const tickCount = article.history.length;

  const latestBody = await loadEntryBody(latest.file);
  elBody.innerHTML = renderMarkdown(latestBody);

  const label = `手入れ ${formatTicks(tickCount)} (${tickCount}) ・ ${formatDateRelative(latest.date)}に手入れ`;
  elTendingLbl.textContent = label;

  if (past.length === 0) {
    elTendingHdr.hidden = true;
    return;
  }

  elTendingHdr.hidden = false;
  elTendingHdr.setAttribute("aria-expanded", "false");

  elTendingHdr.onclick = async () => {
    const isOpen = elTendingLog.classList.toggle("is-open");
    elTendingHdr.setAttribute("aria-expanded", String(isOpen));

    if (isOpen && !elTendingLog.dataset.loaded) {
      const bodies = await Promise.all(past.map((e) => loadEntryBody(e.file)));
      elTendingLog.innerHTML = past
        .map(
          (entry, i) => `
          <div class="tending-log__entry">
            <p class="tending-log__date">── ${formatDateRelative(entry.date)} ──</p>
            <div class="tending-log__body">${renderMarkdown(bodies[i])}</div>
          </div>`
        )
        .join("");
      elTendingLog.dataset.loaded = "true";
    }

    elTendingLog.style.maxHeight = isOpen ? elTendingLog.scrollHeight + "px" : "0px";
  };
}

/* --- モーダルを閉じる --- */

function closeModal() {
  if (!modal.classList.contains("is-open")) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  document.title = "庭 | ふらる";
  currentSlug = null;
  history.pushState({}, "", location.pathname);
}

/* --- イベント --- */

// オーバーレイ・✕ボタン
modal.addEventListener("click", (e) => {
  if (e.target.closest("[data-modal-close]")) closeModal();
});

// Escキー
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ブラウザの戻る/進む
window.addEventListener("popstate", (e) => {
  if (e.state?.slug) {
    openModal(e.state.slug);
  } else {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.title = "庭 | ふらる";
    currentSlug = null;
  }
});

/* --- 初期化 --- */

document.addEventListener("DOMContentLoaded", () => {
  // カードクリックを横取りしてモーダルで開く
  const listHost = document.querySelector("[data-garden-list]");
  if (listHost) {
    listHost.addEventListener("click", (e) => {
      const card = e.target.closest(".garden-card");
      if (!card) return;
      e.preventDefault();
      openModal(card.dataset.slug);
    });
  }

  // 直接 ?slug=xxx でアクセスされた場合
  const slug = new URLSearchParams(location.search).get("slug");
  if (slug) openModal(slug);
});
