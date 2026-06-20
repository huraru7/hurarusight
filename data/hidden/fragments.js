/* =============================================================
   fragments.js — 断片7件の定義
   note / condition は断片収集モーダルでの「取得条件の見返し」に使う。condition は実際の解放トリガーを
   抽象化した表現（具体的な秘匿値そのものは書かない）。
   id の並び = #01〜#07。js/fragments/state.js・modal.js が読み込む。
   ============================================================= */

export const FRAGMENTS = [
  {
    id: "01",
    name: "観測者の目",
    note: "向こう側から覗いていた者の記録。",
    condition: "ブラウザの開発者ツールを開いた者へ。",
  },
  {
    id: "02",
    name: "行間の囁き",
    note: "ソースの隙間に潜んでいた一文。",
    condition: "ページのソースを読み、コンソールに呼びかけた者へ。",
  },
  {
    id: "03",
    name: "ほとんど無",
    note: "ほとんど見えないものに、触れた証。",
    condition: "画面のどこかに潜む、ほぼ見えない何かに触れた者へ。",
  },
  {
    id: "04",
    name: "禁じられた道",
    note: "誰にも知られてはいけない道を歩いた者へ。",
    condition: "誰も踏み入れないはずの隠された道を歩いた者へ。",
  },
  {
    id: "05",
    name: "深夜の刻",
    note: "夜が最も深い時刻だけに開く扉。",
    condition: "灯りの消えた深夜の時間にこの場所を訪れた者へ。",
  },
  {
    id: "06",
    name: "儀式",
    note: "決まった所作を繰り返した者だけが辿り着く。",
    condition: "ターミナルで定まった所作を、順に行った者へ。",
  },
  {
    id: "07",
    name: "古い符号",
    note: "忘れられた符号を、今も覚えている指先。",
    condition: "古い符号をキーボードに刻んだ者へ。",
  },
];

export const FRAGMENT_IDS = FRAGMENTS.map((f) => f.id);
export const TOTAL = FRAGMENTS.length;

export function fragmentById(id) {
  return FRAGMENTS.find((f) => f.id === id) ?? null;
}
