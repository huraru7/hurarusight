/* =============================================================
   garden-index.js — 庭（Garden）の記事メタ情報
   新しい手入れをする時は:
     1. data/garden/<slug>/ に新しい日付の .md ファイルを追加（本文を書く）
     2. 下の history 配列の末尾に { date, file } を追記
     過去のファイル・エントリは編集しない（積み重ねていく）。
   slug は garden/article.html?slug=xxx の URL に使われます。
   genre は "近況" / "エッセイ" / "メモ" / "かけら" のいずれか。
   preview はカード一覧に表示する一文。省略すると本文から自動生成される。
   ============================================================= */

export const garden = [
	{
		slug: "kinkyo-2026-haru",
		title: "最近のこと",
		genre: "update",
		preview: "",
		thumbnail: "",
		thumbnailRatio: null,
		topics: [],
		history: [
			{ date: "2026-01-10", file: "kinkyo-2026-haru/2026-01-10.md" },
			{ date: "2026-02-14", file: "kinkyo-2026-haru/2026-02-14.md" },
			{ date: "2026-04-02", file: "kinkyo-2026-haru/2026-04-02.md" },
			{ date: "2026-06-30", file: "kinkyo-2026-haru/2026-06-30.md" },
		],
	},
	{
		slug: "naze-tsukuru-no-ka",
		title: "なぜ作るのか、もう少し",
		genre: "essay",
		preview: "",
		thumbnail: "",
		thumbnailRatio: null,
		topics: ["creative", "gamedev"],
		history: [
			{ date: "2026-03-12", file: "naze-tsukuru-no-ka/2026-03-12.md" },
			{ date: "2026-05-20", file: "naze-tsukuru-no-ka/2026-05-20.md" },
		],
	},
	{
		slug: "memo-camera",
		title: "カメラワークのメモ",
		genre: "note",
		preview: "",
		thumbnail: "",
		thumbnailRatio: null,
		topics: ["gamedev"],
		history: [{ date: "2026-05-01", file: "memo-camera/2026-05-01.md" }],
	},
];
