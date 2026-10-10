// 本地预览服务器：行为尽量和 Cloudflare Pages 一致（/bolt 自动对应 bolt.html）
// 用法：node scripts/serve.mjs [端口]，默认 8780
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PORT = Number(process.argv[2]) || 8780;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };

async function resolve(pathname) {
  const rel = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  if (rel.startsWith('..')) return null;
  const base = join(ROOT, rel);
  for (const p of [base, join(base, 'index.html'), base + '.html']) {
    try { if ((await stat(p)).isFile()) return p; } catch { /* 试下一个 */ }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolve(new URL(req.url, 'http://x').pathname);
  if (!file) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); res.end('404'); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(await readFile(file));
}).listen(PORT, '127.0.0.1', () => console.log(`本地预览：http://localhost:${PORT}`));
