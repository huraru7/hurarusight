/* =============================================================
   console.js — ターミナルのUI/制御
   DOM生成・開閉・ログ描画（タイプライター）・履歴・補完UI を担当。
   表層（サイト本体）には干渉しない独立した固定要素。
   ============================================================= */

import { VERSION } from "../../data/grammar.js";
import { parse } from "./parser.js";
import { execute } from "./commands.js";
import { suggest, applyCandidate } from "./autocomplete.js";
import { onTerminalCommand } from "../fragments/triggers.js";

const TAG_CLASS = {
  INFO: "term--info",
  DATA: "term--data",
  OK: "term--ok",
  ERROR: "term--error",
  WARN: "term--warn",
  CLASSIFIED: "term--classified",
};

function tagOf(text) {
  const m = text.match(/^\[(\w+)\]/);
  return m ? m[1] : null;
}
function speedFor(text) {
  const tag = tagOf(text);
  if (tag === "ERROR") return 10; // 速く・機械的に
  if (tag === "CLASSIFIED") return 60; // 遅く・じわり
  return 20; // 通常
}

export class Terminal {
  constructor() {
    this.isOpen = false;
    this.animating = false;
    this._skip = false;
    this._timer = 0;
    this.history = [];
    this._histIndex = 0;
    this.settings = {};
    this._pending = null; // exec の y/N 待ち
    this._sugg = { candidates: [], token: "" };
    this._sel = 0;
    this._welcomed = false;

    this.ctx = {
      history: this.history,
      settings: this.settings,
      reset: () => this._reset(),
    };

    this._build();
    this._bind();
  }

  /* ---------- DOM 構築 ---------- */
  _build() {
    const el = document.createElement("div");
    el.className = "term";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "hurarunium terminal");
    el.innerHTML = `
      <div class="term__bar">
        <span class="term__title">// hurarunium.terminal ${VERSION}</span>
        <button class="term__close" type="button" aria-label="閉じる">[x]</button>
      </div>
      <div class="term__log" role="log" aria-live="polite"></div>
      <div class="term__inputline">
        <div class="term__suggest" role="listbox" aria-label="候補"></div>
        <span class="term__prompt">&gt;</span>
        <span class="term__field-wrap">
          <input class="term__field" type="text" autocomplete="off" autocapitalize="off"
                 autocorrect="off" spellcheck="false" aria-label="コマンド入力" />
          <span class="term__mirror" aria-hidden="true"></span>
          <span class="term__ghost" aria-hidden="true"></span>
        </span>
      </div>`;
    document.body.appendChild(el);

    this.root = el;
    this.logEl = el.querySelector(".term__log");
    this.field = el.querySelector(".term__field");
    this.mirror = el.querySelector(".term__mirror");
    this.ghost = el.querySelector(".term__ghost");
    this.suggestEl = el.querySelector(".term__suggest");
    el.querySelector(".term__close").addEventListener("click", () => this.close());
    el.addEventListener("pointerdown", (e) => {
      if (e.target !== this.field && !e.target.closest(".term__suggest")) {
        setTimeout(() => this.field.focus(), 0);
      }
    });

    // 候補のクリック確定 / ホバー選択
    this.suggestEl.addEventListener("pointerdown", (e) => {
      const item = e.target.closest(".term__suggest-item");
      if (!item) return;
      e.preventDefault(); // フォーカスを奪わない
      this._sel = Number(item.dataset.index);
      this._acceptSuggestion();
      this.field.focus();
    });
    this.suggestEl.addEventListener("pointermove", (e) => {
      const item = e.target.closest(".term__suggest-item");
      if (!item) return;
      const i = Number(item.dataset.index);
      if (i !== this._sel) {
        this._sel = i;
        this._refresh();
      }
    });

