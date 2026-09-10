import type { TransitionBeforePreparationEvent, TransitionBeforeSwapEvent } from 'astro:transitions/client';

type Position = { x: number; y: number };
const cover = '/covers/1';
const key = 'portfolio:cover-scroll';
const pathOf = (url: URL) => url.pathname.replace(/\.html$/, '').replace(/\/$/, '');
let lastCover: Position | null = null;
let returning: { traverse: boolean } | null = null;
try {
  const stored = JSON.parse(sessionStorage.getItem(key) || 'null');
  if (stored && Number.isFinite(stored.x) && Number.isFinite(stored.y)) lastCover = stored;
} catch { /* Storage is optional; navigation must still work. */ }

document.addEventListener('astro:before-preparation', event => {
  const navigation = event as TransitionBeforePreparationEvent;
  if (pathOf(navigation.from) !== cover || pathOf(navigation.to) === cover) return;
  lastCover = { x: window.scrollX, y: window.scrollY };
  try { sessionStorage.setItem(key, JSON.stringify(lastCover)); } catch { /* In-memory fallback. */ }
});

document.addEventListener('astro:before-swap', event => {
  const navigation = event as TransitionBeforeSwapEvent;
  returning = pathOf(navigation.to) === cover && !navigation.to.hash
    ? { traverse: navigation.navigationType === 'traverse' } : null;
});

// Runs inside Astro's view-transition update callback, after its history update
// but BEFORE the incoming snapshot/first paint. Never restore on page-load.
document.addEventListener('astro:after-swap', () => {
  if (!returning) return;
  const state = history.state;
  const position = returning.traverse && Number.isFinite(state?.scrollY)
    ? { x: Number.isFinite(state?.scrollX) ? state.scrollX : 0, y: state.scrollY }
    : lastCover;
  returning = null;
  if (!position) return;
  window.scrollTo({ left: position.x, top: position.y, behavior: 'instant' });
  history.replaceState({ ...state, scrollX: window.scrollX, scrollY: window.scrollY }, '');
});
