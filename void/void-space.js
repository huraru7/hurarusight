/* =============================================================
   void-space.js — 神威空間（Origin Library）本体（裏側 / void/index.html）の挙動
   完全に独立したページとして動く。data/hidden/void.js のコンテンツを読み込み、
   読み込み演出→コンテンツ表示→本モーダル→「return to surface」での表側への遷移を担当する。
   ============================================================= */

import { voidContent } from "../data/hidden/void.js";

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let tsTimer = null;

/* ---------- 星 ---------- */
function starsHTML() {
  let html = "";
  const count = 100;
  for (let i = 0; i < count; i++) {
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = (1 + Math.random() * 2).toFixed(1);
    const duration = (2 + Math.random() * 4).toFixed(1);
    const delay = (Math.random() * 4).toFixed(1);
    const peak = (0.05 + Math.random() * 0.35).toFixed(2);
    html += `<span class="void-star" style="top:${top}%;left:${left}%;width:${size}px;height:${size}px;animation-duration:${duration}s;animation-delay:${delay}s;--peak:${peak};"></span>`;
  }
  return html;
}

/* ---------- 本・断章 ---------- */

// 固定パターンのジグザグ配置（縦一列にならないよう、本ごとに位置・傾きを変える）
const BOOK_LAYOUT = [
  { top: "0vh", left: "46%", rot: -1.6 },
  { top: "24vh", left: "64%", rot: 1.3 },
  { top: "48vh", left: "32%", rot: -1.1 },
  { top: "73vh", left: "58%", rot: 1.7 },
  { top: "97vh", left: "40%", rot: -0.9 },
];
function bookHTML(doc, index) {
  const layout = BOOK_LAYOUT[index % BOOK_LAYOUT.length];
  return `
    <div class="void-book" data-doc-id="${doc.id}" style="top:${layout.top};left:${layout.left};--rot:${layout.rot}deg" tabindex="0" role="button">
      <p class="void-book__id">${doc.id}</p>
      <p class="void-book__title">${doc.title}</p>
      <p class="void-book__preview">${doc.preview}</p>
      <p class="void-book__hint">[ 開く → ]</p>
    </div>`;
}

// 断章は本の並びと重ならない左右の余白帯に配置し、それぞれ違う経路・周期でゆっくり巡回させる
const FRAGMENT_POS = [
  { top: "6%", left: "5%" },
  { top: "22%", left: "90%" },
  { top: "40%", left: "4%" },
  { top: "58%", left: "91%" },
  { top: "78%", left: "6%" },
];
function fragmentsHTML() {
  return voidContent.fragments
    .map((text, i) => {
      const pos = FRAGMENT_POS[i % FRAGMENT_POS.length];
      const rot = (i % 2 === 0 ? 1 : -1) * (1 + (i % 3));
      const dx1 = (i % 2 === 0 ? 1 : -1) * (20 + ((i * 7) % 30));
      const dy1 = ((i * 5) % 30) - 10;
      const dx2 = (i % 2 === 0 ? -1 : 1) * (15 + ((i * 11) % 25));
      const dy2 = ((i * 9) % 30) - 15;
      const dx3 = (i % 2 === 0 ? 1 : -1) * (10 + ((i * 13) % 20));
      const dy3 = ((i * 3) % 24) - 8;
      const duration = 18 + ((i * 4) % 13); // 18〜30秒程度、要素ごとに違う固定周期
      const delay = -(i * 2.4); // 開始タイミングをずらして同期しないようにする
      const style = [
        `top:${pos.top}`,
        `left:${pos.left}`,
        `--rot:${rot}deg`,
        `--dx1:${dx1}px`,
        `--dy1:${dy1}px`,
        `--dx2:${dx2}px`,
        `--dy2:${dy2}px`,
        `--dx3:${dx3}px`,
        `--dy3:${dy3}px`,
        `--roam-duration:${duration}s`,
        `animation-delay:${delay}s`,
      ].join(";");
      return `<p class="void-fragment" style="${style}">${text}</p>`;
    })
    .join("");
}

function renderBoardContent() {
  document.querySelector("[data-void-stars]").innerHTML = starsHTML();

  const host = document.querySelector("[data-void-books]");
  host.innerHTML = voidContent.docs.map(bookHTML).join("") + fragmentsHTML();

  host.querySelectorAll(".void-book").forEach((el) => {
    el.addEventListener("click", () => openBook(el.dataset.docId));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openBook(el.dataset.docId);
    });
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target); // 表示済みは監視をやめて軽量化
        }
      }
    },
    { threshold: 0.2 }
  );
  host.querySelectorAll(".void-book, .void-fragment").forEach((el) => io.observe(el));
}

/* ---------- 本モーダル ---------- */
function coordinatesText() {
  const c = voidContent.coordinates;
  const ts = new Date().toLocaleString("ja-JP", { hour12: false });
  return [
    `AXIS-X    ${c.x}`,
    `AXIS-Y    ${c.y}`,
    `AXIS-Z    ${c.z}`,
    `DEPTH     ${c.depth}`,
    `TIMESTAMP ${ts}`,
    `OBSERVER  ${c.observer}`,
  ].join("\n");
}

