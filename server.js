/* Zero-dependency static server for Pollinations Prompt Studio.
 * Serves the folder and exposes /health. Run: node server.js
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8788;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

// Never served; keeps the repo clean.
const BLOCKED = new Set(['.db', '.env', '.log']);

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400); res.end('bad request'); return;
  }

  if (pathname === '/health' || pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, app: 'pollinations-prompt-studio', upstream: { models: 'https://gen.pollinations.ai/v1/models', image: 'https://gen.pollinations.ai/image/{prompt} (BYOP)' } }));
    return;
  }

  let filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  if (pathname.endsWith('/')) filePath = path.join(filePath, 'index.html');

  fs.stat(filePath, (err, stat) => {
    if (err || stat.isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('Not found');
      return;
    }
    if (BLOCKED.has(path.extname(filePath).toLowerCase())) {
      res.writeHead(403); res.end('forbidden'); return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Pollinations Prompt Studio → http://${HOST}:${PORT}`);
  console.log(`Press Ctrl+C to stop.`);
});
