/* =============================================================
   links.js — Links セクションの項目定義（唯一の編集場所）
   ★ リンク先・表示文言を変えたい時はここだけ直せばOKです。
     type: "gate"（外部リンクへ遷移）/ "stone"（クリックで情報表示→コピー）
   ============================================================= */

export const links = [
	{ type: "gate", icon: "x", label: "X / Twitter", subLabel: "声の届く広場", url: "https://x.com/hurarunium" },
	{ type: "gate", icon: "github", label: "GitHub", subLabel: "コードの墓標", url: "https://github.com/huraru7" },
	{ type: "gate", icon: "portfolio", label: "Portfolio", subLabel: "作品の眠る場所", url: "https://portfolio.huraru.com" },
	{ type: "stone", icon: "mail", label: "Mail", subLabel: "刻まれた言葉", value: "hurarunium@gmail.com" },
];