function renderConnectionDiagram(host, nodes) {
  const cx = 150;
  const cy = 30;
  const r = 85;
  const lines = nodes
    .map((name, i) => {
      const angle = (-90 + (i - (nodes.length - 1) / 2) * 26) * (Math.PI / 180);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r + 70;
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#3a4a6a" stroke-width="1" stroke-dasharray="3,3" />
              <text x="${x.toFixed(1)}" y="${(y + 14).toFixed(1)}" text-anchor="middle" fill="#7a8aaa" font-size="11" font-family="JetBrains Mono, monospace">${name}</text>`;
    })
    .join("");
  host.innerHTML = `
    <svg viewBox="0 0 300 150" width="100%" height="150" role="img" aria-label="接続図">
      ${lines}
      <circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#1a2040" stroke-width="1.5" />
      <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#6a7aaa" font-size="12" font-family="Cinzel, serif">0</text>
    </svg>`;
  host.classList.add("is-visible");
}

function openBook(id) {
  const doc = voidContent.docs.find((d) => d.id === id);
  if (!doc) return;

  const modal = document.querySelector("[data-void-modal]");
  const diagramHost = modal.querySelector("[data-void-modal-diagram]");
  diagramHost.innerHTML = "";
  diagramHost.classList.remove("is-visible");
  stopTimestampTicker();

  modal.querySelector("[data-void-modal-id]").textContent = doc.id;
  modal.querySelector("[data-void-modal-title]").textContent = doc.title;

  if (doc.id === "DOC-003") renderConnectionDiagram(diagramHost, doc.nodes);

  const bodyEl = modal.querySelector("[data-void-modal-body]");
  if (doc.isCoordinates) {
    bodyEl.textContent = coordinatesText();
    tsTimer = setInterval(() => {
      bodyEl.textContent = coordinatesText();
    }, 1000);
  } else {
    bodyEl.textContent = doc.body;
  }

  modal.classList.add("is-open");
}

function stopTimestampTicker() {
  if (tsTimer) clearInterval(tsTimer);
  tsTimer = null;
}

function closeBook() {
  document.querySelector("[data-void-modal]")?.classList.remove("is-open");
  stopTimestampTicker();
}

function bindDrag(sheet, handle) {
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const onMove = (e) => {
    if (!dragging) return;
    const maxLeft = window.innerWidth - sheet.offsetWidth;
    const maxTop = window.innerHeight - sheet.offsetHeight;
    const left = Math.min(Math.max(0, startLeft + (e.clientX - startX)), Math.max(0, maxLeft));
    const top = Math.min(Math.max(0, startTop + (e.clientY - startY)), Math.max(0, maxTop));
    sheet.style.left = `${left}px`;
    sheet.style.top = `${top}px`;
  };
  const onUp = () => {
    dragging = false;
    sheet.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  };

  handle.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".void-modal__close")) return;
    const rect = sheet.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    sheet.style.position = "fixed";
    sheet.style.left = `${rect.left}px`;
    sheet.style.top = `${rect.top}px`;
    sheet.style.margin = "0";
    dragging = true;
    sheet.classList.add("is-dragging");
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    e.preventDefault();
  });
}

function bindModal() {
  const modal = document.querySelector("[data-void-modal]");
  const sheet = modal.querySelector(".void-modal__sheet");
  const head = modal.querySelector(".void-modal__head");

  modal.querySelector(".void-modal__close").addEventListener("click", closeBook);
  modal.addEventListener("pointerdown", (e) => {
    if (e.target === modal) closeBook();
  });
  bindDrag(sheet, head);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      e.stopImmediatePropagation();
      closeBook();
    }
  });
}

/* ---------- 退場（表側へページ遷移） ---------- */
function bindExit() {
  document.querySelector("[data-void-exit]").addEventListener("click", () => {
    closeBook();
    window.location.href = "../index.html";
  });
}

/* ---------- 読み込み→コンテンツ表示 ---------- */
async function reveal() {
  const loading = document.querySelector("[data-void-loading]");
  if (REDUCED) {
    loading.remove();
    document.body.classList.remove("is-content-hidden");
    return;
  }
  await wait(2400); // 何かが読み込まれているような気配（.void-loadingはHTMLに最初から存在する）
  loading.remove();
  document.body.classList.remove("is-content-hidden"); // ここでコンテンツがズーム＋フェードインする
}

document.addEventListener("DOMContentLoaded", () => {
  renderBoardContent();
  bindModal();
  bindExit();

  const coordEl = document.querySelector("[data-void-coord]");
  const c = voidContent.coordinates;
  if (coordEl) coordEl.textContent = `${c.x} / ${c.y} / ${c.z}`;

  reveal();
});
