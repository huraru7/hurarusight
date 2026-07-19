/* =============================================================
   background.config.js — 背景パーティクル(js/background.js)の設定値
   ここの数値を変えるだけで見た目を調整できる。
   ============================================================= */

export const backgroundConfig = {
	// 粒子数(画面幅640px未満はmobileを使用)
	particleCount: {
		desktop: 90,
		mobile: 40,
	},

	// 粒子カラー(0〜1のRGB)。secondaryRatioの割合でsecondaryを使う
	colors: {
		primary: [0.28, 0.45, 0.8], // 落ち着いた青
		secondary: [0.42, 0.6, 0.92], // やや明るい青
		secondaryRatio: 0.2,
	},

	// 粒子サイズ・速度・不透明度の範囲
	size: { min: 1.9, max: 3.2 },
	speed: { min: 0.25, max: 0.5 },
	opacity: { min: 0.1, max: 0.32 },

	// グロー(光の強調)が付く粒子の割合
	glowChance: 0.8,

	// マウスに反応する半径(px)
	mouseInteractionRadius: 140,
};
