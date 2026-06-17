/* =============================================================
   grammar.js — コマンド文法の唯一の定義
   parser（検証）/ autocomplete（候補）/ help（usage）がここを共有する。
     verb: {
       arg:    "required" | "optional" | "none"   // target の要否
       value:  "required" | "optional" | "none"   // verb 直後 or flag の値
       targets:[...]                               // 補完に出す target 候補
       flags:  { "--name": { value: bool } }
       usage:  "...", help: "...", category: "..."
     }
   ============================================================= */

export const VERSION = "vβ1.0";

export const GRAMMAR = {
  search: {
    arg: "required",
    value: "optional",
    targets: ["realm", "project", "link"],
    flags: { "--tag": { value: true } },
    category: "データ",
    help: "データから情報を検索・取得する",
    usage: "search <realm|project|link> [value] [--tag <value>]",
  },
  scan: {
    arg: "required",
    value: "none",
    targets: ["realm", "project", "status"],
    flags: { "--verbose": { value: false }, "--summary": { value: false } },
    category: "データ",
    help: "対象を解析・サマリー表示する",
    usage: "scan <realm|project|status> [--verbose|--summary]",
  },
  show: {
    arg: "required",
    value: "none",
    targets: ["map", "status", "history", "version"],
    flags: {},
    category: "表示",
    help: "UI・情報を画面に表示する",
    usage: "show <map|status|history|version>",
  },
  read: {
    arg: "required",
    value: "none",
    targets: ["log", "journal", "manifest"],
    flags: { "--from": { value: true } },
    category: "表示",
    help: "テキスト・ログ・記録を読む",
    usage: "read <log|journal|manifest> [--from <value>]",
  },
  go: {
    arg: "required",
    value: "none",
    targets: ["top", "contact"],
    flags: {},
    category: "移動",
    help: "指定セクションへ移動する",
    usage: "go <top|contact|...section>",
  },
  run: {
    arg: "required",
    value: "optional",
    targets: ["intro", "ambient", "effect"],
    flags: { "--loop": { value: false }, "--stop": { value: false } },
    category: "実行",
    help: "演出・スクリプトを実行する",
    usage: "run <intro|ambient|effect> [effect-name] [--loop|--stop]",
  },
  set: {
    arg: "required",
    value: "required",
    targets: ["sound", "theme"],
    flags: {},
    category: "設定",
    help: "状態・設定を変える",
    usage: "set <sound|theme> <value>",
  },
  unlock: {
    arg: "required",
    value: "none",
    targets: [], // 隠し要素は候補に出さない
    flags: {},
    category: "特殊",
    help: "条件を満たした隠し要素を解放する",
    usage: "unlock <sigil-name>",
  },
  exec: {
    arg: "required",
    value: "optional",
    targets: ["reset", "override"],
    flags: {},
    category: "特殊",
    help: "特殊・危険な操作を実行する",
    usage: "exec <reset|override> [code]",
  },
  help: {
    arg: "optional",
    value: "none",
    targets: [], // help の target は verb 名（autocomplete 側で補完）
    flags: {},
    category: "システム",
    help: "ヘルプを表示する",
    usage: "help [verb]",
  },
  clear: {
    arg: "none",
    value: "none",
    targets: [],
    flags: {},
    category: "システム",
    help: "コンソール出力をクリアする",
    usage: "clear",
  },
};

/** 全 verb 名 */
export const VERBS = Object.keys(GRAMMAR);
