/* =============================================================
   autocomplete.js — 入力補完（予測変換）
     suggest(input) → { token, candidates:[{name,desc,prefix?,suffix?}], segs, index, prefix, suffix }
     applyCandidate(s, name) → 候補を反映した新しい入力文字列
   ・verb 入力中 → verb 候補（説明 = その verb の help）
   ・verb + 空白後 → target 候補（説明 = targetDesc）。help は verb 名 + "tags"
   ・target[修飾子] の角括弧の中身も候補を出す（target ごとの targetBrackets）
   ・value 位置も候補を出す（bracketValues / targetValues）
   ・-TAG（例: -y）は候補を出さない（候補プールにダッシュ名を入れないので自然と出ない）
   ・隠し要素関連 target は候補に出さない（grammar.targets に含めない）
   ============================================================= */

import { GRAMMAR, VERBS } from "./grammar.js";
import { getState } from "../fragments/state.js";

/** "effect[par" のようなトークンを { name, bracketOpen, bracketToken } に分解する */
function splitTargetToken(token) {
  const openIdx = token.indexOf("[");
  if (openIdx === -1) return { name: token, bracketOpen: false, bracketToken: null };
  const closeIdx = token.indexOf("]");
  if (closeIdx === -1) {
    return { name: token.slice(0, openIdx), bracketOpen: true, bracketToken: token.slice(openIdx + 1) };
  }
  return { name: token.slice(0, openIdx), bracketOpen: false, bracketToken: token.slice(openIdx + 1, closeIdx) };
}

export function suggest(input) {
  const segs = input.split(" ");
  const index = segs.length - 1;
  const token = segs[index] ?? "";

  // [{ name, desc }] の候補プールを作る
  let pool = [];
  let filterToken = token;
  let prefix = "";
  let suffix = " ";

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
      const { name: tname, bracketOpen, bracketToken } = splitTargetToken(token);

      if (bracketOpen) {
        // target[修飾子の途中入力]
        pool = g.targetBrackets?.[tname] ?? [];
        filterToken = bracketToken ?? "";
        prefix = `${tname}[`;
        suffix = "] ";
      } else {
        pool = g.targets.map((t) => ({
          name: t,
          desc: g.targetDesc?.[t] ?? "",
          suffix: g.targetBrackets?.[t] ? "[" : " ",
        }));
        // 断片システム解放後だけ「fragments」を候補に出す（解放前は隠す）
        if (verb === "run" && getState().unlocked) {
          pool.push({ name: "fragments", desc: "断片の収集状況を開く" });
        }
      }
    }
  } else if (index === 2 && GRAMMAR[segs[0]]) {
    const verb = segs[0];
    const g = GRAMMAR[verb];
    const { name: tname, bracketToken: bv } = splitTargetToken(segs[1] ?? "");
    if (bv && g.bracketValues?.[`${tname}:${bv}`]) {
      pool = g.bracketValues[`${tname}:${bv}`];
    } else if (g.targetValues?.[tname]) {
      pool = g.targetValues[tname];
    }
  }

  const candidates = pool.filter((c) => c.name.startsWith(filterToken));
  return { token: filterToken, candidates, segs, index, prefix, suffix };
}

/** 候補名を選んで入力に反映する（候補ごとの prefix/suffix を優先し、無ければ既定値を使う） */
export function applyCandidate(suggestion, name) {
  const cand = suggestion.candidates.find((c) => c.name === name);
  const prefix = cand?.prefix ?? suggestion.prefix ?? "";
  const suffix = cand?.suffix ?? suggestion.suffix ?? " ";
  const copy = suggestion.segs.slice();
  copy[suggestion.index] = prefix + name + suffix;
  return copy.join(" ");
}
