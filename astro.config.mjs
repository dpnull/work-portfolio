// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output; Cloudflare Pages serves dist/. No adapter needed.
export default defineConfig({
  site: 'https://work.dpy2k.com',
  output: 'static',
  trailingSlash: 'never',
  // Inline CSS applies the instant Astro swaps a page in. Linked sheets load after
  // the view transition captures, so the new page flashed unstyled mid-morph.
  build: { format: 'file', inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
  },
});
