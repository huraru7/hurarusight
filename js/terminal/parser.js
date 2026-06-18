/* =============================================================
   parser.js — 入力文字列を構文解析する
   <verb> <target>[bracket] [value] -TAG
   返り値:
     { type: "empty" }
     { type: "error", lines: string[] }
     { type: "command", verb, target, bracket, value, tags }
   ※ verb の存在・引数の要否・タグ名は parser が検証（構文）。
     target/bracket が「既知の対象か」等の意味検証は commands.js が担当。
   ============================================================= */

import { GRAMMAR, VERBS, TAGS_SUPPORTED } from "./grammar.js";
import { responses } from "./responses.js";

/** "effect[particles]" のようなトークンを { name, bracket } に分解する */
function splitBracket(token) {
  const m = token.match(/^([^[\]]+)(?:\[([^[\]]+)\])?$/);
  if (!m) return { name: token, bracket: null };
  return { name: m[1], bracket: m[2] ?? null };
}

/** レーベンシュタイン距離 */
function distance(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...new Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

/** 候補の中から最も近い語（距離 <= 2 のみ） */
export function nearest(word, list) {
  let best = null;
  let bestD = Infinity;
  for (const w of list) {
    const dd = distance(word, w);
    if (dd < bestD) {
      bestD = dd;
      best = w;
    }
  }
  return bestD <= 2 ? best : null;
}

export function parse(input) {
  const trimmed = input.trim();
  if (!trimmed) return { type: "empty" };

  const tokens = trimmed.split(/\s+/);
  const verb = tokens[0];

  if (!Object.prototype.hasOwnProperty.call(GRAMMAR, verb)) {
    return { type: "error", lines: responses.unknownCommand(verb, nearest(verb, VERBS)) };
  }
  const g = GRAMMAR[verb];

  const positional = [];
  const tags = {};
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.startsWith("-") && !tok.startsWith("--") && tok.length > 1) {
      const name = tok.slice(1);
      if (!TAGS_SUPPORTED[name]) {
        return { type: "error", lines: [`[ERROR] unknown tag '${tok}'`, `        Usage: ${g.usage}`] };
      }
      tags[name] = true;
    } else {
      positional.push(tok);
    }
  }

  const { name: target, bracket } = positional[0] != null ? splitBracket(positional[0]) : { name: null, bracket: null };
  const value = positional[1] ?? null;

  // 引数の要否（構文レベル）
  if (g.arg === "none" && positional.length > 0) {
    return { type: "error", lines: responses.noArgsAllowed(verb) };
  }
  if (g.arg === "required" && !target) {
    return { type: "error", lines: responses.missingTarget(g.usage) };
  }
  if (g.value === "required" && value == null && !(verb === "run" && target === "fragments")) {
    return { type: "error", lines: responses.missingValue(g.usage) };
  }

  return { type: "command", verb, target, bracket, value, tags };
}