    this._bindDrag(el.querySelector(".term__bar"));
  }

  /** ヘッダーをドラッグしてパレットを自由に移動できるようにする */
  _bindDrag(bar) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    const onMove = (e) => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - this.root.offsetWidth;
      const maxTop = window.innerHeight - this.root.offsetHeight;
      const left = Math.min(Math.max(0, startLeft + (e.clientX - startX)), Math.max(0, maxLeft));
      const top = Math.min(Math.max(0, startTop + (e.clientY - startY)), Math.max(0, maxTop));
      this.root.style.left = `${left}px`;
      this.root.style.top = `${top}px`;
    };
    const onUp = () => {
      dragging = false;
      this.root.classList.remove("is-dragging");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    bar.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".term__close")) return;
      const rect = this.root.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      // 初回ドラッグで中央寄せ(left:50%+transform)から絶対座標へ切り替える
      this.root.style.left = `${rect.left}px`;
      this.root.style.top = `${rect.top}px`;
      this.root.style.transform = "none";
      dragging = true;
      this.root.classList.add("is-dragging");
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      e.preventDefault();
    });
  }

  _bind() {
    this.field.addEventListener("input", () => this._onInput());
    this.field.addEventListener("keydown", (e) => this._onKey(e));
  }

  /* ---------- 開閉 ---------- */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.root.classList.add("is-open");
    if (!this._welcomed) {
      this._welcomed = true;
      this.print([`[INFO] hurarunium.terminal ${VERSION}`, `[INFO] type 'help' to begin.`]);
    }
    setTimeout(() => this.field.focus(), 0);
  }
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.root.classList.remove("is-open");
    this.field.blur();
  }
  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  /* ---------- 入力 / 補完 ---------- */
  _onInput() {
    this._sel = 0;
    this._refresh();
  }

  /** 候補・ゴースト・ドロップダウンをまとめて更新 */
  _refresh() {
    const val = this.field.value;
    this._sugg = suggest(val);
    const { candidates, token, index } = this._sugg;
    if (this._sel >= candidates.length) this._sel = 0;

    // 空入力（まだ何も打っていない）では候補を出さない
    const show = candidates.length > 0 && !(index === 0 && token === "");

    // インライン・ゴースト
    this.mirror.textContent = val;
    if (show) {
      this.ghost.textContent = candidates[this._sel].name.slice(token.length);
      this.ghost.style.left = this.mirror.offsetWidth + "px";
    } else {
      this.ghost.textContent = "";
    }

    // ドロップダウン
    this._showSuggest = show;
    if (show) {
      this.suggestEl.innerHTML = candidates
        .map(
          (c, i) => `
        <div class="term__suggest-item${i === this._sel ? " is-active" : ""}" data-index="${i}" role="option">
          <span class="term__suggest-name">${c.name}</span>
          <span class="term__suggest-desc">${c.desc ?? ""}</span>
        </div>`
        )
        .join("");
      this.suggestEl.classList.add("is-open");
      this.suggestEl
        .querySelector(".term__suggest-item.is-active")
        ?.scrollIntoView({ block: "nearest" });
    } else {
      this.suggestEl.classList.remove("is-open");
      this.suggestEl.innerHTML = "";
    }
  }

  /** 選択中の候補を入力に確定 */
  _acceptSuggestion() {
    const { candidates } = this._sugg;
    if (!this._showSuggest || !candidates.length) return false;
    this.field.value = applyCandidate(this._sugg, candidates[this._sel].name);
    this._sel = 0;
    this._refresh();
    const n = this.field.value.length;
    this.field.setSelectionRange(n, n);
    return true;
  }

  _onKey(e) {
    // 描画中: Enter で全表示スキップ、その他のコマンド実行は抑止
    if (this.animating) {
      if (e.key === "Enter") {
        e.preventDefault();
        this._skip = true;
      }
      return;
    }

    if (e.key === "Enter") {
      // Enter は常にコマンド実行（候補確定はしない＝ターミナルらしく）
      e.preventDefault();
      const val = this.field.value;
      this.field.value = "";
      this._refresh();
      this._submit(val);
      return;
    }

    // Tab / →（行末）で候補を確定
    if (e.key === "Tab") {
      e.preventDefault();
      this._acceptSuggestion();
      return;
    }
    if (e.key === "ArrowRight") {
      if (this._showSuggest && this.field.selectionStart === this.field.value.length) {
        e.preventDefault();
        this._acceptSuggestion();
      }
      return;
    }

    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const { candidates } = this._sugg;
      if (this._showSuggest && candidates.length > 1) {
        // 候補リストを移動
        e.preventDefault();
        const dir = e.key === "ArrowDown" ? 1 : -1;
        this._sel = (this._sel + dir + candidates.length) % candidates.length;
        this._refresh();
      } else {
        // 履歴呼び出し
        e.preventDefault();
        this._recallHistory(e.key === "ArrowUp" ? -1 : 1);
      }
      return;
    }
  }

  _recallHistory(dir) {
    if (!this.history.length) return;
    this._histIndex = Math.max(0, Math.min(this.history.length, this._histIndex + dir));
    this.field.value = this.history[this._histIndex] ?? "";
    this._refresh();
    // カーソルを末尾へ
    const n = this.field.value.length;
    this.field.setSelectionRange(n, n);
  }

  /* ---------- 実行 ---------- */
  _submit(value) {
    this._echo(value);

    // exec の y/N 待ち
    if (this._pending) {
      const fn = this._pending;
      this._pending = null;
      if (value.trim().toLowerCase() === "y") this._run(fn());
      else this.print([`[INFO] Cancelled.`]);
      return;
    }

    if (!value.trim()) return;
    this.history.push(value);
    this._histIndex = this.history.length;

    const parsed = parse(value);
    if (parsed.type === "empty") return;
    if (parsed.type === "error") {
      this.print(parsed.lines);
      return;
    }
    onTerminalCommand(parsed.verb, parsed.target);
    this._run(execute(parsed, this.ctx));
  }

  _run(result) {
    if (!result) return;
    if (result.clear) this.clearLog();
    if (result.effect) {
      try {
        result.effect();
      } catch (err) {
        console.warn("[terminal] effect error", err);
      }
    }
    const after = () => {
      if (result.await === "confirm") this._pending = result.onConfirm;
    };
    if (result.lines && result.lines.length) this.print(result.lines).then(after);
    else after();
  }

  /* ---------- 出力 ---------- */
  _echo(value) {
    this._addLine(`> ${value}`, "term--echo").textContent = `> ${value}`;
    this._scroll();
  }

  _addLine(text, extra) {
    const div = document.createElement("div");
    div.className = "term__line";
    const tag = tagOf(text);
    if (tag && TAG_CLASS[tag]) div.classList.add(TAG_CLASS[tag]);
    if (extra) div.classList.add(extra);
    this.logEl.appendChild(div);
    return div;
  }

  /** タイプライターで複数行を順に表示。Promise を返す。 */
  print(lines) {
    this.animating = true;
    this._skip = false;
    const run = async () => {
      for (const line of lines) {
        const el = this._addLine(line);
        await this._typeInto(el, line);
        this._scroll();
      }
      this.animating = false;
    };
    return run();
  }

  _typeInto(el, text) {
    return new Promise((resolve) => {
      const speed = speedFor(text);
      let i = 0;
      const step = () => {
        if (this._skip) {
          el.textContent = text;
          return resolve();
        }
        el.textContent = text.slice(0, i);
        if (i++ < text.length) {
          this._timer = setTimeout(step, speed);
        } else {
          resolve();
        }
      };
      step();
    });
  }

  clearLog() {
    this.logEl.innerHTML = "";
  }

  _scroll() {
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  _reset() {
    this.clearLog();
    this.history.length = 0;
    this._histIndex = 0;
    for (const k of Object.keys(this.settings)) delete this.settings[k];
  }
}
