# work.dpy2k.com

Portfolio site. Astro 7 + Tailwind 4, static output, deployed to Cloudflare Pages.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run check    # type/template check
```

## Where things live
- `src/styles/global.css` — **all design tokens** (`@theme`). Nothing else hardcodes a colour, font or radius.
- `src/data/clips.json` — every clip: Mux playback ID, 3-part label, ready flag.
- `src/layouts/Base.astro` — meta, OG, analytics slot. `NOINDEX` is `true` until the custom domain is live.
- `public/_headers` — Cloudflare Pages caching + security headers.

## Deploy
Cloudflare Pages, build command `npm run build`, output directory `dist`, Node 24.
