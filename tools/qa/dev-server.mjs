// Local preview server that also runs api/*.js like Vercel does.
// Usage (from repo root): node tools/qa/dev-server.mjs   → http://localhost:5510
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(import.meta.url);
const port = Number(process.env.PORT || 5510);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif',
    '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json' };

http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://localhost:${port}`);
    if (u.pathname.startsWith('/api/')) {
        const file = path.join(root, 'api', `${path.basename(u.pathname)}.js`);
        try {
            delete require.cache[file];
            req.query = Object.fromEntries(u.searchParams);
            return await require(file)(req, res);
        } catch { res.statusCode = 404; return res.end('not found'); }
    }
    let file = path.join(root, decodeURIComponent(u.pathname));
    if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); } catch { /* 404 below */ }
    try {
        const body = await readFile(file);
        res.setHeader('content-type', TYPES[path.extname(file)] || 'application/octet-stream');
        res.end(body);
    } catch {
        res.statusCode = 404;
        res.setHeader('content-type', TYPES['.html']);
        res.end(await readFile(path.join(root, '404.html')));
    }
}).listen(port, () => console.log(`dev server on http://localhost:${port}`));
