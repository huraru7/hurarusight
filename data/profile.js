/* =============================================================
   profile.js — About セクション（コルクボード）の項目定義（唯一の編集場所）
   ★ 名前・情報カード・メモ・画像を変えたい時はここだけ直せばOKです。
   ============================================================= */

export const profile = {
	name: "ふらる",
	alias: "hurarunium",
	title: "Creator",
	description: "とにかくやる。", // メモカードの一言

	// 情報カード（1件 = 1枚）。icon は js/about.js の ICONS のキーに対応
	info: [
		{ icon: "birthday", label: "Birthday", value: "05月28日" }, // ★ 要差し替え
		{ icon: "game", label: "Games", value: "パズル・放置系" }, // ★ 要差し替え
	],

	// 画像カード。空配列なら表示しない
	images: [
		// { src: "images/about/xxx.jpg", alt: "説明文" },
	],
};
