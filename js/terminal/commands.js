/* =============================================================
   commands.js — 各コマンドの処理（ベース・ディスパッチ）
   data/ を読み、応答行（string[]）を返す。未実装の機能は丁寧な応答で受ける。
   返り値 result:
     { lines: string[], clear?: bool, effect?: ()=>void,
       await?: "confirm", onConfirm?: ()=>result }
   ============================================================= */

import { nearest } from "./parser.js";
import { tryUnlock } from "./secrets.js";

import { GRAMMAR, VERBS, VERSION, TAGS } from "../../data/grammar.js";
import { responses as R } from "../../data/responses.js";
import { settings } from "../../data/settings.js";

import { getState, resetFragments } from "../fragments/state.js";
import { open as openFragmentsModal } from "../fragments/modal.js";
import { beginVoidGate } from "./void-gate.js";

const OPEN_TARGET_VERBS = new Set(["go", "unlock", "help", "set"]); // 対象が自由 or 別検証

/** 閉じた target 集合に対する検証（不正なら error 行を返す） */
function targetError(verb, target) {
  if (OPEN_TARGET_VERBS.has(verb)) return null;
  if (verb === "run" && target === "fragments") return null; // 隠しターゲット。補完には出さない
  const allowed = GRAMMAR[verb].targets;
  if (allowed.length && target && !allowed.includes(target)) {
    return R.unknownTarget(target, nearest(target, allowed));
  }
  return null;
}

