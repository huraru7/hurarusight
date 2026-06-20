/* =============================================================
   content.js — サイトの内容をまとめる「唯一の編集場所」
   ★ 文章・リンクなどはこのファイルだけ直せばOKです。
     （コメント可・末尾カンマOK。JSON より手で書きやすい形式です）
   ============================================================= */

export const content = {
  /* サイト全体の情報 */
  site: {
    title: "huraru",
  },

  /* プロフィール（ファーストビューのひとこと＋Aboutセクションのコルクボード） */
  profile: {
    tagline: "Wanderer of Worlds",

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
  },

  /* リンク（Links セクション）。type: "gate"（外部リンクへ遷移）/ "stone"（クリックで情報表示→コピー） */
  links: [
    { type: "gate", icon: "x", label: "X / Twitter", subLabel: "声の届く広場", url: "https://x.com/hurarunium" },
    { type: "gate", icon: "github", label: "GitHub", subLabel: "コードの墓標", url: "https://github.com/huraru7" },
    { type: "gate", icon: "portfolio", label: "Portfolio", subLabel: "作品の眠る場所", url: "https://portfolio.huraru.com" },
    { type: "gate", icon: "note", label: "note", subLabel: "言葉の墓標", url: "https://note.com/huraru" },
    { type: "stone", icon: "mail", label: "Mail", subLabel: "刻まれた言葉", value: "hurarunium@gmail.com" },
  ],

  /* 作品など、今後増やす項目もここに足していけます
  works: [
    { title: "作品名", category: "Game", desc: "説明", url: "#" },
  ],
  */
};
