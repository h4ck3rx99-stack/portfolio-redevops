// Automated layout + behaviour checks for every page at every viewport.
// Usage: serve the repo (python -m http.server 5510) then `npm test` from tools/qa.
// BASE env var overrides the server URL. Never submits real data: window.open and
// mailto navigations are intercepted.
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE || 'http://localhost:5510';
const here = path.dirname(fileURLToPath(import.meta.url));
const shotsDir = path.join(here, 'screenshots');
await mkdir(shotsDir, { recursive: true });

const PAGES = ['/', '/nfc.html', '/work/the-ferment-formula.html', '/work/proposalforge.html', '/work/siteaudit-pro.html',
    '/work/brandkit-studio.html', '/work/dashboard-studio.html', '/blog/nextjs-seo-2026.html', '/privacy.html', '/404.html', '/design-lab/'];
const VIEWPORTS = [[320, 640], [360, 740], [375, 667], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const SHOT_PAGES = ['/', '/nfc.html', '/work/the-ferment-formula.html', '/design-lab/'];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const results = [];
const fail = (page, vp, msg) => results.push({ page, vp, msg });

// Runs inside the page: returns a list of problems.
function auditPage() {
    const problems = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw) problems.push(`horizontal overflow: ${document.documentElement.scrollWidth} > ${vw}`);

    const visible = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
        if (el.closest('[hidden], [aria-hidden="true"], .visually-hidden, .form__hp, .wa-panel, .menu-sheet')) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
    };

    // Tap targets (inline links inside running text are exempt)
    document.querySelectorAll('a, button, input, select, textarea, summary').forEach((el) => {
        if (!visible(el)) return;
        if (el.matches('p a, li > a:not([class]), dd a, figcaption a, .article a:not(.btn), blockquote a')) return;
        if (el.closest('.lab-bar, .demo-frame, .previews')) return;
        const r = el.getBoundingClientRect();
        if (r.height < 44 - 0.5 || r.width < 44 - 0.5) problems.push(`small target ${Math.round(r.width)}×${Math.round(r.height)}: ${el.outerHTML.slice(0, 70)}`);
    });

    // Min font size
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
        const t = walker.currentNode;
        const el = t.parentElement;
        if (!t.textContent.trim() || seen.has(el) || !visible(el)) continue;
        seen.add(el);
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 12) problems.push(`text ${fs}px: "${t.textContent.trim().slice(0, 40)}"`);
    }

    // Clipped text
    document.querySelectorAll('h1, h2, h3, p, a, button, span, li, dd, dt, label').forEach((el) => {
        if (!visible(el)) return;
        const cs = getComputedStyle(el);
        if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden') && el.scrollWidth > el.clientWidth + 1) problems.push(`clipped text: ${el.outerHTML.slice(0, 70)}`);
    });

    // FAB overlap with interactive elements
    const fab = document.getElementById('waFab');
    if (fab && visible(fab) && !document.getElementById('waWidget').classList.contains('is-tucked')) {
        const f = fab.getBoundingClientRect();
        document.querySelectorAll('a, button, input, select, textarea').forEach((el) => {
            if (el === fab || el.closest('#waWidget') || !visible(el)) return;
            const r = el.getBoundingClientRect();
            if (r.left < f.right && r.right > f.left && r.top < f.bottom && r.bottom > f.top) problems.push(`FAB overlaps: ${el.outerHTML.slice(0, 60)}`);
        });
    }

    // Images
    document.querySelectorAll('img').forEach((img) => {
        if (!img.getAttribute('width') || !img.getAttribute('height')) problems.push(`img missing size: ${img.src}`);
        if (img.alt === undefined || (img.getAttribute('alt') === null)) problems.push(`img missing alt: ${img.src}`);
        if (img.complete && img.naturalWidth === 0 && img.loading !== 'lazy') problems.push(`img failed: ${img.currentSrc || img.src}`);
    });
    return problems;
}

