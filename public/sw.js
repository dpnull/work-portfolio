/* Service worker for work.dpy2k.com. Hand-written, no dependencies.

   WHY IT EXISTS. The live host (custom-domains.chatgpt.site) ignores public/_headers and
   sends `max-age=0, must-revalidate` on every file, so a warmed font, poster or script
   still costs one round trip each time it is used. This worker keeps one cache per build
   and answers from it, which is the only mechanism that host cannot undo.

   WHAT IT DOES
   - precaches the cover, /ugc and /creative-tech at install, then their scripts, fonts and
     single-candidate images once active (MANIFEST is written by scripts/sw-manifest.mjs at
     build). Nothing is fetched ahead of need when the visitor has Save-Data on.
   - documents: stale-while-revalidate, those three routes only. A deploy is picked up in the
     background, so HTML is never stale for more than one visit. Other routes are not touched.
   - scripts, styles, fonts, images: cache-first. The cache name carries a hash of every
     non-video file in the build, so any deploy that changes anything starts a fresh cache.
   - video and every Range request: never handled, never cached. The browser talks to the
     network exactly as if this file did not exist.
   - skipWaiting + clients.claim: a new build takes over at once and deletes older caches.

   KILL SWITCH. Build with `SW_KILL=1 npx astro build` and deploy. scripts/sw-manifest.mjs then
   ships scripts/sw-kill.js as /sw.js: it deletes every cache, unregisters itself and the
   pages stop registering a worker. Keep deploying it until old visitors have cycled through;
   never just delete /sw.js, because a 404 leaves installed workers running.
   Locally: DevTools > Application > Service workers > Unregister. */

const MANIFEST = { version: 'dev', documents: [], assets: [] };

const PREFIX = 'dpy2k-';
const CACHE = PREFIX + MANIFEST.version;
const DOCUMENTS = new Set(MANIFEST.documents);
const STATIC = /\.(?:js|css|woff2|webp|avif|jpe?g|png|svg)$/i;
const VIDEO = /\.(?:mp4|m4v|mov|webm)$/i;
const RECHECK_MS = 60_000;
const checked = new Map();

const pathOf = url => url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

// Fingerprinted files can come from the HTTP cache; everything else is revalidated so a
// replaced image under an old name never gets pinned into a new build's cache.
async function store(cache, url) {
  const response = await fetch(url, { cache: url.startsWith('/_astro/') ? 'default' : 'no-cache' });
  if (!response.ok || response.type !== 'basic') throw new Error(`${response.status} ${url}`);
  // A redirected response cannot answer a navigation; rebuild it without the flag.
  const clean = response.redirected ? new Response(await response.blob(), { status: 200, headers: response.headers }) : response;
  await cache.put(url, clean);
}

// Chrome lets an INSTALLING worker run only three requests at a time (measured: 23 files
// took 2.9s at 350ms RTT), so install takes just the three documents and the rest is
// fetched once the worker is active, when the page asks for it (`fill`, below).
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    if (!self.navigator.connection?.saveData) {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(MANIFEST.documents.map(url => store(cache, url)));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

// { fill: true } arrives from service-worker.ts on every load: fetch whatever of MANIFEST is
// still missing. Poster files picked from a srcset are not listed; they are cached the
// first time a page asks for them, which portfolio-preload.ts does while the visitor reads.
self.addEventListener('message', event => {
  if (!event.data?.fill || self.navigator.connection?.saveData) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(MANIFEST.assets.map(async url => (await cache.match(url)) || store(cache, url)));
  })());
});

async function documentResponse(event, path) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(path);
  if (!cached) {
    const response = await fetch(event.request);
    if (response.ok && response.type === 'basic' && !response.redirected) event.waitUntil(cache.put(path, response.clone()));
    return response;
  }
  if (Date.now() - (checked.get(path) ?? 0) > RECHECK_MS) {
    checked.set(path, Date.now());
    event.waitUntil(store(cache, path).catch(() => checked.delete(path)));
  }
  return cached;
}

async function staticResponse(event, url) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(url.pathname);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok && response.type === 'basic') event.waitUntil(cache.put(url.pathname, response.clone()));
  return response;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Video and ranged requests pass straight through, untouched.
  if (request.headers.has('range') || request.destination === 'video' || request.destination === 'audio' || VIDEO.test(url.pathname)) return;
  if (DOCUMENTS.has(pathOf(url))) event.respondWith(documentResponse(event, pathOf(url)));
  else if (STATIC.test(url.pathname) && !url.search) event.respondWith(staticResponse(event, url));
});
