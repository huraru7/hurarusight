/* =============================================================
   autocomplete.js — 入力補完（ゴースト文字 + 候補リスト）
     suggest(input)        → { token, candidates, segs, index }
     applyCandidate(s, c)   → 候補を反映した新しい入力文字列
   ・verb 入力中 → verb 候補
   ・verb + 空白後 → その verb の target 候補（help は verb 名）
   ・隠し要素関連 target は候補に出さない（grammar.targets に含めない）
   ============================================================= */

import { GRAMMAR, VERBS } from "./grammar.js";

export function suggest(input) {
  const segs = input.split(" ");
  const index = segs.length - 1;
  const token = segs[index] ?? "";

  let list = [];
  if (index === 0) {
    list = VERBS; // verb 補完
  } else if (index === 1 && GRAMMAR[segs[0]]) {
    list = segs[0] === "help" ? VERBS : GRAMMAR[segs[0]].targets; // target 補完
  }

  const candidates = list.filter((x) => x.startsWith(token));
  return { token, candidates, segs, index };
}

/** 候補を選んで入力に反映（末尾にスペースを足し次のトークンへ） */
export function applyCandidate(suggestion, candidate) {
  const copy = suggestion.segs.slice();
  copy[suggestion.index] = candidate;
  return copy.join(" ") + " ";
}
