// "2026-10-05" → "2026/10/05"
export function formatDate(iso: string): string {
  return iso.replaceAll('-', '/');
}
