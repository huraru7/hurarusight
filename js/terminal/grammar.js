/* =============================================================
   grammar.js — コマンド文法と説明の唯一の定義
   形式: <動詞> <ターゲット>[引数] [value] -TAG
   parser（検証）/ autocomplete（候補+説明）/ help（詳細）が共有する。
     verb: {
       arg:    "required" | "optional" | "none"
       value:  "required" | "optional" | "none"
       targets:[...]                               // 補完に出す target（順序）
       targetDesc: { target: "説明" }              // 各 target の説明
       targetBrackets: { target: [{name,desc}] }   // target[xxx] の xxx 候補（必要な場合のみ）
       bracketValues: { "target:bracket": [{name,desc}] } // 角括弧確定後の value 候補
       targetValues: { target: [{name,desc}] }     // 角括弧を使わない target の value 候補
       flags: {}                                    // 現在未使用（-TAG 方式に統一）
       examples: ["..."]                           // 使用例
       usage, help, category
     }
   -TAG は TAGS_SUPPORTED にあるものだけ有効（現在は -y のみ）。
   ============================================================= */

export const VERSION = "vβ1.0";

export const GRAMMAR = {
  scan: {
    arg: "required",
    value: "none",
    targets: ["status"],
    targetDesc: {
      status: "サイト全体の状態を解析",
    },
    flags: {},
    examples: ["scan status"],
    category: "データ",
    help: "対象を解析・サマリー表示する",
    usage: "scan status",
  },
  show: {
    arg: "required",
    value: "none",
    targets: ["map", "status", "history", "version"],
    targetDesc: {
      map: "ASCII のサイトマップ",
      status: "現在地・時刻",
      history: "コマンド入力履歴",
      version: "システムのバージョン情報",
    },
    flags: {},
    examples: ["show map", "show version"],
    category: "表示",
    help: "UI・情報を画面に表示する",
    usage: "show <map|status|history|version>",
  },
  log: {
    arg: "none",
    value: "none",
    targets: [],
    targetDesc: {},
    flags: {},
    examples: ["log"],
    category: "表示",
    help: "今セッションのログを表示する",
    usage: "log",
  },
  go: {
    arg: "required",
    value: "none",
    targets: ["top"],
    targetDesc: {
      top: "ページ最上部へ",
    },
    flags: {},
    examples: ["go top"],
    category: "移動",
    help: "指定セクションへ移動する",
    usage: "go top",
  },
  run: {
    arg: "required",
    value: "required",
    targets: ["effect"],
    targetDesc: {
      effect: "エフェクトを発火（例: effect[particles] next）",
    },
    // effect[xxx] の xxx 候補
    targetBrackets: {
      effect: [
        { name: "particles", desc: "粒子アニメ" },
        { name: "shapez", desc: "図形を直接指定する" },
      ],
    },
    // ターゲット:角括弧 ごとの value 候補
    bracketValues: {
      "effect:particles": [
        { name: "next", desc: "次の図形へモーフする" },
        { name: "stop", desc: "粒子の動きを止める" },
        { name: "start", desc: "粒子の動きを再開する" },
      ],
      // 「void」は秘匿図形のため候補に出さない
      "effect:shapez": [
        { name: "sphere", desc: "球体" },
        { name: "torus", desc: "トーラス構造" },
        { name: "lorenz", desc: "ローレンツアトラクター" },
        { name: "kleinBottle", desc: "クラインの壺" },
        { name: "supernovaShell", desc: "超新星残骸のシェル構造" },
        { name: "quantumFoam", desc: "量子泡" },
        { name: "blackHole", desc: "ブラックホールの降着円盤と光子球" },
        { name: "wave", desc: "波" },
        { name: "spiral", desc: "渦巻き" },
        { name: "helix", desc: "二重らせん" },
      ],
    },
    flags: {},
    examples: ["run effect[particles] next", "run effect[shapez] sphere"],
    category: "実行",
    help: "演出を実行する",
    usage: "run effect[particles] <next|stop|start> | run effect[shapez] <図形名>",
  },
  set: {
    arg: "optional", // 何を打っても構文エラーにしない（未実装なので常に同じ応答を返す）
    value: "optional",
    targets: [], // 未実装。後日 sound/theme を追加予定
    targetDesc: {},
    flags: {},
    examples: ["set"],
    category: "設定",
    help: "状態・設定を変える（未実装）",
    usage: "set （未実装。sound/theme は今後追加予定）",
  },
  unlock: {
    arg: "required",
    value: "none",
    targets: [], // 隠し要素は候補に出さない
    targetDesc: {},
    flags: {},
    examples: ["unlock <sigil-name>"],
    category: "特殊",
    help: "条件を満たした隠し要素を解放する",
    usage: "unlock <sigil-name>",
  },
  exec: {
    arg: "required",
    value: "optional",
    targets: ["reset"],
    targetDesc: {
      reset: "セッション状態を初期化（確認あり）。'fragments' で断片収集をリセット",
    },
    // target ごとの value 候補
    targetValues: {
      reset: [{ name: "fragments", desc: "断片収集の進捗だけリセットする" }],
    },
    flags: {},
    examples: ["exec reset", "exec reset fragments", "exec reset -y", "exec reset fragments -y"],
    category: "特殊",
    help: "特殊・危険な操作を実行する",
    usage: "exec reset [fragments] [-y]",
  },
  help: {
    arg: "optional",
    value: "none",
    targets: [], // help の対象は verb 名 / tags（autocomplete 側で補完）
    targetDesc: {},
    flags: {},
    examples: ["help", "help scan", "help tags"],
    category: "システム",
    help: "ヘルプを表示する",
    usage: "help [verb|tags]",
  },
  clear: {
    arg: "none",
    value: "none",
    targets: [],
    targetDesc: {},
    flags: {},
    examples: ["clear"],
    category: "システム",
    help: "コンソール出力をクリアする",
    usage: "clear",
  },
};

/** 全 verb 名 */
export const VERBS = Object.keys(GRAMMAR);

/** `-TAG` として使える唯一の集合（parser の検証・help 表示で使う） */
export const TAGS_SUPPORTED = {
  y: { desc: "確認をすべて省略してその場で実行する" },
};

/** 応答タグの凡例（help tags） */
export const TAGS = [
  { tag: "INFO", desc: "通常の情報" },
  { tag: "DATA", desc: "データ取得の結果" },
  { tag: "OK", desc: "操作の成功" },
  { tag: "ERROR", desc: "エラー（失敗・不正入力）" },
  { tag: "WARN", desc: "警告・確認プロンプト" },
  { tag: "CLASSIFIED", desc: "隠し・特権出力（将来）" },
];
