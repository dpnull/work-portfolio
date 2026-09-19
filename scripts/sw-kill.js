/* KILL SWITCH for the service worker. Not served as-is: `SW_KILL=1 npx astro build`
   makes scripts/sw-manifest.mjs write this file to dist/sw.js in place of public/sw.js.

   Browsers re-fetch /sw.js, bypassing the old worker, whenever a page registers it. This
   replacement has no fetch handler, so the moment it activates every request goes to the
   network again; it then deletes the caches and removes itself. Keep it deployed until
   returning visitors have picked it up. Never delete /sw.js instead: a 404 leaves the
   installed worker running. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('dpy2k-')) await caches.delete(key);
    await self.registration.unregister();
  })());
});
