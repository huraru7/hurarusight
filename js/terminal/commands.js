/* =============================================================
   commands.js — 各コマンドの処理（ベース・ディスパッチ）
   data/ を読み、応答行（string[]）を返す。未実装の機能は丁寧な応答で受ける。
   返り値 result:
     { lines: string[], clear?: bool, effect?: ()=>void,
       await?: "confirm", onConfirm?: ()=>result }
   ============================================================= */

import { GRAMMAR, VERBS, VERSION, TAGS } from "./grammar.js";
import { responses as R, MANIFEST } from "./responses.js";
import { nearest } from "./parser.js";
import { tryUnlock } from "./secrets.js";

import { content } from "../../data/content.js";
import { settings } from "../../data/settings.js";

const OPEN_TARGET_VERBS = new Set(["go", "unlock", "help"]); // 対象が自由 or 別検証

/** 閉じた target 集合に対する検証（不正なら error 行を返す） */
function targetError(verb, target) {
  if (OPEN_TARGET_VERBS.has(verb)) return null;
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
  /* ---------- search ---------- */
  search({ target, value, flags }) {
    if (target === "link") {
      const links = content.links ?? [];
      if (!links.length) return { lines: [R.search.empty("link")] };
      return { lines: links.map(R.search.linkItem) };
    }
    if (target === "realm") {
      const realms = content.realms ?? [];
      if (value) {
        const r = realms.find((x) => x.id === value);
        return { lines: [r ? R.search.realmItem(r) : R.search.notFound("realm", value)] };
      }
      if (!realms.length) return { lines: [R.search.empty("realm")] };
      return { lines: realms.map(R.search.realmItem) };
    }
    if (target === "project") {
      let projects = content.projects ?? content.works ?? [];
      const tag = flags["--tag"];
      if (tag) projects = projects.filter((p) => (p.tag ?? p.category) === tag);
      if (!projects.length) return { lines: [R.search.empty("project")] };
      return { lines: projects.map(R.search.projectItem) };
    }
    return { lines: [] };
  },

  /* ---------- scan ---------- */
  scan({ target, flags }) {
    const verbose = !!flags["--verbose"];
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
    if (target === "realm" || target === "project") {
      const list = target === "realm" ? content.realms ?? [] : content.projects ?? content.works ?? [];
      const out = [R.scan.header(target), R.scan.line(`${target}s`, String(list.length))];
      if (verbose) {
        for (const item of list) out.push(`[DATA]   - ${item.id ?? item.title ?? "?"}`);
      }
      return { lines: out };
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

  /* ---------- read ---------- */
  read({ target, ctx }) {
    if (target === "manifest") return { lines: MANIFEST };
    if (target === "journal") {
      const intro = content.profile?.intro ?? [];
      if (!intro.length) return { lines: ["[INFO] journal is empty."] };
      return { lines: ["[INFO] journal", ...intro.map((p) => `  ${p}`)] };
    }
    if (target === "log") {
      if (!ctx.history.length) return { lines: R.read.emptyLog() };
      return { lines: ["[INFO] session log", ...ctx.history.map((h) => `[DATA]   ${h}`)] };
    }
    return { lines: [] };
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
  run({ target, value, flags }) {
    if (target === "effect") {
      if (!value) return { lines: [R.run.needName()] };
      const p = window.huraruParticles;
      if (value === "particles-next" && p?.next) return { lines: [R.run.ok(value)], effect: () => p.next() };
      if (value === "particles-stop" && p?.stop) return { lines: [R.run.ok(value)], effect: () => p.stop() };
      if (value === "particles-start" && p?.start) return { lines: [R.run.ok(value)], effect: () => p.start() };
      return { lines: [R.run.notRegistered(value)] };
    }
    // intro / ambient はまだ未登録
    return { lines: [R.run.notRegistered(target)] };
  },

  /* ---------- set ---------- */
  set({ target, value, ctx }) {
    const valid = {
      sound: ["on", "off"],
      theme: ["dark", "light"],
    };
    if (!(target in valid)) return { lines: [R.set.invalidKey(target)] };
    if (!valid[target].includes(value)) return { lines: [R.set.invalidValue(target, value)] };
    ctx.settings[target] = value; // セッションに保存（視覚反映はまだ無い）
    return { lines: R.set.okPending(target, value) };
  },

  /* ---------- unlock ---------- */
  unlock({ target }) {
    const result = tryUnlock(target, {}); // vβ1.0: 常に null
    if (!result) return { lines: R.unlock.denied() };
    return { lines: result.reveal ? result.reveal() : ["[CLASSIFIED] ..."] };
  },

  /* ---------- exec ---------- */
  exec({ target, ctx }) {
    if (target === "reset") {
      return {
        lines: [R.exec.confirm()],
        await: "confirm",
        onConfirm: () => ({
          lines: [R.exec.resetDone()],
          effect: () => ctx.reset(),
        }),
      };
    }
    if (target === "override") {
      return {
        lines: [R.exec.confirm()],
        await: "confirm",
        onConfirm: () => ({ lines: [R.exec.denied()] }),
      };
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
      const flagNames = Object.keys(g.flags);
      if (flagNames.length) {
        lines.push("", "  Flags:");
        for (const f of flagNames) {
          const def = g.flags[f];
          const head = def.value ? `${f} ${def.placeholder ?? "<value>"}` : f;
          lines.push(`    ${head.padEnd(18)} ${def.desc ?? ""}`);
        }
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
