// Components work on ordinary loads and after an Astro document swap.
export function onPageReady(init: () => void | (() => void)) {
  let active = false;
  let cleanup: void | (() => void);
  const start = () => {
    if (active) return;
    active = true;
    cleanup = init();
  };
  document.addEventListener('astro:before-swap', () => {
    cleanup?.();
    cleanup = undefined;
    active = false;
  });
  document.addEventListener('astro:page-load', start);
  start();
}
