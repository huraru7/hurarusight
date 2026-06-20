/* =============================================================
   state.js — 断片収集の永続化・解放ロジック
   localStorage["hurarunium.fragments"] = { unlocked, collected:[...], stage }
   ・unlocked  … `unlock achievement` で true になるまで断片は無反応
   ・collected … 解放済み断片 id の配列
   ・stage     … 0/1/2/3（1件以上→1, 3件以上→2, 7件→3）
   ============================================================= */

import { TOTAL, fragmentById } from "../../data/hidden/fragments.js";
import { showToast } from "./toast.js";

const KEY = "hurarunium.fragments";
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { unlocked: false, collected: [], stage: 0 };
    const parsed = JSON.parse(raw);
    return {
      unlocked: !!parsed.unlocked,
      collected: Array.isArray(parsed.collected) ? parsed.collected : [],
      stage: Number(parsed.stage) || 0,
    };
  } catch {
    return { unlocked: false, collected: [], stage: 0 };
  }
}

let state = load();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const fn of listeners) fn(state);
}

function stageFor(count) {
  if (count >= TOTAL) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function activateSystem() {
  if (state.unlocked) return;
  state = { ...state, unlocked: true };
  save();
}

/** 断片収集の状態を初期化する（`exec reset fragments`） */
export function resetFragments() {
  state = { unlocked: false, collected: [], stage: 0 };
  save();
}

export function unlockFragment(id) {
  if (!state.unlocked) return; // システム未解放なら無反応
  if (state.collected.includes(id)) return; // 既収集なら無視

  const collected = [...state.collected, id];
  state = { ...state, collected, stage: stageFor(collected.length) };
  save();

  const fragment = fragmentById(id);
  showToast(fragment);

  const terminal = window.hurarunium?.terminal;
  if (terminal?.isOpen) {
    terminal.print([`[CLASSIFIED] fragment detected. [${collected.length}/${TOTAL}]`]);
  }
}
