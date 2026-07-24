/* =============================================================
   content.js — サイトの内容をまとめる「唯一の編集場所」
   ★ 文章・リンクなどはこのファイルだけ直せばOKです。
     （コメント可・末尾カンマOK。JSON より手で書きやすい形式です）
   ============================================================= */

export const content = {
  /* サイト全体の情報 */
  site: {
    title: "ふらる | hurarunium",
  },

  /* プロフィール（ファーストビューのひとこと） */
  profile: {
    tagline: "Wanderer of Worlds",
    name: "ふらる",
    alias: "hurarunium",
    title: "Creator",
  },

  /* ② 人柄紹介セクション。★ 仮文章。あとで自由に書き換えてください */
  about: {
    paragraphs: [
      "ゲームを作ったり、文章を書いたり、思いついたものを形にするのが好きです。",
      "完成させることよりも、作っている時間そのものを楽しんでいます。",
    ],
  },

  /* ③ なぜ色々作るのか セクション。★ 仮文章。あとで自由に書き換えてください */
  why: {
    paragraphs: [
      "新しいものを作る理由を聞かれると、いつもうまく答えられません。",
      "ただ、何かを思いついた瞬間のワクワクが好きで、気づくと手を動かしています。",
      "完成しないものも多いけれど、それでいいと思っています。",
    ],
    // 最後の段落の続きとして表示される、庭への控えめなリンク
    linkText: "もう少し、考えていることを書いています →",
    linkHref: "garden/index.html",
  },

  /* ④ 今、手を出していること セクション。★ 仮内容。あとで自由に書き換えてください */
  currentWork: [
    { genre: "ゲーム制作", teaser: "小さなパズルゲームを作っています。", url: "https://x.com/hurarunium" },
    { genre: "執筆", teaser: "noteで思いついたことを書いています。", url: "https://note.com/huraru" },
  ],

  /* ⑤ 連絡先セクションの一言 */
  contactNote: "ここまで読んでくれて、ありがとうございます。",

  /* リンクボタン（①ファーストビュー・⑤連絡先で共用） */
  links: [
    { icon: "x", label: "X / Twitter", url: "https://x.com/hurarunium" },
    { icon: "github", label: "GitHub", url: "https://github.com/huraru7" },
    { icon: "portfolio", label: "Portfolio", url: "https://portfolio.huraru.com" },
    { icon: "note", label: "note", url: "https://note.com/huraru" },
    { icon: "mail", label: "Mail", url: "mailto:hurarunium@gmail.com" },
  ],
};
