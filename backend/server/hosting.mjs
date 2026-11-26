import { createHash, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json' };
const digest = (s) => createHash('sha256').update(s).digest();
export function hosting({ directory, password }) {
  if (!directory || !password || password.length < 12) throw new Error('Hosted demo requires STATIC_DIR and DEMO_PASSWORD (at least 12 characters).');
  const root = resolve(directory);
  const expected = digest('demo:' + password);
  function authorized(req, res) {
    const h = req.headers.authorization || '';
    const supplied = h.startsWith('Basic ') ? Buffer.from(h.slice(6), 'base64').toString('utf8') : '';
    if (timingSafeEqual(digest(supplied), expected)) return true;
    res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="InsureFlow demo", charset="UTF-8"', 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Enter the demo access credentials.');
    return false;
  }
  async function serve(req, res, path) {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    try {
      const decoded = decodeURIComponent(path);
      if (decoded.includes('\\') || decoded.includes('\0')) { res.writeHead(400); res.end(); return; }
      let file = resolve(root, '.' + decoded);
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
      let found = await stat(file).then(s => s.isFile()).catch(() => false);
      if (!found) {
        if (extname(decoded) || decoded.startsWith('/assets/')) { res.writeHead(404); res.end(); return; }
        file = resolve(root, 'index.html');
      }
      const data = await readFile(file);
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch { res.writeHead(404); res.end(); }
  }
  return { authorized, serve };
}
