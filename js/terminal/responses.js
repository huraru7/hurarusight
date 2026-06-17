/* =============================================================
   responses.js — 応答メッセージの雛形（verb ごと）
   ★ 文言の調整はこのファイルで。動的な値は関数で返す。
     行頭の [TAG]（INFO/DATA/OK/ERROR/WARN/CLASSIFIED）で色が変わる。
   ============================================================= */

import { VERSION } from "./grammar.js";

/** サイトのコンセプト/哲学（read manifest） */
export const MANIFEST = [
  "[INFO] hurarunium — manifest",
  "",
  "  Every work is a Realm.",
  "  Every Realm is a world.",
  "  Huraru wanders them all.",
  "",
  "  The world breathes. Walk slowly.",
];

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

  /* ---- search ---- */
  search: {
    linkItem: (l) => `[DATA] ${l.label} → ${l.url}`,
    realmItem: (r) => `[DATA] ${r.id} — ${r.name ?? r.title ?? ""}`,
    projectItem: (p) => `[DATA] ${p.title}${p.tag ? ` (${p.tag})` : ""}`,
    empty: (kind) => `[INFO] No ${kind}s found.`,
    notFound: (kind, id) => `[ERROR] ${kind} not found: '${id}'`,
  },

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

  /* ---- read ---- */
  read: {
    emptyLog: () => [`[INFO] Session log is empty.`],
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
    needName: () => `[ERROR] run effect requires an effect name.`,
  },

  /* ---- set ---- */
  set: {
    ok: (key, value) => `[OK] ${key} set to ${value}.`,
    okPending: (key, value) => [
      `[OK] ${key} set to ${value}.`,
      `[INFO] (no visible effect yet — this feature is not built.)`,
    ],
    invalidKey: (key) => `[ERROR] Unknown setting: '${key}'`,
    invalidValue: (key, value) => `[ERROR] Invalid value for ${key}: '${value}'`,
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
    denied: () => `[ERROR] permission denied.`,
  },
};
