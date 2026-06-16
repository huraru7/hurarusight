# huraru

ふらるの個人サイト。**シンプルな素の HTML / CSS / JS の土台**から、機能を少しずつ足していきます。

## フォルダ構成

```
huraru-portfolio/
├── index.html      入口。ブラウザが最初に開くページ
├── css/
│   └── style.css   見た目（スタイル）
└── js/
    ├── main.js       動き（素のスクリプト）
    └── particles.js  粒子アニメの足場（Three.js / 準備のみ・未描画）
```

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

ファーストビューの背景として、柔らかな点がゆっくり漂います。`#particle-canvas` は画面全面・背面。

- 数・色・大きさ・透明度 → `js/particles.js` の `COUNT` と `PointsMaterial`
- 動きの速さ → `_loop()` 内の係数（回転 `0.03`・呼吸 `0.25` など）
- `window.huraruParticles` で後から操作可能（`.stop()` / `.start()`）
- `prefers-reduced-motion`（視差を減らす設定）では自動で静止します

## ここから足していくときの目安

- 見た目を変える → `css/style.css`
- セクション（About / Works など）を増やす → `index.html` に `<section>` を追加し、`css/` で整える
- 動き（クリック・スクロール演出など）を付ける → `js/main.js`
- 画像を使う → `images/` フォルダを作ってそこに置く

> メモ: 以前は `src/` で細かくモジュール分割し、CDN からライブラリを読み込む構成でしたが、
> 個人サイトの出発点としては過剰だったため、分かりやすい classic 構成にリセットしました。