for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768, deviceScaleFactor: 1 });
    await ctx.addInitScript(() => {
        window.__opened = [];
        window.open = (u) => { window.__opened.push(String(u)); return null; };
        window.__cls = 0;
        try {
            new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; }))
                .observe({ type: 'layout-shift', buffered: true });
        } catch {}
    });
    for (const p of PAGES) {
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource|clarity|calendly|ERR_/i.test(m.text())) errors.push(m.text()); });
        // Block third-party trackers so runs are deterministic and nothing is sent.
        await page.route(/clarity\.ms|calendly\.com/, (r) => r.abort());
        await page.goto(BASE + p, { waitUntil: 'load' });
        await page.waitForTimeout(400);
        const vpLabel = `${w}×${h}`;

        // Hero above the fold
        if (p === '/') {
            const r = await page.evaluate(() => {
                const q = (s) => document.querySelector(s)?.getBoundingClientRect().bottom ?? 1e9;
                return { h1: q('.hero__title'), lead: q('.hero__lead'), cta: q('.hero__ctas .btn--primary'), cta2: q('.hero__ctas .btn--outline'), img: q('.preview__frame') };
            });
            if (w === 390 && h === 844 && Math.max(r.h1, r.lead, r.cta) > 844) fail(p, vpLabel, `hero not above fold ${JSON.stringify(r)}`);
            if (w === 375 && h === 667 && Math.max(r.h1, r.cta) > 667) fail(p, vpLabel, `hero not above fold ${JSON.stringify(r)}`);
            if (w === 1440 && Math.max(r.h1, r.cta, r.cta2, r.img) > 900) fail(p, vpLabel, `hero not above fold ${JSON.stringify(r)}`);
        }

        // Scroll through (lets reveals run, measures CLS over scroll), then audit at top and per screen
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        const probs = new Set();
        for (let y = 0; y < height; y += h) {
            await page.evaluate((yy) => window.scrollTo(0, yy), y);
            await page.waitForTimeout(80);
            (await page.evaluate(auditPage)).forEach((m) => probs.add(m));
        }
        await page.waitForTimeout(1600); // reveal safety timeout
        await page.evaluate(() => window.scrollTo(0, 0));
        (await page.evaluate(auditPage)).forEach((m) => probs.add(m));
        const cls = await page.evaluate(() => window.__cls);
        if (cls >= 0.05) probs.add(`CLS ${cls.toFixed(3)}`);
        errors.forEach((e) => probs.add(`console: ${e}`));
        probs.forEach((m) => fail(p, vpLabel, m));
        results.push({ page: p, vp: vpLabel, height, cls: +cls.toFixed(4), ok: probs.size === 0 });

        if (SHOT_PAGES.includes(p) && [390, 768, 1440, 320, 1920].includes(w)) {
            const name = `${p.replace(/\W+/g, '_') || 'home'}_${w}`;
            await page.screenshot({ path: path.join(shotsDir, `${name}_first.png`) });
            if ([390, 768, 1440].includes(w)) await page.screenshot({ path: path.join(shotsDir, `${name}_full.png`), fullPage: true });
        }
        await page.close();
    }
    await ctx.close();
}

