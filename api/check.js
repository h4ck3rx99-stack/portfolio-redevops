// Vercel serverless function: GET /api/check?url=https://example.com
// Fetches a public web page server-side and returns ONLY the quick-check results
// (never the page content), so it can't be used as an open proxy.
// Guards: http(s) on default ports only, public IPs only (checked on every redirect hop),
// 8 s timeout, 1.5 MB read cap, HTML responses only.
const dns = require('node:dns').promises;
const net = require('node:net');

const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_HOPS = 3;

function isPrivateIp(ip) {
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
            || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
    }
    const v = ip.toLowerCase();
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')
        || (v.startsWith('::ffff:') && isPrivateIp(v.slice(7)));
}

async function assertPublic(u) {
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http(s) addresses');
    if (u.port && !['80', '443'].includes(u.port)) throw new Error('Only standard web ports');
    if (u.username || u.password) throw new Error('No credentials in URLs');
    const addrs = net.isIP(u.hostname) ? [{ address: u.hostname }] : await dns.lookup(u.hostname, { all: true });
    if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error('That address is not public');
}

async function fetchHtml(start) {
    let url = new URL(start);
    for (let hop = 0; hop <= MAX_HOPS; hop++) {
        await assertPublic(url);
        const res = await fetch(url, {
            redirect: 'manual',
            signal: AbortSignal.timeout(8000),
            headers: { 'user-agent': 'RE Dev Ops quick check (+https://www.redevops.in)', accept: 'text/html' },
        });
        if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
            url = new URL(res.headers.get('location'), url);
            continue;
        }
        if (!res.ok) throw new Error(`The site answered ${res.status}`);
        if (!/text\/html|application\/xhtml/i.test(res.headers.get('content-type') || '')) throw new Error('That address is not a web page');
        const reader = res.body.getReader();
        const chunks = [];
        let size = 0;
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > MAX_BYTES) { reader.cancel(); break; }
            chunks.push(value);
        }
        return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: url.href, bytes: size };
    }
    throw new Error('Too many redirects');
}

// Lightweight HTML reading on the server (no DOM). Handles quoted and unquoted attributes.
const ATTR = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
function tags(html, name) {
    const out = [];
    const re = new RegExp(`<${name}\\b([^>]*)>`, 'gi');
    let m;
    while ((m = re.exec(html))) {
        const attrs = {};
        let a;
        ATTR.lastIndex = 0;
        while ((a = ATTR.exec(m[1]))) attrs[a[1].toLowerCase()] = a[2] ?? a[3] ?? a[4] ?? '';
        out.push(attrs);
    }
    return out;
}

// Mirrors js/site-check.js analyse().
function analyse(html, url, bytes) {
    const metas = tags(html, 'meta');
    const meta = (key, val) => metas.find((m) => (m[key] || '').toLowerCase() === val);
    const links = tags(html, 'link');
    const title = ((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '').replace(/\s+/g, ' ').trim();
    const desc = (meta('name', 'description')?.content || '').trim();
    const imgs = tags(html, 'img');
    const withAlt = imgs.filter((i) => 'alt' in i).length;
    const kb = bytes / 1024;
    const scripts = tags(html, 'script').filter((t) => t.src).length;
    const h1 = (html.match(/<h1[\s>]/gi) || []).length;
    const lang = (tags(html, 'html')[0] || {}).lang;
    const https = url.startsWith('https://');
    const mixed = https && /\s(?:src|href)\s*=\s*["']?http:\/\//i.test(html);
    const rel = (r) => links.some((l) => (l.rel || '').toLowerCase().split(/\s+/).includes(r));
    return {
        SEO: [
            { label: 'Page has a title', pass: title.length > 0, weight: 3 },
            { label: 'Title is a sensible length (10–65 characters)', pass: title.length >= 10 && title.length <= 65, weight: 1 },
            { label: 'Meta description for Google', pass: desc.length >= 50, weight: 2 },
            { label: 'Exactly one main heading (H1)', pass: h1 === 1, weight: 2 },
            { label: 'Social share preview (og:title / og:image)', pass: !!meta('property', 'og:image') && !!meta('property', 'og:title'), weight: 1 },
        ],
        Mobile: [
            { label: 'Set up for phone screens (viewport tag)', pass: !!meta('name', 'viewport'), weight: 4 },
            { label: 'Has an app icon for phones', pass: rel('icon') || rel('apple-touch-icon'), weight: 1 },
        ],
        Accessibility: [
            { label: 'Language is declared', pass: !!lang, weight: 2 },
            { label: 'Images have alt text', pass: imgs.length === 0 || withAlt / imgs.length >= 0.9, weight: 3 },
        ],
        Speed: [
            { label: `Page HTML is light (${Math.round(kb)} KB)`, pass: kb < 150, weight: 2 },
            { label: `Not too many scripts (${scripts})`, pass: scripts <= 15, weight: 2 },
        ],
        Security: [
            { label: 'Served over HTTPS', pass: https, weight: 4 },
            { label: 'No insecure (http://) files on a secure page', pass: !mixed, weight: 2 },
        ],
    };
}

module.exports = async (req, res) => {
    res.setHeader('cache-control', 's-maxage=600, stale-while-revalidate=3600');
    res.setHeader('x-content-type-options', 'nosniff');
    if (req.method !== 'GET') { res.statusCode = 405; return res.end(); }
    const raw = String((req.query && req.query.url) || new URL(req.url, 'http://x').searchParams.get('url') || '').slice(0, 2048);
    res.setHeader('content-type', 'application/json; charset=utf-8');
    try {
        const { html, finalUrl, bytes } = await fetchHtml(raw);
        res.statusCode = 200;
        res.end(JSON.stringify({ url: finalUrl, checks: analyse(html, finalUrl, bytes) }));
    } catch (e) {
        res.statusCode = 422;
        res.end(JSON.stringify({ error: e.message || 'Could not check that page' }));
    }
};

module.exports._test = { isPrivateIp, analyse };
