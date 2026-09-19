// Astro integration: after the build, write the precache list and a per-build cache version
// into dist/sw.js. What the worker does with them is documented at the top of public/sw.js.
import { createHash } from 'node:crypto';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// KILL SWITCH: `SW_KILL=1 npx astro build` ships scripts/sw-kill.js as /sw.js instead,
// and the pages unregister rather than register (src/scripts/service-worker.ts).
export const swKilled = Boolean(process.env.SW_KILL);

const documents = { '/': 'index.html', '/ugc': 'ugc.html', '/creative-tech': 'creative-tech.html' };
const placeholder = "const MANIFEST = { version: 'dev', documents: [], assets: [] };";
const video = /\.(?:mp4|m4v|mov|webm)$/i;
const cacheable = /\.(?:js|css|woff2|webp|avif|jpe?g|png|svg)$/i;

export function serviceWorker() {
  return {
    name: 'dpy2k-service-worker',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const target = path.join(out, 'sw.js');
        if (swKilled) {
          await copyFile(fileURLToPath(new URL('./sw-kill.js', import.meta.url)), target);
          logger.warn('SW_KILL is set: /sw.js is the unregistering worker.');
          return;
        }
        const entries = await readdir(out, { recursive: true, withFileTypes: true });
        const files = entries
          .filter(entry => entry.isFile() && !video.test(entry.name))
          .map(entry => path.relative(out, path.join(entry.parentPath, entry.name)).split(path.sep).join('/'))
          .filter(file => file !== 'sw.js')
          .sort();
        // Any change to any non-video file is a new cache, so cache-first can never pin a stale one.
        const hash = createHash('sha256');
        for (const file of files) hash.update(file).update(await readFile(path.join(out, file)));
        const version = hash.digest('hex').slice(0, 12);

        const known = new Set(files.map(file => `/${file}`));
        const assets = new Set(files.filter(file => file.startsWith('_astro/')).map(file => `/${file}`));
        for (const name of Object.values(documents)) {
          const html = await readFile(path.join(out, name), 'utf8');
          const found = [
            ...Array.from(html.matchAll(/\s(?:src|href|poster)="(\/[^"?#]+)"/g), match => match[1]),
            ...Array.from(html.matchAll(/url\((["']?)(\/[^"')?#]+)\1\)/g), match => match[2]),
            // A srcset with several candidates is left to the page, which knows the one this screen uses.
            ...Array.from(html.matchAll(/\ssrcset="([^"]+)"/g), match => match[1].split(','))
              .filter(candidates => candidates.length === 1)
              .map(candidates => candidates[0].trim().split(/\s+/)[0]),
          ];
          for (const url of found) {
            if (!known.has(url) || !cacheable.test(url)) continue;
            // Every browser with service workers worth caching for takes the WebP twin.
            if (/\.jpe?g$/i.test(url) && known.has(url.replace(/\.jpe?g$/i, '.webp'))) continue;
            assets.add(url);
          }
        }
        const manifest = { version, documents: Object.keys(documents), assets: [...assets].sort() };
        const source = await readFile(target, 'utf8');
        if (!source.includes(placeholder)) throw new Error('public/sw.js: MANIFEST placeholder not found');
        await writeFile(target, source.replace(placeholder, `const MANIFEST = ${JSON.stringify(manifest)};`));
        logger.info(`sw.js ${version}: ${manifest.documents.length} documents, ${manifest.assets.length} assets precached`);
      },
    },
  };
}