// ---------------- behaviour tests ----------------
const behaviour = [];
const check = (name, ok, detail = '') => behaviour.push({ name, ok, detail });
{
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(String(u)); return null; }; });
    const page = await ctx.newPage();
    await page.route(/clarity\.ms|calendly\.com/, (r) => r.abort());
    await page.goto(BASE + '/');

    // Mobile menu
    await page.click('.menu-toggle');
    await page.waitForTimeout(300);
    const menuOpen = await page.evaluate(() => !document.getElementById('site-menu').hidden && document.activeElement.closest('#site-menu') !== null);
    check('menu opens and moves focus inside', menuOpen);
    for (let i = 0; i < 15; i++) await page.keyboard.press('Tab');
    check('menu traps focus', await page.evaluate(() => !!document.activeElement.closest('#site-menu')));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    check('Esc closes menu and returns focus', await page.evaluate(() => document.getElementById('site-menu').hidden && document.activeElement.classList.contains('menu-toggle')));
    await page.click('.menu-toggle');
    await page.waitForTimeout(300);
    await page.click('#site-menu a[href="#contact"]');
    await page.waitForTimeout(500);
    check('menu link closes sheet and navigates', await page.evaluate(() => document.getElementById('site-menu').hidden && location.hash === '#contact'));

    // FAQ
    const faqOpen = await page.evaluate(() => { const d = document.querySelector('.faq__item'); d.querySelector('summary').click(); return d.open; });
    check('FAQ toggles', faqOpen);

    // Quick brief → WhatsApp URL
    await page.selectOption('#briefNeed', 'an online store');
    await page.selectOption('#briefWho', 'my restaurant or café');
    await page.click('[data-brief-whatsapp]');
    const opened = await page.evaluate(() => window.__opened.at(-1));
    const expected = 'https://wa.me/918734000403?text=' + encodeURIComponent('Hi! I need an online store for my restaurant or café.');
    check('quick brief builds wa.me URL', opened === expected, opened);
    await page.click('[data-brief-form]');
    check('quick brief fills the form', await page.evaluate(() => document.getElementById('formMessage').value === 'Hi! I need an online store for my restaurant or café.' && document.activeElement.id === 'formName'));

    // Empty form → validation
    await page.evaluate(() => { document.getElementById('formMessage').value = ''; });
    await page.click('#contactForm [type="submit"]');
    check('empty submit shows validation', await page.evaluate(() => !document.getElementById('formError').hidden && document.getElementById('formError').textContent === 'Please add your name, a valid email and a short message.'));

    // buildMailto (pure function)
    const mail = await page.evaluate(async () => (await import('/js/contact.js')).buildMailto({ name: 'Asha', email: 'a@b.co', message: 'Hi there' }));
    check('buildMailto', mail === 'mailto:hello@redevops.in?subject=Project%20Inquiry%20from%20Asha&body=Name%3A%20Asha%0AEmail%3A%20a%40b.co%0A%0AMessage%3A%0AHi%20there', mail);

    // Honeypot path → success without mail
    await page.fill('#formName', 'Bot');
    await page.fill('#formEmail', 'bot@example.com');
    await page.fill('#formMessage', 'spam spam spam');
    await page.evaluate(() => { document.getElementById('formWebsite').value = 'http://spam'; });
    const before = page.url();
    await page.click('#contactForm [type="submit"]');
    await page.waitForTimeout(200);
    check('honeypot shows success, no mailto', await page.evaluate(() => !!document.querySelector('.form-success')) && page.url() === before);

    await page.close();

    // Deep link redirect
    const p2 = await ctx.newPage();
    await p2.goto(BASE + '/#project-proposal-forge');
    await p2.waitForURL('**/work/proposalforge.html', { timeout: 5000 }).catch(() => {});
    check('#project-proposal-forge → /work/proposalforge.html', p2.url().endsWith('/work/proposalforge.html'), p2.url());
    await p2.close();
    await ctx.close();

    // Hero preview swap on hover and on keyboard focus (desktop)
    const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const d = await dctx.newPage();
    await d.route(/clarity\.ms|calendly\.com/, (r) => r.abort());
    await d.goto(BASE + '/');
    await d.hover('.pindex__row:nth-child(3) .pindex__link');
    await d.waitForTimeout(600);
    const hoverSrc = await d.evaluate(() => [...document.querySelectorAll('.preview__img')].find((i) => !i.classList.contains('is-hidden')).src);
    check('preview swaps on hover', /siteaudit/.test(hoverSrc), hoverSrc);
    await d.focus('.pindex__row:nth-child(5) .pindex__link');
    await d.waitForTimeout(600);
    const focusSrc = await d.evaluate(() => [...document.querySelectorAll('.preview__img')].find((i) => !i.classList.contains('is-hidden')).src);
    check('preview swaps on keyboard focus', /dashboard_studio/.test(focusSrc), focusSrc);
    await dctx.close();

    // Reduced motion: no transforms on revealed content
    const rctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const r = await rctx.newPage();
    await r.goto(BASE + '/');
    const pending = await r.evaluate(() => document.querySelectorAll('.reveal.is-pending').length);
    check('reduced motion: nothing hidden for reveal', pending === 0, `${pending} pending`);
    await rctx.close();

    // Motion: nothing animates on load above the fold
    const mctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const m = await mctx.newPage();
    await m.route(/clarity\.ms|calendly\.com/, (r) => r.abort());
    await m.goto(BASE + '/');
    await m.waitForTimeout(300);
    const running = await m.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => String(a.effect?.target?.className || '?')));
    check('no animations running on load', running.length === 0, running.join(', '));

    // Jumping to a section never lands on blank (pending) content
    await m.click('.site-nav__link[href="#team"]');
    await m.waitForTimeout(150);
    const blank = await m.evaluate(() => document.querySelectorAll('#team .reveal.is-pending').length);
    check('nav jump reveals target immediately', blank === 0, `${blank} pending in #team`);
    await mctx.close();

    // Reduced motion: no transforms on decorative or revealed elements
    const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const rp = await rm.newPage();
    await rp.goto(BASE + '/');
    const transformed = await rp.evaluate(() => [...document.querySelectorAll('.product .shot, .sticker, .nfc-demo__card, .reveal')]
        .filter((el) => getComputedStyle(el).transform !== 'none').map((el) => String(el.className)));
    check('reduced motion: no transforms', transformed.length === 0, transformed.join(', '));
    await rm.close();

    // Website checker: renders the score from /api/check (stubbed, no network)
    const cctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const cp = await cctx.newPage();
    await cp.route(/clarity\.ms|calendly\.com/, (r) => r.abort());
    await cp.route('**/api/check?*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://shop.example/', checks: {
        SEO: [{ label: 'Page has a title', pass: true, weight: 3 }, { label: 'Meta description for Google', pass: false, weight: 2 }],
        Mobile: [{ label: 'Set up for phone screens (viewport tag)', pass: true, weight: 4 }],
        Security: [{ label: 'Served over HTTPS', pass: true, weight: 4 }, { label: 'No insecure (http://) files on a secure page', pass: false, weight: 2 }],
    } }) }));
    await cp.goto(BASE + '/');
    await cp.fill('#checkUrl', 'shop.example');
    await cp.click('.check__form button');
    await cp.waitForSelector('.check__ring', { timeout: 5000 }).catch(() => {});
    await cp.waitForTimeout(1200);
    const res = await cp.evaluate(() => ({ num: document.querySelector('.check__num')?.textContent, fails: [...document.querySelectorAll('.check__fails li')].map((l) => l.textContent), fix: document.querySelector('.check__ctas .btn')?.href }));
    check('website checker shows score + fixes', res.num === '73' && res.fails.length === 2 && res.fix?.includes('scored%2073%2F100'), JSON.stringify(res));
    await cctx.close();

    // No-JS: hero content visible
    const nctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const n = await nctx.newPage();
    await n.goto(BASE + '/');
    const vis = await n.evaluate(() => { const h = document.querySelector('.hero__title'); const cs = getComputedStyle(h); return cs.opacity === '1' && h.getBoundingClientRect().height > 0; });
    check('no-JS: hero visible', vis);
    await nctx.close();
}

