/* =============================================================
   autocomplete.js — 入力補完（予測変換）
     suggest(input) → { token, candidates:[{name,desc}], segs, index }
     applyCandidate(s, name) → 候補を反映した新しい入力文字列
   ・verb 入力中 → verb 候補（説明 = その verb の help）
   ・verb + 空白後 → target 候補（説明 = targetDesc）。help は verb 名 + "tags"
   ・隠し要素関連 target は候補に出さない（grammar.targets に含めない）
   ============================================================= */

import { GRAMMAR, VERBS } from "./grammar.js";

export function suggest(input) {
  const segs = input.split(" ");
  const index = segs.length - 1;
  const token = segs[index] ?? "";

  // [{ name, desc }] の候補プールを作る
  let pool = [];
  if (index === 0) {
    pool = VERBS.map((v) => ({ name: v, desc: GRAMMAR[v].help }));
  } else if (index === 1 && GRAMMAR[segs[0]]) {
    const verb = segs[0];
    if (verb === "help") {
      pool = [
        ...VERBS.map((v) => ({ name: v, desc: GRAMMAR[v].help })),
        { name: "tags", desc: "応答タグ（[OK]/[ERROR] 等）の説明" },
      ];
    } else {
      const g = GRAMMAR[verb];
      pool = g.targets.map((t) => ({ name: t, desc: g.targetDesc?.[t] ?? "" }));
    }
  }

  const candidates = pool.filter((c) => c.name.startsWith(token));
  return { token, candidates, segs, index };
}

/** 候補名を選んで入力に反映（末尾にスペースを足し次のトークンへ） */
export function applyCandidate(suggestion, name) {
  const copy = suggestion.segs.slice();
  copy[suggestion.index] = name;
  return copy.join(" ") + " ";
}
