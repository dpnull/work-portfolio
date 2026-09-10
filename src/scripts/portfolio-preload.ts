import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';

// Keep this experiment bounded to the cover and its two portfolios.
const routes = new Set(['/covers/1', '/ugc', '/creative-tech']);
const pages = new Map<string, { expires: number; document: Promise<Document> }>();
const assets = new Map<string, Promise<void>>();
const pathOf = (url: URL) => url.pathname.replace(/\.html$/, '').replace(/\/$/, '');
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

function warmAsset(href: string, kind: 'style' | 'script' | 'image') {
  if (assets.has(href)) return assets.get(href)!;
  const ready = new Promise<void>((resolve) => {
    // A missing asset must never strand navigation.
    const timeout = window.setTimeout(resolve, 2500);
    const done = () => { window.clearTimeout(timeout); resolve(); };
    if (kind === 'image') {
      const image = new Image();
      image.src = href;
      void image.decode().then(done, done);
    } else {
      const hint = document.createElement('link');
      hint.rel = kind === 'script' ? 'modulepreload' : 'preload';
      if (kind === 'style') hint.as = 'style';
      hint.href = href;
      hint.addEventListener('load', done, { once: true });
      hint.addEventListener('error', done, { once: true });
      document.head.append(hint);
    }
  });
  assets.set(href, ready);
  return ready;
}

function prepare(url: URL) {
  const key = url.origin + url.pathname;
  const cached = pages.get(key);
  if (cached && cached.expires > Date.now()) return cached.document;
  const prepared = (async () => {
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
    // Only posters, never the full video files. Decode the shared photo first.
    for (const image of Array.from(next.querySelectorAll<HTMLImageElement>('img[src]')).slice(0, 6)) {
      const webp = image.closest('picture')?.querySelector('source[type="image/webp"]')?.getAttribute('srcset');
      const work = warmAsset(new URL(webp || image.getAttribute('src')!, key).href, 'image');
      if (image.hasAttribute('data-ugc-photo') || image.hasAttribute('data-tech-photo')) ready.push(work);
    }
    await Promise.all(ready);
    return next;
  })();
  pages.set(key, { expires: Date.now() + 300_000, document: prepared });
  void prepared.catch(() => pages.delete(key));
  return prepared;
}

function warmDestination() {
  if (saveData()) return;
  const current = pathOf(new URL(location.href));
  if (!routes.has(current)) return;
  const targets = current === '/covers/1' ? ['/ugc', '/creative-tech'] : ['/covers/1'];
  for (const target of targets) void prepare(new URL(target, location.href)).catch(() => {});
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

// Begin on load, not hover. Reuse the same pending request if a click arrives early.
document.addEventListener('astro:page-load', warmDestination);
warmDestination();
