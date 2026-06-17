# huraru

ふらるの個人サイト。**シンプルな素の HTML / CSS / JS の土台**から、機能を少しずつ足していきます。

## フォルダ構成

```
huraru-portfolio/
├── index.html      入口。ブラウザが最初に開くページ
├── css/
│   ├── style.css     見た目（スタイル）
│   └── terminal.css  ターミナルの見た目（独立）
├── js/
│   ├── main.js       内容（data/content.js）を読み込んで HTML に流し込む
│   ├── particles.js  ファーストビュー背景の粒子アニメ（Three.js）
│   └── terminal/     ターミナルコンソール（裏の顔・コンソールからのみ参照）
└── data/
    ├── content.js    ★サイトの「中身」（自己紹介・リンク等）の編集場所
    └── settings.js   ★サイトの「設定」（見た目・動き）の編集場所
```

## 2つのデータファイルの使い分け

- **`data/content.js`** … 文章・リンクなどの **中身**（何を表示するか）
- **`data/settings.js`** … 色・動きなどの **設定**（どう見せるか）。今は粒子アニメの設定（`particles`）。
  数値を変えるだけで `js/` を触らず調整できます（今後 background や hero の設定もここに追加予定）。

## 内容の編集（`data/content.js` 一箇所だけ）

文章やリンクは **`data/content.js` を直すだけ**で反映されます。HTML 側は「ここに入れる」と
印を付けておくと、`js/main.js` が自動で流し込みます。

| HTML の印 | 入るもの | 例 |
|---|---|---|
| `data-bind="profile.tagline"` | その値（テキスト） | キャッチコピー |
| `data-intro` | `profile.intro` の各行を `<p>` 段落に | 自己紹介 |
| `data-links` | `links` を `<li><a>` 一覧に | SNS リンク |

例: 自己紹介を出したいセクションに `<div data-intro></div>` を置くだけ
（中身は `data/content.js` の `profile.intro`）。index.html にコメント例があります。

- 基本は素の HTML / CSS / JS です。
- 粒子アニメ用に **Three.js だけ CDN(esm.sh) から読み込む準備**を入れてあります（後述）。
- ⚠️ Three.js は ES モジュールで読み込むため、`index.html` を **file:// で直接開くと粒子部分は動きません**
  （モジュール＋CDN はブラウザの制約で HTTP 配信が必要）。**VSCode の Live Server 拡張で開いてください**。
  ※ Three.js を使わない素の部分（タイトル等）は直接開いても表示されます。

## ファーストビュー（玄関）

`index.html` の `.hero` が最初の画面です。中央に大きな「huraru」、その下にひとことキャッチ
（`Wanderer of Worlds`／**文言は編集可**）、下部にスクロールヒント。背景には粒子アニメが動きます。

- 文言を変える → `index.html` の `.hero__tagline`
- 見た目（大きさ・字間・色） → `css/style.css` の `.hero__*`
- 文字を読みやすくする白い光は `.hero::before`（粒子が濃く感じたら調整）

## 粒子アニメ（`js/particles.js` / Three.js）

ファーストビューの背景。水色に発光する粒が、**いくつかの形（球・波・らせん・環）に集まり、
数秒ごとに次の形へモーフして巡回**します。`#particle-canvas` は画面全面・背面。

**調整は `data/settings.js` の `particles` を編集するだけ**（`js/particles.js` は触らなくてOK）:

- 数 → `count` ／ 色 → `colorEdge`(ふち)・`colorCore`(芯) ／ 大きさ → `size`
- 形を保つ時間・モーフ時間 → `hold` / `morph`
- 巡回する形と順番 → `shapes`（例 `["sphere","ring"]` にすれば2形だけ）
- 動き → `rotateSpeed` / `breatheAmp` / `breatheSpeed` / `twinkleSpeed` / `parallax`
- 処理の重さ → `maxPixelRatio`

