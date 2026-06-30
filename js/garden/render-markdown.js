/* =============================================================
   render-markdown.js — Markdown文字列をHTMLに変換する薄いラッパー
   marked は CDN(esm.sh) から importmap 経由で読み込む（庭ページのみ）。
   ============================================================= */

import { marked } from "marked";

marked.setOptions({ breaks: true });

export function renderMarkdown(mdString) {
  return marked.parse(mdString ?? "");
}
