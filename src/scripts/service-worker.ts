// Production only: a worker must never sit between the dev server and the page.
// What it caches, why, and the kill switch are documented at the top of public/sw.js.
declare const __SW_KILL__: boolean;

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const start = () => {
    if (__SW_KILL__) void navigator.serviceWorker.getRegistrations().then(all => all.forEach(one => void one.unregister())).catch(() => {});
    else void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      // Once a worker is active, have it fetch whatever it is still missing. Install itself
      // stays tiny because Chrome throttles an installing worker to three requests at a time.
      .then(() => navigator.serviceWorker.ready)
      .then(registration => registration.active?.postMessage({ fill: true }))
      .catch(() => {});
  };
  // After load, so installing and precaching never compete with the first paint.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
