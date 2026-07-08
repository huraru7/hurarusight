/* =============================================================
   render-markdown.js — Markdown文字列をHTMLに変換する薄いラッパー
   marked は CDN(esm.sh) から importmap 経由で読み込む（庭ページのみ）。
   ============================================================= */

import { marked } from "marked";

marked.setOptions({ breaks: true });

export function renderMarkdown(mdString) {
  return marked.parse(mdString ?? "");
}

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

/* Markdown記法を除去し、プレーンテキストの最初の一文（句点まで）または冒頭maxLength文字を切り出す（カードプレビュー用） */
export function toPlainPreview(markdown, maxLength = 100) {
  const plain = (markdown ?? "")
    .replace(/^#+\s/gm, "")
    .replace(/^[-*•]\s/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\[(.+?)\]\(.+?\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  const firstSentenceMatch = plain.match(/^.*?[。！？!?](?=\s|$)/);
  const firstSentence = firstSentenceMatch ? firstSentenceMatch[0] : plain;
  return escapeHtml(firstSentence.slice(0, maxLength));
}
