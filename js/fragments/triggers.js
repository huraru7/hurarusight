/* =============================================================
   triggers.js — サイト全体の行動トリガー（#01,#02,#03,#05,#07）+ #06連携
   index.html から読み込むだけで全トリガーが有効になる。
   ============================================================= */

import { unlockFragment } from "./state.js";

/* ---------- #01: DevTools open（幅の差分でベストエフォート検知） ---------- */
(function watchDevtools() {
  const THRESHOLD = 160;
  setInterval(() => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > THRESHOLD || heightDiff > THRESHOLD) {
      unlockFragment("01");
    }
  }, 1000);
})();

/* ---------- #02: HTML コメントが誘導する console 関数 ---------- */
window.hurarunium = window.hurarunium || {};
window.hurarunium.echo = (word) => {
  if (word === "threshold") unlockFragment("02");
};

/* ---------- #03: ほぼ透明な要素のクリック ---------- */
document.addEventListener("click", (e) => {
  if (e.target.closest?.(".frag-trigger-03")) unlockFragment("03");
});

/* ---------- #05: 深夜0-4時のアクセス ---------- */
(function watchNightHours() {
  const h = new Date().getHours();
  if (h >= 0 && h < 4) unlockFragment("05");
})();

/* ---------- #06: ターミナルでの定型コマンド列（console.js から呼ばれる） ---------- */
const SEQUENCE_06 = ["scan status", "read manifest", "scan status"];
let progress06 = 0;

export function onTerminalCommand(verb, target) {
  const cmd = `${verb} ${target ?? ""}`.trim();
  if (cmd === SEQUENCE_06[progress06]) {
    progress06++;
    if (progress06 >= SEQUENCE_06.length) {
      unlockFragment("06");
      progress06 = 0;
    }
  } else {
    progress06 = cmd === SEQUENCE_06[0] ? 1 : 0;
  }
}

/* ---------- #07: コナミ風キー列 ---------- */
const SEQUENCE_07 = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];
let progress07 = 0;

window.addEventListener("keydown", (e) => {
  if (e.key === SEQUENCE_07[progress07]) {
    progress07++;
    if (progress07 >= SEQUENCE_07.length) {
      unlockFragment("07");
      progress07 = 0;
    }
  } else {
    progress07 = e.key === SEQUENCE_07[0] ? 1 : 0;
  }
});
