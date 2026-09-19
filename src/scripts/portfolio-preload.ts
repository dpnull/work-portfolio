import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

// Keep this bounded to the cover and its two portfolios. Every one of them warms the others.
const covers = new Set(['/', '/covers/1']);
const portfolio = ['/', '/ugc', '/creative-tech'];
const routes = new Set([...covers, ...portfolio]);
// A prepared page is always usable at once; past this age it is also refetched behind the scenes.
const STALE_MS = 300_000;
// Images decoded ahead of time, in document order: the photograph and the first row of posters.
const DECODE_AHEAD = 6;

type Page = { fetched: number; document: Promise<Document>; refreshing: boolean };
type Picture = { src: string; srcset: string | null; sizes: string | null; eager: boolean };

const pages = new Map<string, Page>();
const assets = new Map<string, Promise<void>>();
// The host sends max-age=0, so Chrome revalidates any image nothing in the document still
// references: a dropped Image() cost one 304 round trip per poster after the swap.
// Holding the element keeps the fetched image reusable with no request at all.
const held = new Map<string, { image: HTMLImageElement; ready: Promise<void>; chosen: boolean }>();

const pathOf = (url: URL) => url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
const connection = () => (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
const saveData = () => connection()?.saveData === true;
const slow = () => /2g$/.test(connection()?.effectiveType ?? '');
const loaded = new Promise<void>(resolve => {
  if (document.readyState === 'complete') resolve();
  else window.addEventListener('load', () => resolve(), { once: true });
});

// A missing asset must never strand navigation.
function bounded(work: (done: () => void) => void) {
  return new Promise<void>(resolve => {
    const timeout = window.setTimeout(resolve, 2500);
    work(() => { window.clearTimeout(timeout); resolve(); });
  });
}

function warmAsset(href: string, kind: 'style' | 'script') {
  if (assets.has(href)) return assets.get(href)!;
  const ready = bounded(done => {
    const hint = document.createElement('link');
    hint.rel = kind === 'script' ? 'modulepreload' : 'preload';
    if (kind === 'style') hint.as = 'style';
    hint.href = href;
    hint.addEventListener('load', done, { once: true });
    hint.addEventListener('error', done, { once: true });
    document.head.append(hint);
  });
  assets.set(href, ready);
  return ready;
}

// Same srcset and sizes as the destination markup, so the browser picks the same file there.
const idOf = (picture: Picture) => `${picture.sizes ?? ''}|${picture.srcset ?? picture.src}`;
function warmImage(picture: Picture, base: string, decode: boolean) {
  const id = idOf(picture);
  const existing = held.get(id);
  if (existing) return existing.ready;
  const image = new Image();
  const ready = bounded(done => {
    const failed = () => { held.delete(id); done(); };
    image.decoding = 'async';
    if (!picture.eager) image.fetchPriority = 'low';
    if (picture.sizes) image.sizes = picture.sizes;
    if (picture.srcset) image.srcset = picture.srcset.split(',').map(candidate => {
      const [url, ...descriptor] = candidate.trim().split(/\s+/);
      return [new URL(url, base).href, ...descriptor].join(' ');
    }).join(', ');
    else image.src = new URL(picture.src, base).href;
    if (decode) void image.decode().then(done, failed);
    else { image.addEventListener('load', done, { once: true }); image.addEventListener('error', failed, { once: true }); }
  });
  held.set(id, { image, ready, chosen: picture.srcset !== null });
  return ready;
}

// Posters and photographs only. A <video> contributes its poster, never its file.
function picturesOf(next: Document) {
  const pictures: Picture[] = [];
  for (const node of next.querySelectorAll<HTMLImageElement | HTMLVideoElement>('img[src], video[poster]')) {
    if (node instanceof HTMLVideoElement) {
      pictures.push({ src: node.getAttribute('poster')!, srcset: null, sizes: null, eager: false });
      continue;
    }
    const webp = node.closest('picture')?.querySelector<HTMLSourceElement>('source[type="image/webp"]');
    pictures.push({
      src: node.getAttribute('src')!,
      srcset: webp?.getAttribute('srcset') ?? node.getAttribute('srcset'),
      sizes: webp?.getAttribute('sizes') ?? node.getAttribute('sizes'),
      // The morphing photograph and anything the page itself marks urgent gate the swap.
      eager: node.hasAttribute('data-ugc-photo') || node.hasAttribute('data-tech-photo') || node.getAttribute('fetchpriority') === 'high',
    });
  }
  return pictures;
}

async function load(key: string) {
  const response = await fetch(key, { signal: AbortSignal.timeout(8000) });
  if (!response.ok || response.redirected || !response.headers.get('content-type')?.includes('text/html')) {
    throw new Error('Portfolio preload unavailable');
  }
  const next = new DOMParser().parseFromString(await response.text(), 'text/html');
  if (!next.querySelector('[name="astro-view-transitions-enabled"]')) throw new Error('Not a portfolio route');
  next.querySelectorAll('noscript').forEach(node => node.remove());
  const ready: Promise<void>[] = [];
  for (const link of next.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
    ready.push(warmAsset(new URL(link.getAttribute('href')!, key).href, 'style'));
  }
  for (const script of next.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')) {
    void warmAsset(new URL(script.getAttribute('src')!, key).href, 'script');
  }
  for (const picture of picturesOf(next)) if (picture.eager) ready.push(warmImage(picture, key, true));
  warmRest(next, key);
  await Promise.all(ready);
  return next;
}

// Everything that does not gate the swap waits for this page's own load, goes out at low
// priority, and is skipped on 2G.
function warmRest(next: Document, key: string) {
  if (slow() || saveData()) return;
  void loaded.then(() => picturesOf(next).forEach((picture, index) => void warmImage(picture, key, picture.eager || index < DECODE_AHEAD)));
}

function prepare(url: URL) {
  const key = url.origin + url.pathname;
  const cached = pages.get(key);
  if (cached) {
    if (Date.now() - cached.fetched > STALE_MS && !cached.refreshing && !saveData()) {
      cached.refreshing = true;
      const fresh = load(key);
      fresh.then(() => pages.set(key, { fetched: Date.now(), document: fresh, refreshing: false }), () => { cached.refreshing = false; });
    }
    return cached.document;
  }
  const prepared = load(key);
  pages.set(key, { fetched: Date.now(), document: prepared, refreshing: false });
  void prepared.catch(() => pages.delete(key));
  return prepared;
}

function warmDestination() {
  if (saveData() || document.hidden) return;
  const current = pathOf(new URL(location.href));
  if (!routes.has(current)) return;
  for (const target of portfolio) {
    if (target === current || (target === '/' && covers.has(current))) continue;
    void prepare(new URL(target, location.href)).catch(() => {});
  }
}

document.addEventListener('astro:before-preparation', event => {
  const navigation = event as TransitionBeforePreparationEvent;
  if (navigation.formData || navigation.to.search || navigation.to.origin !== location.origin || !routes.has(pathOf(navigation.to))) return;
  const fallback = navigation.loader;
  navigation.loader = async () => {
    try {
      const prepared = await prepare(navigation.to);
      if (!navigation.signal.aborted) navigation.newDocument = prepared.cloneNode(true) as Document;
    } catch {
      if (!navigation.signal.aborted) await fallback();
    }
  };
});

// Chrome resolves a srcset differently once a service worker controls the page: without one it
// reuses a larger candidate that is already in memory, with one it goes by screen density.
// Measured on a first visit: posters warmed before the worker took over were the wrong files
// after it, and two tiles waited on the network. So srcset choices are made again under it.
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  for (const [id, entry] of held) if (entry.chosen) held.delete(id);
  for (const [key, page] of pages) void page.document.then(next => warmRest(next, key), () => {});
});

// Begin on load, not hover. Reuse the same pending request if a click arrives early.
document.addEventListener('astro:page-load', warmDestination);
// A tab left open for a while refreshes its prepared pages when it is looked at again.
document.addEventListener('visibilitychange', warmDestination);
warmDestination();
