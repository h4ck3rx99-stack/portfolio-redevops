// Checks the inner pages (projects, articles, NFC, privacy, 404). Needs the site on BASE.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.BASE || 'http://localhost:3100';
const shots = new URL('./screenshots/', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:');
await mkdir(shots, { recursive: true });
const pages = ['/work/the-ferment-formula.html', '/work/proposalforge.html', '/work/siteaudit-pro.html', '/work/brandkit-studio.html', '/work/dashboard-studio.html',
    '/blog/cloud-cost-optimization.html', '/blog/nextjs-seo-2026.html', '/blog/ai-features-no-data-science.html', '/nfc.html', '/privacy.html'];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
const links = new Set();

for (const [w, h] of [[1440, 900], [390, 844], [320, 700]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`${page.url()} ${m.text().slice(0, 160)}`); });
    for (const route of pages) {
        const res = await page.goto(base + route);
        assert.equal(res.status(), 200, route);
        const a = await page.evaluate(() => ({
            h1: document.querySelectorAll('h1').length,
            title: document.title,
            canonical: document.querySelector('link[rel=canonical]')?.href,
            overflow: document.documentElement.scrollWidth > innerWidth,
            brokenImg: [...document.querySelectorAll('img')].filter((i) => i.complete && !i.naturalWidth).map((i) => i.src),
            noAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
            internal: [...document.querySelectorAll('a[href^="/"]')].map((x) => x.getAttribute('href')),
            oldLinks: [...document.querySelectorAll('a[href*="index.html"], a[href^="../"]')].length,
        }));
        assert.equal(a.h1, 1, `${route} one h1`);
        assert.ok(a.title.includes('RE Dev Ops'), `${route} title`);
        assert.ok(a.canonical.endsWith(route), `${route} canonical ${a.canonical}`);
        assert.equal(a.overflow, false, `${route} overflow at ${w}`);
        assert.deepEqual(a.brokenImg, [], `${route} images`);
        assert.equal(a.noAlt, 0, `${route} alt`);
        assert.equal(a.oldLinks, 0, `${route} old-style links`);
        a.internal.forEach((l) => links.add(l));
        if (w === 1440) await page.screenshot({ path: `${shots}inner-${route.replace(/\W+/g, '-')}.png`, fullPage: route.includes('nfc') });
    }
    if (w === 390) await page.screenshot({ path: `${shots}inner-phone.png` });
    await page.context().close();
}

// Every internal link on the inner pages resolves, and hash links hit a real section.
const p = await browser.newPage();
for (const l of links) {
    const [pathname, hash] = l.split('#');
    const res = await p.goto(base + pathname);
    assert.equal(res.status(), 200, `link ${l}`);
    if (hash) assert.equal(await p.evaluate((id) => !!document.getElementById(id), hash), true, `anchor ${l}`);
}
console.log([...links].sort().join('  '));

// Unknown addresses get the 404 page.
const nf = await p.goto(base + '/work/nope.html');
assert.equal(nf.status(), 404);
assert.match(await p.locator('h1').innerText(), /Nothing was built here/);

assert.deepEqual(errors, [], 'no page errors');
console.log('inner-pages: all checks passed');
await browser.close();
