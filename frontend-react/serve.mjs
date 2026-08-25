/* Servidor estático mínimo para el build de producción (SPA con fallback a index.html).
   Sin dependencias externas. Uso: PORT=4100 node serve.mjs */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), 'dist');
const PORT = process.env.PORT || 4100;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

async function send(res, file, status = 200) {
  const data = await readFile(file);
  const ext = extname(file);
  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' || file.endsWith('sw.js') || file.endsWith('manifest.json')
      ? 'no-cache'
      : file.match(/icon-|favicon|copito-avatar|apple-touch/)
        ? 'public, max-age=3600'
        : 'public, max-age=31536000',
  });
  res.end(data);
}

http
  .createServer(async (req, res) => {
    try {
      const url = decodeURIComponent((req.url || '/').split('?')[0]);
      let path = normalize(join(DIST, url));
      if (!path.startsWith(DIST)) return res.writeHead(403).end('Forbidden');

      try {
        const s = await stat(path);
        if (s.isDirectory()) path = join(path, 'index.html');
        await send(res, path);
        return;
      } catch {
        // Fallback SPA: si no es un archivo, servir index.html (rutas de React Router)
        if (!extname(url)) {
          await send(res, join(DIST, 'index.html'));
          return;
        }
        res.writeHead(404).end('Not found');
      }
    } catch (err) {
      res.writeHead(500).end('Server error');
    }
  })
  .listen(PORT, () => console.log(`Fresh Service frontend en http://localhost:${PORT}`));
