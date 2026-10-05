import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// URLだけの行(段落)を、リンク先のOGP情報から作ったカードに置き換える remark プラグイン。
// 取得に失敗した場合は何もせず、通常のリンクのまま残す。

interface Ogp {
  title: string;
  description: string;
  image: string;
  siteName: string;
  favicon: string;
}

const CACHE_PATH = '.cache/ogp.json';
const FETCH_TIMEOUT_MS = 8000;

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

let cache: Record<string, Ogp> | null = null;

async function loadCache(): Promise<Record<string, Ogp>> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await readFile(CACHE_PATH, 'utf-8'));
  } catch {
    cache = {};
  }
  return cache!;
}

async function saveCache() {
  await mkdir(dirname(CACHE_PATH), { recursive: true });
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// <meta property="og:xxx" content="..."> を、属性の並び順に関わらず拾う
function readMeta(head: string, key: string): string {
  for (const tag of head.match(/<meta\s[^>]*>/gi) ?? []) {
    const name = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== key) continue;
    const content = /content\s*=\s*"([^"]*)"|content\s*=\s*'([^']*)'/i.exec(tag);
    const value = content?.[1] ?? content?.[2];
    if (value) return decodeEntities(value.trim());
  }
  return '';
}

async function fetchOgp(url: string): Promise<Ogp | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; hurarusight-linkcard)' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const head = html.slice(0, html.search(/<\/head>/i) + 7 || 200_000);

    const title =
      readMeta(head, 'og:title') ||
      decodeEntities(/<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1]?.trim() ?? '');
    if (!title) return null;

    const origin = new URL(url).origin;
    const image = readMeta(head, 'og:image');
    return {
      title,
      description: readMeta(head, 'og:description') || readMeta(head, 'description'),
      image: image ? new URL(image, url).href : '',
      siteName: readMeta(head, 'og:site_name') || new URL(url).hostname,
      favicon: `${origin}/favicon.ico`,
    };
  } catch {
    return null;
  }
}

function renderCard(url: string, o: Ogp): string {
  const thumb = o.image
    ? `<span class="link-card__thumb"><img src="${escapeHtml(o.image)}" alt="" loading="lazy" /></span>`
    : '';
  const desc = o.description ? `<span class="link-card__desc">${escapeHtml(o.description)}</span>` : '';
  return (
    `<a class="link-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">` +
    `<span class="link-card__body">` +
    `<span class="link-card__title">${escapeHtml(o.title)}</span>` +
    desc +
    `<span class="link-card__site"><img src="${escapeHtml(o.favicon)}" alt="" width="16" height="16" loading="lazy" onerror="this.remove()" />${escapeHtml(o.siteName)}</span>` +
    `</span>${thumb}</a>`
  );
}

// 段落が「URLだけ」なら、そのURLを返す
function soleUrl(node: any): string | null {
  if (node.type !== 'paragraph' || node.children.length !== 1) return null;
  const child = node.children[0];
  const isBareLink =
    child.type === 'link' && child.children.length === 1 && child.children[0].value === child.url;
  const url = isBareLink ? child.url : null;
  return url && /^https?:\/\//.test(url) ? url : null;
}

async function transform(node: any, store: Record<string, Ogp>) {
  const children = node.children;
  if (!Array.isArray(children)) return;
  for (let i = 0; i < children.length; i++) {
    const url = soleUrl(children[i]);
    if (url) {
      let ogp = store[url];
      if (!ogp) {
        const fetched = await fetchOgp(url);
        if (fetched) {
          ogp = store[url] = fetched;
          await saveCache();
        }
      }
      if (ogp) children[i] = { type: 'html', value: renderCard(url, ogp) };
    } else {
      await transform(children[i], store);
    }
  }
}

export default function remarkLinkCard() {
  return async (tree: any) => {
    await transform(tree, await loadCache());
  };
}
