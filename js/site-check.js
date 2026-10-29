// Homepage "check your website" tool. Asks our own /api/check (Vercel function) first;
// falls back to public CORS proxies + in-browser analysis if the API isn't available.
// Scores only what the page's HTML shows. If nothing can fetch the page we say so;
// we never invent a score.
import { buildWhatsAppUrl } from './contact.js';

const PROXIES = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
];

export function normaliseUrl(input) {
    let v = String(input || '').trim();
    if (!v) return null;
    if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
    try {
        const u = new URL(v);
        if (!u.hostname.includes('.') || /^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname)) return null;
        return u.href;
    } catch {
        return null;
    }
}

// Pure: HTML string + url → categories of { label, pass, weight }.
export function analyse(html, url) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const q = (s) => doc.querySelector(s);
    const title = (q('title')?.textContent || '').trim();
    const desc = (q('meta[name="description" i]')?.getAttribute('content') || '').trim();
    const imgs = [...doc.querySelectorAll('img')];
    const withAlt = imgs.filter((i) => i.hasAttribute('alt')).length;
    const kb = new Blob([html]).size / 1024;
    const scripts = doc.querySelectorAll('script[src]').length;
    const https = url.startsWith('https://');
    const mixed = https && /\s(?:src|href)=["']http:\/\//i.test(html);

    return {
        SEO: [
            { label: 'Page has a title', pass: title.length > 0, weight: 3 },
            { label: 'Title is a sensible length (10–65 characters)', pass: title.length >= 10 && title.length <= 65, weight: 1 },
            { label: 'Meta description for Google', pass: desc.length >= 50, weight: 2 },
            { label: 'Exactly one main heading (H1)', pass: doc.querySelectorAll('h1').length === 1, weight: 2 },
            { label: 'Social share preview (og:title / og:image)', pass: !!q('meta[property="og:image"]') && !!q('meta[property="og:title"]'), weight: 1 },
        ],
        Mobile: [
            { label: 'Set up for phone screens (viewport tag)', pass: !!q('meta[name="viewport" i]'), weight: 4 },
            { label: 'Has an app icon for phones', pass: !!q('link[rel~="apple-touch-icon"], link[rel~="icon"]'), weight: 1 },
        ],
        Accessibility: [
            { label: 'Language is declared', pass: !!doc.documentElement.getAttribute('lang'), weight: 2 },
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

export function scoreOf(checks) {
    const all = Object.values(checks).flat();
    const total = all.reduce((a, c) => a + c.weight, 0);
    const got = all.filter((c) => c.pass).reduce((a, c) => a + c.weight, 0);
    const cat = Object.fromEntries(Object.entries(checks).map(([k, list]) => {
        const t = list.reduce((a, c) => a + c.weight, 0);
        return [k, Math.round((list.filter((c) => c.pass).reduce((a, c) => a + c.weight, 0) / t) * 100)];
    }));
    return { overall: Math.round((got / total) * 100), cat };
}

async function fetchHtml(url) {
    for (const p of PROXIES) {
        try {
            const res = await fetch(p(url), { signal: AbortSignal.timeout(10000) });
            if (!res.ok) continue;
            const text = await res.text();
            if (/<html|<head|<body/i.test(text)) return text;
        } catch { /* try next proxy */ }
    }
    return null;
}

export function initSiteCheck() {
    const root = document.querySelector('[data-site-check]');
    if (!root) return;
    const form = root.querySelector('form');
    const input = root.querySelector('input');
    const button = form.querySelector('button');
    const out = root.querySelector('[data-result]');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

    const countUp = (node, to) => {
        if (reduce) { node.textContent = to; return; }
        const start = performance.now();
        const step = (t) => {
            const p = Math.min(1, (t - start) / 900);
            node.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = normaliseUrl(input.value);
        out.replaceChildren();
        out.hidden = false;
        if (!url) {
            out.append(el('p', 'check__msg', 'Type a website address, like yourcafe.in'));
            input.focus();
            return;
        }
        button.disabled = true;
        button.textContent = 'Checking…';
        root.classList.add('is-busy');
        out.append(el('p', 'check__msg meta', `Reading ${new URL(url).hostname}…`));
        window.sendLead?.({ source: 'site-check', message: url });

        let checks = null;
        try {
            const res = await fetch(`/api/check?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(12000) });
            if (res.ok) checks = (await res.json()).checks;
        } catch { /* fall back below */ }
        if (!checks) {
            const html = await fetchHtml(url);
            if (html) checks = analyse(html, url);
        }
        button.disabled = false;
        button.textContent = 'Check it';
        root.classList.remove('is-busy');
        out.replaceChildren();

        if (!checks) {
            out.append(el('p', 'check__msg', "We couldn't reach that page from here (some sites block outside checks). Send it to us and we'll take a proper look."));
            const a = el('a', 'btn btn--primary', 'Ask us to check it ↗');
            a.href = buildWhatsAppUrl(`Hi! Can you check my website ${url}?`);
            a.target = '_blank'; a.rel = 'noopener';
            out.append(a);
            return;
        }

        const { overall, cat } = scoreOf(checks);
        const host = new URL(url).hostname;

        const head = el('div', 'check__head');
        const ring = el('div', 'check__ring');
        ring.style.setProperty('--p', overall);
        const num = el('span', 'check__num', '0');
        ring.append(num);
        const verdict = overall >= 85 ? 'Looking good' : overall >= 60 ? 'Room to improve' : 'Needs work';
        const htxt = el('div', 'check__htxt');
        htxt.append(el('p', 'meta', host), el('p', 'check__verdict', verdict));
        head.append(ring, htxt);

        const bars = el('ul', 'check__bars');
        Object.entries(cat).forEach(([name, v]) => {
            const li = el('li');
            const bar = el('span', 'check__bar');
            bar.style.setProperty('--v', reduce ? v : 0);
            li.append(el('span', 'meta', name), bar, el('span', 'check__v', `${v}`));
            bars.append(li);
            if (!reduce) requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--v', v)));
        });

        const fails = Object.values(checks).flat().filter((c) => !c.pass).sort((a, b) => b.weight - a.weight).slice(0, 3);
        const list = el('ul', 'check__fails');
        (fails.length ? fails : [{ label: 'Nothing obvious from the HTML — nice.' }]).forEach((f) => list.append(el('li', fails.length ? '' : 'is-ok', f.label)));

        const ctas = el('div', 'check__ctas');
        const fix = el('a', 'btn btn--primary', fails.length ? 'Fix these with us ↗' : 'Talk to us ↗');
        fix.href = buildWhatsAppUrl(`Hi! I checked ${host} on redevops.in and it scored ${overall}/100. Can you help improve it?`);
        fix.target = '_blank'; fix.rel = 'noopener';
        const full = el('a', 'text-link text-link--tap', 'Full report in SiteAudit Pro ↗');
        full.href = 'https://siteaudit.redevops.in/'; full.target = '_blank'; full.rel = 'noopener';
        ctas.append(fix, full);

        out.append(head, bars, el('p', 'meta check__fails-title', fails.length ? 'Top things to fix' : ''), list, ctas,
            el('p', 'check__note', 'A quick look at the page’s HTML — not a full audit.'));
        countUp(num, overall);
        out.focus();
    });
}
