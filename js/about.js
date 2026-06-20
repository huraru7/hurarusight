/* =============================================================
   about.js — About セクション（コルクボード）の DOM 生成
   data/content.js（profile）を読み込み、name/info/memo/image の4種カードを
   コルクボードに不規則チルトで配置する。
   ============================================================= */

import { content } from "../data/content.js";

const { profile } = content;

// 固定パターン（カードごとの微小回転・位置オフセット。完全ランダムにしない）
const ROTATIONS = [-3, 2, -1.5, 3.5, -2.5, 1, -4, 2.5];
const OFFSETS = [
  { top: "2%", left: "38%" },
  { top: "8%", left: "8%" },
  { top: "30%", left: "62%" },
  { top: "42%", left: "20%" },
  { top: "55%", left: "48%" },
  { top: "12%", left: "78%" },
  { top: "60%", left: "75%" },
  { top: "38%", left: "4%" },
];

const ICONS = {
  birthday: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a1 1 0 0 1 1 1v1.2c.7.3 1.2 1 1.2 1.8 0 1.1-.9 2-2 2s-2-.9-2-2c0-.8.5-1.5 1.2-1.8V3a1 1 0 0 1 .6-1zM6 9h12a2 2 0 0 1 2 2v2c-1 0-1.5.6-2 1.2-.5.6-1 1.2-2 1.2s-1.5-.6-2-1.2c-.5-.6-1-1.2-2-1.2s-1.5.6-2 1.2c-.5.6-1 1.2-2 1.2s-1.5-.6-2-1.2c-.5-.6-1-1.2-2-1.2v-2a2 2 0 0 1 2-2zm-2 7c1 0 1.5-.6 2-1.2.5-.6 1-1.2 2-1.2s1.5.6 2 1.2c.5.6 1 1.2 2 1.2s1.5-.6 2-1.2c.5-.6 1-1.2 2-1.2s1.5.6 2 1.2c.5.6 1 1.2 2 1.2v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z"/></svg>`,
  game: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 7h10a5 5 0 0 1 5 5v3a3 3 0 0 1-3 3 3 3 0 0 1-2.4-1.2L15 15H9l-1.6 1.8A3 3 0 0 1 5 18a3 3 0 0 1-3-3v-3a5 5 0 0 1 5-5zm1 3v2H6v2h2v2h2v-2h2v-2H10v-2H8zm8.5 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2.5 2.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/></svg>`,
};

function pick(arr, i) {
  return arr[i % arr.length];
}

function cardStyle(index) {
  const rot = pick(ROTATIONS, index);
  const offset = pick(OFFSETS, index);
  return `--rot:${rot}deg; top:${offset.top}; left:${offset.left};`;
}

function nameCardHTML(index) {
  return `
    <div class="about-card" data-type="name" style="${cardStyle(index)}">
      <p class="about-card__name">${profile.name}</p>
      <p class="about-card__alias">@${profile.alias}</p>
      <p class="about-card__title">${profile.title}</p>
    </div>`;
}

function infoCardHTML(item, index) {
  return `
    <div class="about-card" data-type="info" style="${cardStyle(index)}">
      <span class="about-card__icon">${ICONS[item.icon] ?? ""}</span>
      <span class="about-card__label">${item.label}</span>
      <span class="about-card__value">${item.value}</span>
    </div>`;
}

function memoCardHTML(index) {
  return `
    <div class="about-card" data-type="memo" style="${cardStyle(index)}">
      <span class="about-card__tape" aria-hidden="true"></span>
      <p class="about-card__memo">${profile.description}</p>
    </div>`;
}

function imageCardHTML(image, index) {
  return `
    <div class="about-card" data-type="image" style="${cardStyle(index)}">
      <img class="about-card__img" src="${image.src}" alt="${image.alt ?? ""}" loading="lazy" />
    </div>`;
}

export function renderAbout() {
  const board = document.querySelector("[data-board]");
  if (!board) return;

  let index = 0;
  const cards = [nameCardHTML(index++)];
  for (const item of profile.info) cards.push(infoCardHTML(item, index++));
  cards.push(memoCardHTML(index++));
  for (const image of profile.images) cards.push(imageCardHTML(image, index++));

  board.innerHTML = cards.join("");
}

document.addEventListener("DOMContentLoaded", renderAbout);
