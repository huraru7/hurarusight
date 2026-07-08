/* =============================================================
   world/memory.js — 庭の記憶
   ① 既読記事の追跡(localStorage)
   ② 庭一覧の最終スクロール位置復元
   ============================================================= */

const READ_KEY   = "garden-read";
const SCROLL_KEY = "garden-scroll";

/* --- 既読追跡 --- */

function getRead() {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

export function markAsRead(slug) {
  const read = getRead();
  read.add(slug);
  localStorage.setItem(READ_KEY, JSON.stringify([...read]));
}

export function applyReadStyles() {
  const read = getRead();
  document.querySelectorAll(".garden-card[data-slug]").forEach((card) => {
    if (read.has(card.dataset.slug)) {
      card.classList.add("is-read");
    }
  });
}

/* --- 庭一覧のスクロール位置復元 --- */

export function saveGardenScroll() {
  localStorage.setItem(SCROLL_KEY, String(window.scrollY));
}

export function restoreGardenScroll() {
  const saved = parseInt(localStorage.getItem(SCROLL_KEY) || "0", 10);
  if (saved > 0) {
    // レンダリング完了後にスクロール(rAFで1フレーム後)
    requestAnimationFrame(() => window.scrollTo(0, saved));
  }
}
