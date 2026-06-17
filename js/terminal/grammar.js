/* =============================================================
   grammar.js — コマンド文法と説明の唯一の定義
   parser（検証）/ autocomplete（候補+説明）/ help（詳細）が共有する。
     verb: {
       arg:    "required" | "optional" | "none"
       value:  "required" | "optional" | "none"
       targets:[...]                               // 補完に出す target（順序）
       targetDesc: { target: "説明" }              // 各 target の説明
       flags:  { "--name": { value, desc, placeholder } }
       examples: ["..."]                           // 使用例
       usage, help, category
     }
   ============================================================= */

export const VERSION = "vβ1.0";

export const GRAMMAR = {
  search: {
    arg: "required",
    value: "optional",
    targets: ["realm", "project", "link"],
    targetDesc: {
      realm: "Realm（世界/カテゴリ）を検索。値で ID 指定も可",
      project: "プロジェクト/作品を検索",
      link: "外部リンク（SNS 等）を取得",
    },
    flags: { "--tag": { value: true, desc: "タグで絞り込む", placeholder: "<value>" } },
    examples: ["search link", "search project --tag game", "search realm realm-of-light"],
    category: "データ",
    help: "データから情報を検索・取得する",
    usage: "search <realm|project|link> [value] [--tag <value>]",
  },
  scan: {
    arg: "required",
    value: "none",
    targets: ["realm", "project", "status"],
    targetDesc: {
      realm: "Realm の件数を解析",
      project: "プロジェクトの件数を解析",
      status: "サイト全体の状態を解析",
    },
    flags: {
      "--verbose": { value: false, desc: "詳細を表示" },
      "--summary": { value: false, desc: "概要のみ（既定）" },
    },
    examples: ["scan status", "scan project --verbose"],
    category: "データ",
    help: "対象を解析・サマリー表示する",
    usage: "scan <realm|project|status> [--verbose|--summary]",
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
  read: {
    arg: "required",
    value: "none",
    targets: ["log", "journal", "manifest"],
    targetDesc: {
      log: "今セッションのログ",
      journal: "朝の記録（About の文章）",
      manifest: "サイトのコンセプト・哲学",
    },
    flags: { "--from": { value: true, desc: "日付/セッションID で絞る", placeholder: "<id>" } },
    examples: ["read manifest", "read journal"],
    category: "表示",
    help: "テキスト・ログ・記録を読む",
    usage: "read <log|journal|manifest> [--from <value>]",
  },
  go: {
    arg: "required",
    value: "none",
    targets: ["top", "contact"],
    targetDesc: {
      top: "ページ最上部へ",
      contact: "コンタクトへ（未設置ならエラー）",
    },
    flags: {},
    examples: ["go top", "go contact"],
    category: "移動",
    help: "指定セクションへ移動する",
    usage: "go <top|contact|...section>",
  },
  run: {
    arg: "required",
    value: "optional",
    targets: ["intro", "ambient", "effect"],
    targetDesc: {
      intro: "イントロ演出（未登録）",
      ambient: "環境音（未登録）",
      effect: "エフェクトを発火（例: effect particles-next）",
    },
    flags: {
      "--loop": { value: false, desc: "ループ再生" },
      "--stop": { value: false, desc: "実行中のものを停止" },
    },
    examples: ["run effect particles-next", "run effect particles-stop"],
    category: "実行",
    help: "演出・スクリプトを実行する",
    usage: "run <intro|ambient|effect> [effect-name] [--loop|--stop]",
  },
  set: {
    arg: "required",
    value: "required",
    targets: ["sound", "theme"],
    targetDesc: {
      sound: "効果音の on/off",
      theme: "テーマ dark/light",
    },
    flags: {},
    examples: ["set sound on", "set theme dark"],
    category: "設定",
    help: "状態・設定を変える",
    usage: "set <sound|theme> <value>",
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
    targets: ["reset", "override"],
    targetDesc: {
      reset: "セッション状態を初期化（確認あり）",
      override: "特定コードで特権操作（確認あり）",
    },
    flags: {},
    examples: ["exec reset", "exec override <code>"],
    category: "特殊",
    help: "特殊・危険な操作を実行する",
    usage: "exec <reset|override> [code]",
  },
  help: {
    arg: "optional",
    value: "none",
    targets: [], // help の対象は verb 名 / tags（autocomplete 側で補完）
    targetDesc: {},
    flags: {},
    examples: ["help", "help search", "help tags"],
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

/** 応答タグの凡例（help tags） */
export const TAGS = [
  { tag: "INFO", desc: "通常の情報" },
  { tag: "DATA", desc: "データ取得の結果" },
  { tag: "OK", desc: "操作の成功" },
  { tag: "ERROR", desc: "エラー（失敗・不正入力）" },
  { tag: "WARN", desc: "警告・確認プロンプト" },
  { tag: "CLASSIFIED", desc: "隠し・特権出力（将来）" },
];
