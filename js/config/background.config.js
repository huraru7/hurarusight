/* =============================================================
   background.config.js — 背景パーティクル(js/background.js)の設定値
   ここの数値を変えるだけで見た目を調整できる。
   ============================================================= */

export const backgroundConfig = {
  // 粒子数(画面幅640px未満はmobileを使用)
  particleCount: {
    desktop: 140,
    mobile: 60,
  },

  // 粒子カラー(0〜1のRGB)。secondaryRatioの割合でsecondaryを使う
  colors: {
    primary: [0.35, 0.55, 1.0],   // 青
    secondary: [0.55, 0.75, 1.0], // 明るい青(アクセント)
    secondaryRatio: 0.25,
  },

  // 粒子サイズ・速度・不透明度の範囲
  size: { min: 0.8, max: 3.3 },
  speed: { min: 0.08, max: 0.48 },
  opacity: { min: 0.12, max: 0.47 },

  // グロー(光の強調)が付く粒子の割合
  glowChance: 0.15,

  // マウスに反応する半径(px)
  mouseInteractionRadius: 180,
};
