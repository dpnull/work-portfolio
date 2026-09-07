// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output; Cloudflare Pages serves dist/. No adapter needed.
export default defineConfig({
  site: 'https://work.dpy2k.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    plugins: [tailwindcss()],
  },
});
