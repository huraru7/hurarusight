/* =============================================================
   responses.js — 応答メッセージの雛形（verb ごと）
   ★ 文言の調整はこのファイルで。動的な値は関数で返す。
     行頭の [TAG]（INFO/DATA/OK/ERROR/WARN/CLASSIFIED）で色が変わる。
   ============================================================= */

import { VERSION } from "./grammar.js";

export const responses = {
  /* ---- 共通エラー ---- */
  unknownCommand: (cmd, suggestion) => {
    const out = [`[ERROR] unknown command '${cmd}'`];
    if (suggestion) out.push(`        Did you mean: ${suggestion}?`);
    return out;
  },
  unknownTarget: (target, suggestion) => {
    const out = [`[ERROR] unknown target: '${target}'`];
    if (suggestion) out.push(`        Did you mean: ${suggestion}?`);
    return out;
  },
  missingTarget: (usage) => [`[ERROR] missing required target.`, `        Usage: ${usage}`],
  missingValue: (usage) => [`[ERROR] missing required value.`, `        Usage: ${usage}`],
  noArgsAllowed: (verb) => [`[ERROR] '${verb}' takes no arguments.`],

  /* ---- scan ---- */
  scan: {
    line: (label, value) => `[DATA] ${label}: ${value}`,
    header: (label) => `[INFO] scanning ${label}...`,
  },

  /* ---- show ---- */
  version: () => [
    `[INFO] hurarunium.terminal ${VERSION}`,
    `[DATA] build: static (no bundler) · ESM + CDN`,
  ],
  emptyHistory: () => [`[INFO] No history yet.`],

  /* ---- log ---- */
  log: {
    empty: () => [`[INFO] Session log is empty.`],
  },

  /* ---- go ---- */
  go: {
    success: (target) => `[OK] Navigating to ${target}... done.`,
    notFound: (target) => `[ERROR] Unknown destination: '${target}'`,
  },

  /* ---- run ---- */
  run: {
    ok: (name) => `[OK] ${name} started.`,
    notRegistered: (name) => `[INFO] '${name}' is not registered yet.`,
    needBracket: () => `[ERROR] run effect requires a qualifier, e.g. effect[particles].`,
  },

  /* ---- unlock ---- */
  unlock: {
    denied: () => [`[ERROR] no unlockable targets found.`],
  },

  /* ---- exec ---- */
  exec: {
    confirm: () => `[WARN] This action modifies session state. proceed? [y/N]`,
    cancelled: () => `[INFO] Cancelled.`,
    resetDone: () => `[OK] Session state reset.`,
  },
};