const pad = (n) => String(n).padStart(2, "0");
const now = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const HANDLERS = {
  /* ---------- scan ---------- */
  scan({ target }) {
    if (target === "status") {
      const p = settings.particles;
      const sections = document.querySelectorAll("main section").length;
      const running = window.huraruParticles?.running ? "running" : "idle";
      return {
        lines: [
          R.scan.header("status"),
          R.scan.line("particles", `${p.count} pts · ${p.shapes.length} shapes · ${running}`),
          R.scan.line("sections", String(sections)),
          R.scan.line("terminal", VERSION),
        ],
      };
    }
    return { lines: [] };
  },

  /* ---------- show ---------- */
  show({ target, ctx }) {
    if (target === "version") return { lines: R.version() };
    if (target === "history") {
      if (!ctx.history.length) return { lines: R.emptyHistory() };
      return { lines: ctx.history.map((h, i) => `[DATA] ${pad(i + 1)}  ${h}`) };
    }
    if (target === "status") {
      return { lines: [`[DATA] time: ${now()}`, `[DATA] location: Unknown Territory`] };
    }
    if (target === "map") {
      const secs = [...document.querySelectorAll("main section")].map(
        (s) => s.id || s.className.split(/\s+/)[0] || "section"
      );
      const lines = ["[INFO] site map"];
      (secs.length ? secs : ["hero"]).forEach((name) => lines.push(`[DATA]   • ${name}`));
      lines.push("[INFO] (more sections coming soon)");
      return { lines };
    }
    return { lines: [] };
  },

  /* ---------- log ---------- */
  log({ ctx }) {
    if (!ctx.history.length) return { lines: R.log.empty() };
    return { lines: ["[INFO] session log", ...ctx.history.map((h) => `[DATA]   ${h}`)] };
  },

  /* ---------- go ---------- */
  go({ target }) {
    if (target === "top") {
      return { lines: [R.go.success("top")], effect: () => window.scrollTo({ top: 0, behavior: "smooth" }) };
    }
    const el =
      document.getElementById(target) ||
      document.querySelector(`[data-section="${target}"], [data-realm="${target}"]`);
    if (el) {
      return { lines: [R.go.success(target)], effect: () => el.scrollIntoView({ behavior: "smooth" }) };
    }
    return { lines: [R.go.notFound(target)] };
  },

  /* ---------- run ---------- */
  run({ target, bracket, value }) {
    if (target === "fragments") {
      if (!getState().unlocked) return { lines: [`[ERROR] unknown script: 'fragments'`] };
      return { lines: [], effect: () => openFragmentsModal() };
    }
    if (target === "effect") {
      if (bracket === "shapez") {
        if (value === "void") return { lines: [], effect: () => beginVoidGate() }; // 隠しトリガー
        const ok = window.huraruParticles?.goToShape?.(value);
        if (!ok) return { lines: [R.run.notRegistered(value)] };
        return { lines: [R.run.ok(value)] };
      }
      if (bracket !== "particles") return { lines: [R.run.needBracket()] };
      const p = window.huraruParticles;
      if (value === "next" && p?.next) return { lines: [R.run.ok(value)], effect: () => p.next() };
      if (value === "stop" && p?.stop) return { lines: [R.run.ok(value)], effect: () => p.stop() };
      if (value === "start" && p?.start) return { lines: [R.run.ok(value)], effect: () => p.start() };
      return { lines: [R.run.notRegistered(value)] };
    }
    return { lines: [R.run.notRegistered(target)] };
  },

  /* ---------- set ---------- */
  set() {
    return { lines: [`[INFO] set is not implemented yet. (sound/theme planned)`] };
  },

  /* ---------- unlock ---------- */
  unlock({ target }) {
    const result = tryUnlock(target, {}); // vβ1.0: 常に null
    if (!result) return { lines: R.unlock.denied() };
    return { lines: result.reveal ? result.reveal() : ["[CLASSIFIED] ..."] };
  },

  /* ---------- exec ---------- */
  exec({ target, value, tags, ctx }) {
    if (target === "reset" && value === "fragments") {
      const onConfirm = () => ({
        lines: [`[OK] fragment collection reset.`],
        effect: () => resetFragments(),
      });
      if (tags?.y) return onConfirm();
      return { lines: [R.exec.confirm()], await: "confirm", onConfirm };
    }
    if (target === "reset") {
      const onConfirm = () => ({
        lines: [R.exec.resetDone()],
        effect: () => ctx.reset(),
      });
      if (tags?.y) return onConfirm();
      return { lines: [R.exec.confirm()], await: "confirm", onConfirm };
    }
    return { lines: [`[ERROR] unknown operation: '${target}'`] };
  },

  /* ---------- help ---------- */
  help({ target }) {
    // タグの説明
    if (target === "tags") {
      const lines = ["[INFO] response tags", ""];
      for (const { tag, desc } of TAGS) lines.push(`[${tag}] ${desc}`);
      return { lines };
    }

    // 個別コマンドの詳細
    if (target) {
      const g = GRAMMAR[target];
      if (!g) return { lines: R.unknownCommand(target, nearest(target, VERBS)) };
      const lines = [`[INFO] ${target} — ${g.help}`, "", `  Usage: ${g.usage}`];

      if (g.targets.length) {
        lines.push("", "  Targets:");
        for (const t of g.targets) lines.push(`    ${t.padEnd(10)} ${g.targetDesc?.[t] ?? ""}`);
      }
      if (g.examples?.length) {
        lines.push("", "  Examples:");
        for (const ex of g.examples) lines.push(`    ${ex}`);
      }
      return { lines };
    }

    // 一覧（カテゴリ別）+ 案内
    const byCat = {};
    for (const v of VERBS) {
      const c = GRAMMAR[v].category;
      (byCat[c] ??= []).push(v);
    }
    const lines = ["[INFO] available commands", ""];
    for (const [cat, verbs] of Object.entries(byCat)) {
      lines.push(`  ${cat}`);
      for (const v of verbs) lines.push(`    ${v.padEnd(8)} ${GRAMMAR[v].help}`);
    }
    lines.push("", "[INFO] 'help <verb>' で詳細 / 'help tags' でタグの説明");
    return { lines };
  },

  /* ---------- clear ---------- */
  clear() {
    return { lines: [], clear: true };
  },
};

/**
 * 解析済みコマンドを実行して result を返す。
 * @param {object} parsed parser.parse() の command 結果
 * @param {object} ctx { history, settings, reset }
 */
export function execute(parsed, ctx) {
  const { verb, target } = parsed;
  const te = targetError(verb, target);
  if (te) return { lines: te };
  const handler = HANDLERS[verb];
  if (!handler) return { lines: [`[ERROR] not implemented: '${verb}'`] };
  return handler({ ...parsed, ctx });
}
