/* =============================================================
   modal.js — 断片収集モーダル（`run fragments`）
   羊皮紙テイスト。収集済み=セピア/淡インクのserif、未収集=ノイズ「????」。
   ============================================================= */

import { FRAGMENTS, TOTAL } from "./data.js";
import { getState, subscribe } from "./state.js";

const ROTATIONS = [-1, 0.6, -0.4, 1, -0.8, 0.3, -1]; // 固定パターン（カード毎の微小回転）

let root = null;
let unsub = null;
let lastCollectedCount = 0;

function build() {
  const el = document.createElement("div");
  el.className = "frag-modal";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "fragments");
  el.innerHTML = `
    <div class="frag-modal__sheet">
      <div class="frag-modal__head">
        <h2 class="frag-modal__title">F R A G M E N T S</h2>
        <p class="frag-modal__subtitle">the wanderer's record</p>
        <button class="frag-modal__close" type="button" aria-label="閉じる">[x]</button>
      </div>
      <div class="frag-modal__progress">
        <div class="frag-modal__bar"><div class="frag-modal__bar-fill"></div></div>
        <span class="frag-modal__count"></span>
      </div>
      <div class="frag-modal__grid"></div>
    </div>`;
  document.body.appendChild(el);

  el.addEventListener("pointerdown", (e) => {
    if (e.target === el) close();
  });
  el.querySelector(".frag-modal__close").addEventListener("click", close);

  root = el;
  return el;
}

function cardHTML(fragment, index, collected, isNew) {
  const got = collected.includes(fragment.id);
  const rotation = ROTATIONS[index % ROTATIONS.length];
  const cls = ["frag-card", got ? "is-collected" : "is-locked", isNew ? "is-new" : ""].join(" ").trim();
  return `
    <div class="${cls}" style="--rot:${rotation}deg">
      <span class="frag-card__num">#${fragment.id}</span>
      <span class="frag-card__body">${got ? fragment.name : "????"}</span>
      ${got ? `<span class="frag-card__condition">${fragment.condition}</span>` : ""}
    </div>`;
}

function render() {
  if (!root) return;
  const state = getState();
  const grid = root.querySelector(".frag-modal__grid");
  const isNew = state.collected.length > lastCollectedCount;
  grid.innerHTML = FRAGMENTS.map((f, i) => cardHTML(f, i, state.collected, isNew && state.collected.includes(f.id))).join("");
  lastCollectedCount = state.collected.length;

  root.querySelector(".frag-modal__count").textContent = `${state.collected.length}/${TOTAL}`;
  root.querySelector(".frag-modal__bar-fill").style.width = `${(state.collected.length / TOTAL) * 100}%`;
  root.dataset.stage = String(state.stage);
}

function onKey(e) {
  if (e.key === "Escape") {
    e.stopImmediatePropagation();
    e.preventDefault();
    close();
  }
}

export function open() {
  if (!root) build();
  render();
  root.classList.add("is-open");
  if (!unsub) unsub = subscribe(render);
  window.addEventListener("keydown", onKey, true);
}

export function close() {
  if (!root) return;
  root.classList.remove("is-open");
  window.removeEventListener("keydown", onKey, true);
}

export function isOpen() {
  return !!root && root.classList.contains("is-open");
}
