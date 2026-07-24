/* =============================================================
   format.js — 表示用フォーマット関数
   ============================================================= */

/** 手入れ回数を5つ区切りのティック表記に（例: 8 → "¦¦¦¦¦ ¦¦¦"） */
export function formatTicks(n) {
  if (n <= 0) return "";
  const groups = [];
  let remaining = n;
  while (remaining > 0) {
    const groupSize = Math.min(5, remaining);
    groups.push("¦".repeat(groupSize));
    remaining -= groupSize;
  }
  return groups.join(" ");
}

/** ISO日付文字列 → 相対表示（例: "今日" / "5日前" / "3ヶ月前" / "1年前"） */
export function formatDateRelative(isoString) {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "今日";
  if (diffDays < 30) return `${diffDays}日前`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}ヶ月前`;
  return `${Math.floor(diffMonths / 12)}年前`;
}
