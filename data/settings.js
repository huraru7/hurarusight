/* =============================================================
   settings.js — サイトの「設定」をまとめる場所
   ★ 見た目・動きの調整はこのファイルの数値を変えるだけでOK。
     （文章・リンクなどの「中身」は data/content.js の方です）
   ============================================================= */

export const settings = {
	/* 粒子アニメ（ファーストビュー背景） */
	particles: {
		count: 3000, // 粒の数（多いほど密。重い時は減らす）
		size: 30, // 粒の大きさ

		colorEdge: "#2456c8", // 粒のふちの色（背景の空と差をつける濃い青）
		colorCore: "#5b9bf0", // 粒の芯（中心）の色

		/* モーフ（形の巡回） */
		hold: 5, // 1つの形を保つ秒数
		morph: 2.6, // 次の形へ移るのにかける秒数
		randomOrder: true, // true: ランダムな順番で巡回（同じ形が連続しない）/ false: shapes配列の順番どおりに巡回
		// 使える形: sphere / wave / spiral / helix /
		//           lorenz / kleinBottle / torus / supernovaShell / quantumFoam / blackHole
		shapes: ["lorenz", "kleinBottle", "sphere", "torus", "supernovaShell", "quantumFoam", "blackHole"], // 巡回する形と順番（randomOrder: false の時に使う順）
		shapeScale: 2.6, // 形のおおよその大きさ

		/* 動き */
		rotateSpeed: 0.06, // 全体がゆっくり回る速さ
		breatheAmp: 0.15, // 上下にふわっと呼吸する幅
		breatheSpeed: 0.25, // 呼吸の速さ
		twinkleSpeed: 1.6, // 粒が瞬く速さ
		parallax: 0.4, // マウスで視点が寄る強さ（0で無効）

		/* 処理 */
		maxPixelRatio: 2, // 描画の細かさ上限（高いと綺麗だが重い）
	},

	/* 今後ここに background や hero などの設定も足していけます */
};
