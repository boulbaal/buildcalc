// Tiny static server for tests/local preview. Mimics Cloudflare Static Assets:
// /dir/ -> /dir/index.html, unknown path -> nearest 404.html with status 404.
// Usage: node tools/serve.mjs [port]   (serves ./public)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public');
const PORT = Number(process.argv[2] || process.env.PORT || 8790);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.xml': 'application/xml', '.txt': 'text/plain', '.woff2': 'font/woff2', '.json': 'application/json' };

function nearest404(urlPath) {
  let dir = path.join(ROOT, path.dirname(urlPath.endsWith('/') ? urlPath + 'x' : urlPath));
  while (dir.startsWith(ROOT)) {
    const f = path.join(dir, '404.html');
    if (fs.existsSync(f)) return f;
    if (dir === ROOT) break;
    dir = path.dirname(dir);
  }
  return null;
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = path.join(ROOT, urlPath);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    if (!urlPath.endsWith('/')) { res.writeHead(301, { Location: urlPath + '/' }); return res.end(); }
    file = path.join(file, 'index.html');
  }
  if (fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  const nf = nearest404(urlPath);
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(nf ? fs.readFileSync(nf) : 'Not found');
}).listen(PORT, () => console.log(`Serving public/ on http://localhost:${PORT}`));
