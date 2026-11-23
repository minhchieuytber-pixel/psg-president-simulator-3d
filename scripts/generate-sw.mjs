import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else out.push('./' + path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
}
const assets = await walk(root);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const version = `${pkg.version}-${Date.now()}`;
const source = `// Generated during build: every production asset is precached for offline play.\nconst CACHE_NAME = 'psg-president-offline-${version}';\nconst ASSETS = ${JSON.stringify(assets, null, 2)};\nconst BASE_URL = new URL('./', self.registration.scope);\n\nself.addEventListener('install', (event) => {\n  event.waitUntil((async () => {\n    const cache = await caches.open(CACHE_NAME);\n    const urls = ASSETS.map((asset) => new URL(asset, BASE_URL).href);\n    await cache.addAll(urls);\n    await self.skipWaiting();\n  })());\n});\n\nself.addEventListener('activate', (event) => {\n  event.waitUntil((async () => {\n    const keys = await caches.keys();\n    await Promise.all(keys.filter((key) => key.startsWith('psg-president-offline-') && key !== CACHE_NAME).map((key) => caches.delete(key)));\n    await self.clients.claim();\n  })());\n});\n\nself.addEventListener('fetch', (event) => {\n  const request = event.request;\n  const url = new URL(request.url);\n  if (request.method !== 'GET' || url.origin !== self.location.origin) return;\n  if (!url.href.startsWith(BASE_URL.href)) return;\n  event.respondWith((async () => {\n    const cache = await caches.open(CACHE_NAME);\n    const cached = await cache.match(request, { ignoreSearch: true });\n    if (cached) return cached;\n    try {\n      const response = await fetch(request);\n      if (response && response.ok) await cache.put(request, response.clone());\n      return response;\n    } catch (error) {\n      if (request.mode === 'navigate') {\n        const fallback = await cache.match(new URL('./index.html', BASE_URL).href);\n        if (fallback) return fallback;\n      }\n      throw error;\n    }\n  })());\n});\n`;
await writeFile(path.join(root, 'sw.js'), source);
console.log(`Generated offline service worker with ${assets.length} precached assets.`);
