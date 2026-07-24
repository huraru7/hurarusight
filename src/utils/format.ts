export function formatTicks(n: number): string {
  if (n <= 0) return '';
  const groups: string[] = [];
  let rem = n;
  while (rem > 0) {
    groups.push('¦'.repeat(Math.min(5, rem)));
    rem -= Math.min(5, rem);
  }
  return groups.join(' ');
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}
