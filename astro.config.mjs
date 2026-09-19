// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { serviceWorker, swKilled } from './scripts/sw-manifest.mjs';

// Static output; Cloudflare Pages serves dist/. No adapter needed.
export default defineConfig({
  site: 'https://work.dpy2k.com',
  output: 'static',
  trailingSlash: 'never',
  // Inline CSS applies the instant Astro swaps a page in. Linked sheets load after
  // the view transition captures, so the new page flashed unstyled mid-morph.
  build: { format: 'file', inlineStylesheets: 'always' },
  // ClientRouter's hover prefetch only re-requests HTML that portfolio-preload.ts already
  // holds in memory (measured: a second /ugc request on every return to the cover).
  prefetch: false,
  // Fills in dist/sw.js after the build. Kill switch: SW_KILL=1, see public/sw.js.
  integrations: [serviceWorker()],
  vite: {
    plugins: [tailwindcss()],
    define: { __SW_KILL__: JSON.stringify(swKilled) },
  },
});
