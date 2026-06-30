# huraru-portfolio

ハンドルネーム「ふらる（hurarunium）」の自己紹介サイト。ビルドステップなしの素の
HTML / CSS / JavaScript（ESモジュール）で作られています。Node.js も npm も不要です。

## 起動方法

ESモジュール（`import`/`export`）とCDNライブラリの読み込み（importmap）はブラウザの
セキュリティ制約上 `file://` では動かないため、ローカルサーバー経由で開いてください。

- VSCodeの **Live Server** 拡張機能でこのフォルダを開く、または
- ターミナルでこのフォルダに移動し `python -m http.server` を実行して
  `http://localhost:8000` を開く

## ディレクトリ構成

```
index.html              トップページ（①〜⑤の各セクション）
garden/                  庭（深掘りコンテンツ）のページ
  index.html             庭の一覧（ジャンルフィルター付き）
  article.html           庭の記事個別ページ（?slug=xxx で記事を指定）
css/                     セクションごとのスタイル（tokens.css にデザイントークン）
js/                      セクションごとの描画スクリプト
data/
  content.js             プロフィール・About・Why・今手を出していること・リンクのテキスト
  garden-index.js        庭の記事メタ情報（タイトル・ジャンル・各.mdファイルのパス）
  garden/<slug>/*.md      庭の記事本文（1ファイル＝1回の「手入れ」）
```

## コンテンツの編集

- **プロフィール・About・Why・今手を出していること・リンク**: `data/content.js` を編集
- **庭の記事**: `data/garden-index.js`（メタ情報）と `data/garden/<slug>/*.md`（本文）を編集

## 庭の「手入れ」のやり方

庭の記事は、過去の記述を編集せず、新しい記述を積み重ねていく運用です。

1. 対象記事のフォルダ（`data/garden/<slug>/`）に、新しい日付のファイル名で
   `.md` ファイルを追加し、本文を書く（例: `data/garden/kinkyo-2026-haru/2026-08-01.md`）
2. `data/garden-index.js` の対象記事の `history` 配列の末尾に
   `{ date: "2026-08-01", file: "kinkyo-2026-haru/2026-08-01.md" }` を追記する

過去のファイル・エントリは編集・削除しません。これにより「手入れ回数」が積み重なって
いきます。新しい記事を追加したい場合は、`garden-index.js` に新しいオブジェクトを1つ
追加し、対応するフォルダに最初の `.md` ファイルを置いてください。

## 使用しているCDNライブラリ

- [marked](https://github.com/markedjs/marked)（esm.sh経由） — 庭の記事本文のMarkdown
  描画にのみ使用。トップページでは読み込まれません。
