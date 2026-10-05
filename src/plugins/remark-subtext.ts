// 行頭の `-# ` で始まる行を、薄く小さい文字(サブテキスト)にする remark プラグイン。
// Discord の記法に合わせた、このサイト独自の拡張。
// 改行(remark-breaks で break になる)ごとに行を判定し、サブテキストの行だけを別の段落に分ける。

const MARK = /^-# /;

// 段落の子ノードを、break を区切りとして行ごとに分ける
function splitLines(children: any[]): any[][] {
  const lines: any[][] = [[]];
  for (const child of children) {
    if (child.type === 'break') lines.push([]);
    else lines[lines.length - 1].push(child);
  }
  return lines;
}

function isSubLine(line: any[]): boolean {
  return line[0]?.type === 'text' && MARK.test(line[0].value);
}

// 連続する同じ種類の行を、1つの段落にまとめる
function toParagraphs(paragraph: any): any[] {
  const lines = splitLines(paragraph.children);
  if (!lines.some(isSubLine)) return [paragraph];

  const result: any[] = [];
  let current: { sub: boolean; children: any[] } | null = null;
  for (const line of lines) {
    const sub = isSubLine(line);
    if (sub) line[0] = { ...line[0], value: line[0].value.replace(MARK, '') };
    if (current && current.sub === sub) {
      current.children.push({ type: 'break' }, ...line);
    } else {
      if (current) result.push(build(current));
      current = { sub, children: [...line] };
    }
  }
  if (current) result.push(build(current));
  return result;
}

function build({ sub, children }: { sub: boolean; children: any[] }) {
  return {
    type: 'paragraph',
    children,
    ...(sub && { data: { hProperties: { className: ['subtext'] } } }),
  };
}

function walk(node: any) {
  if (!Array.isArray(node.children)) return;
  node.children = node.children.flatMap((child: any) => {
    if (child.type === 'paragraph') return toParagraphs(child);
    walk(child);
    return [child];
  });
}

export default function remarkSubtext() {
  return (tree: any) => walk(tree);
}