await browser.close();

const failures = results.filter((r) => r.msg);
const rows = results.filter((r) => r.ok !== undefined);
const summary = {
    when: new Date().toISOString(),
    pagesChecked: rows.length,
    failures: failures.length,
    behaviour,
    heights: Object.fromEntries(rows.filter((r) => r.page === '/').map((r) => [r.vp, r.height])),
    maxCls: Math.max(...rows.map((r) => r.cls)),
};
await mkdir(path.join(here, 'reports'), { recursive: true });
await writeFile(path.join(here, 'reports', 'checks.json'), JSON.stringify({ summary, failures, rows }, null, 2));

console.log(`\nLayout checks: ${rows.length} page×viewport runs, ${failures.length} problems`);
const grouped = {};
failures.forEach((f) => { (grouped[f.msg.replace(/\d+(\.\d+)?/g, '#')] ??= []).push(`${f.page} @ ${f.vp}`); });
Object.entries(grouped).slice(0, 60).forEach(([m, where]) => console.log(`  ✗ ${m}\n      ${where.slice(0, 6).join(', ')}${where.length > 6 ? ` (+${where.length - 6})` : ''}`));
console.log('\nBehaviour:');
behaviour.forEach((b) => console.log(`  ${b.ok ? '✓' : '✗'} ${b.name}${b.ok ? '' : `  [${b.detail}]`}`));
console.log('\nHomepage height:', summary.heights, ' max CLS:', summary.maxCls);
process.exitCode = failures.length || behaviour.some((b) => !b.ok) ? 1 : 0;