その他:
- `window.huraruParticles` で操作可能（`.stop()` / `.start()` / `.next()` で次の形へ）
- `prefers-reduced-motion`（視差を減らす設定）では巡回せず1形を静止表示
- 形の種類そのものを増やす場合は `js/particles.js` の `SHAPE_GENERATORS` に関数を足します

## Links セクション（扉/石版）

外部リンクを「扉」、メールアドレスなどコピー可能な情報を「石版」として表示するセクション。
クリックで扉は新しいタブへ遷移、石版は情報を浮かび上がらせてもう一度クリックでコピー。

- 掲載内容（ラベル・リンク先・メールアドレス等）の編集 → `data/links.js`
- 見た目・演出 → `css/links.css`
- 挙動（クリック処理など） → `js/links.js`

## ここから足していくときの目安

- 見た目を変える → `css/style.css`
- セクション（About / Works など）を増やす → `index.html` に `<section>` を追加し、`css/` で整える
- 動き（クリック・スクロール演出など）を付ける → `js/main.js`
- 画像を使う → `images/` フォルダを作ってそこに置く

> メモ: 以前は `src/` で細かくモジュール分割し、CDN からライブラリを読み込む構成でしたが、
> 個人サイトの出発点としては過剰だったため、分かりやすい classic 構成にリセットしました。

## ターミナルコンソール（vβ1.0 / サイトの「裏の顔」）

画面右下にポップアップする、ターミナル風のコンソール。コマンドでサイトの情報取得・操作ができる。

- **開く/閉じる:** `` ` ``（バッククォート）または `Cmd+K` / `Ctrl+K`。閉じるは `Esc` か `[x]`。
- **コマンド:** `help` で一覧。`<動詞> [対象] [--フラグ]` 形式（例 `search link` / `go top` /
  `run effect particles-next` / `scan status` / `clear`）。
- **補完（予測変換）:** 入力すると**説明付きの候補リスト**が出る。`↑↓` で選択、`Tab`/`→`/クリックで確定、
  `Enter` でコマンド実行。候補が無い時の `↑↓` は履歴呼び出し。
- **詳しいヘルプ:** `help <動詞>`（使い方・対象・フラグ・例）/ `help tags`（`[OK]`/`[ERROR]` などタグの説明）。
- **vβ1.0:** 11コマンドの**枠組み**まで。まだ無いサイト機能（go先のセクション・テーマ・効果音 等）は
  「未登録」等の応答で受ける（中身はサイトを作り込むほど増える）。隠し要素（`unlock`）は未実装。

### 編集する場所

- 応答メッセージの文言 → `js/terminal/responses.js`
- コマンドの文法（動詞・対象・使い方） → `js/terminal/grammar.js`
- コマンドの処理 → `js/terminal/commands.js`
- 見た目 → `css/terminal.css`

### 層のルール（情報の置き場所）

- `data/`（content.js / settings.js）… **公開層**。サイト全体から参照可。
- `js/terminal/` … **非公開層**。コンソールからのみ参照（サイト本体は import しない）。
- `js/terminal/secrets.js` … 最深部。**外部 export しない**。解放は `tryUnlock()` 経由のみ。

## 断片収集システム（`js/fragments/`）

サイトの裏側を探索すると見つかる隠しコレクション要素。ターミナルで特定のコードを `unlock`
すると有効化され、その後サイト内の特定の行動を取ると断片を1つずつ集められる。
有効化後は `run fragments` で収集状況（モーダル）を確認できる。進捗は `localStorage` に保存され、
他端末とは同期しない。

- 何が解放トリガーになるか・解放コードなどは**意図的に非公開**（コードを直接読めば分かるが、
  README やヘルプには出さない）。
- 関連ファイル: `js/fragments/`（data/state/toast/modal/triggers）、`css/fragments.css`、
  `robots.txt` / `wanderer/`。`js/terminal/secrets.js` の解放にもフックしている。

