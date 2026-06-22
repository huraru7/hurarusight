/* =============================================================
   themes/index.js — テーマの一覧（レジストリ）
   ★ 新しいテーマを追加するときは、ここに import と1行追加するだけでOK。
   ============================================================= */

import { theme as forest } from "./forest.js";

export const THEMES = {
  forest,
};

export const THEME_IDS = Object.keys(THEMES);

export function getTheme(id) {
  return THEMES[id] ?? null;
}
