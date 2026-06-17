/* =============================================================
   index.js — ターミナルのエントリ
   コンソールを生成し、開閉トリガ（キー）を設置する。
     ` （バッククォート） / Cmd+K・Ctrl+K … トグル
     Escape … 閉じる
   ============================================================= */

import { Terminal } from "./console.js";

const terminal = new Terminal();

window.addEventListener("keydown", (e) => {
  if (e.isComposing) return; // 日本語入力中などは無視

  if (e.key === "`") {
    e.preventDefault();
    terminal.toggle();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
    e.preventDefault();
    terminal.toggle();
    return;
  }
  if (e.key === "Escape" && terminal.isOpen) {
    e.preventDefault();
    terminal.close();
  }
});

// デバッグ用に最小限だけ公開（中身のロジックは export しない）
window.hurarunium = window.hurarunium || {};
window.hurarunium.terminal = terminal;
