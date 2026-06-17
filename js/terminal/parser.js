/* =============================================================
   parser.js — 入力文字列を構文解析する
   <verb> [target] [value] [--flag [value]]
   返り値:
     { type: "empty" }
     { type: "error", lines: string[] }
     { type: "command", verb, target, value, flags }
   ※ verb の存在・引数の要否・フラグ名は parser が検証（構文）。
     target が「既知の対象か」等の意味検証は commands.js が担当。
   ============================================================= */

import { GRAMMAR, VERBS } from "./grammar.js";
import { responses } from "./responses.js";

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
  const flags = {};
  for (let i = 1; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.startsWith("--")) {
      const def = g.flags[tok];
      if (!def) {
        return { type: "error", lines: [`[ERROR] unknown flag '${tok}'`, `        Usage: ${g.usage}`] };
      }
      if (def.value) {
        const next = tokens[i + 1];
        if (next && !next.startsWith("--")) {
          flags[tok] = next;
          i++;
        } else {
          flags[tok] = true;
        }
      } else {
        flags[tok] = true;
      }
    } else {
      positional.push(tok);
    }
  }

  const target = positional[0] ?? null;
  const value = positional[1] ?? null;

  // 引数の要否（構文レベル）
  if (g.arg === "none" && positional.length > 0) {
    return { type: "error", lines: responses.noArgsAllowed(verb) };
  }
  if (g.arg === "required" && !target) {
    return { type: "error", lines: responses.missingTarget(g.usage) };
  }
  if (g.value === "required" && value == null) {
    return { type: "error", lines: responses.missingValue(g.usage) };
  }

  return { type: "command", verb, target, value, flags };
}
