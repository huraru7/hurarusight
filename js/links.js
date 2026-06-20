/* =============================================================
   links.js — Links セクションの DOM 生成・挙動
   data/content.js（links）を読み込み、扉（gate）/ 石版（stone）の要素を生成する。
   ・扉   : クリックで新しいタブへ遷移
   ・石版 : 1回目クリックで情報をポップアップ表示、2回目でクリップボードへコピー
   ============================================================= */

import { content } from "../data/content.js";

const { links } = content;

const ICONS = {
  x: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.6l-5.2-6.8L5.2 22H2l8.1-9.3L1.5 2H8.3l4.7 6.2L18.9 2zm-2.3 18h1.8L7.5 4H5.6l11 16z"/></svg>`,
  github: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.5c.5.1.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.7-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.3 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.71 1.03 1.6 1.03 2.7 0 3.85-2.35 4.7-4.58 4.94.36.31.68.92.68 1.85v2.75c0 .26.16.58.67.48A10 10 0 0 0 12 2z"/></svg>`,
  portfolio: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v3h20V8a2 2 0 0 0-2-2h-3V5a2 2 0 0 0-2-2H9zm0 2h6v1H9V5zM2 12v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-7H2z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1.4 2L12 12.5 19.6 7H4.4zM4 9.2V17h16V9.2l-7.4 5.4a1 1 0 0 1-1.2 0L4 9.2z"/></svg>`,
};

function gateHTML(item) {
  return `
    <div class="link-item" data-type="gate" tabindex="0" role="link" aria-label="${item.label}">
      <span class="link-item__arch" aria-hidden="true"></span>
      <span class="link-item__icon">${ICONS[item.icon] ?? ""}</span>
      <span class="link-item__knobs" aria-hidden="true"></span>
      <span class="link-item__label">${item.label}</span>
      ${item.subLabel ? `<span class="link-item__sublabel">${item.subLabel}</span>` : ""}
    </div>`;
}

function stoneHTML(item) {
  return `
    <div class="link-item" data-type="stone" tabindex="0" role="button" aria-label="${item.label}">
      <span class="link-item__icon">${ICONS[item.icon] ?? ""}</span>
      <span class="link-item__lines" aria-hidden="true"></span>
      <span class="link-item__label">${item.label}</span>
      ${item.subLabel ? `<span class="link-item__sublabel">${item.subLabel}</span>` : ""}
      <div class="link-item__popup">
        <span class="link-item__popup-text">${item.value}</span>
        <span class="link-item__popup-sub">click to copy</span>
      </div>
    </div>`;
}

function bindGate(el, item) {
  el.addEventListener("click", () => {
    el.classList.add("is-pressed");
    setTimeout(() => el.classList.remove("is-pressed"), 150);
    window.open(item.url, "_blank", "noopener,noreferrer");
  });
}

function bindStone(el, item) {
  const popup = el.querySelector(".link-item__popup");
  const text = el.querySelector(".link-item__popup-text");
  const sub = el.querySelector(".link-item__popup-sub");
  let revertTimer = 0;

  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!el.classList.contains("is-open")) {
      closeAllStones();
      el.classList.add("is-open");
      return;
    }
    if (el.classList.contains("is-copied")) return;

    navigator.clipboard?.writeText(item.value).then(
      () => {
        el.classList.add("is-copied");
        text.textContent = "copied!";
        sub.textContent = "";
        clearTimeout(revertTimer);
        revertTimer = setTimeout(() => {
          el.classList.remove("is-copied");
          text.textContent = item.value;
          sub.textContent = "click to copy";
        }, 1500);
      },
      () => {} // 非対応ブラウザ等は静かに諦める
    );
  });
}

function closeAllStones() {
  document.querySelectorAll('.link-item[data-type="stone"].is-open').forEach((el) => {
    el.classList.remove("is-open");
  });
}

export function renderLinks() {
  const host = document.querySelector("[data-links-grid]");
  if (!host) return;

  host.innerHTML = links.map((item) => (item.type === "stone" ? stoneHTML(item) : gateHTML(item))).join("");

  host.querySelectorAll(".link-item").forEach((el, i) => {
    const item = links[i];
    if (item.type === "stone") bindStone(el, item);
    else bindGate(el, item);
  });

  document.addEventListener("click", closeAllStones);
}

document.addEventListener("DOMContentLoaded", renderLinks);
