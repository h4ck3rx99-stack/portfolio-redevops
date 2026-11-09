// Checks the "multiplayer cursors build the site" effect (js/build.js) with motion ON.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

process.chdir(new URL('../..', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:'));
const base = process.env.BASE || 'http://localhost:5510';
const shots = 'tools/qa/screenshots';
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const wait = (ms) => page.waitForTimeout(ms);

// CLS observer installed before any script runs.
await ctx.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
});

await page.goto(base);
await wait(1500);
let s = await page.evaluate(() => ({ y: scrollY, btn: document.querySelector('.bc-autoplay')?.textContent, timeline: !!document.querySelector('.hero.is-timeline'), building: document.documentElement.classList.contains('building') }));
assert.equal(s.timeline, true, 'hero timeline active at 1440×900');
assert.equal(s.building, false, 'content gate released');
assert.ok(s.y > 0, 'autoplay scrolls on load');
assert.equal(s.btn, 'Autoplay ⏸');

// Any user input stops autoplay.
await page.mouse.wheel(0, 10);
const y1 = await page.evaluate(() => scrollY);
await wait(600);
assert.ok(Math.abs((await page.evaluate(() => scrollY)) - y1) < 20, 'wheel stops autoplay');
assert.equal(await page.locator('.bc-autoplay').textContent(), 'Replay ↺');

// Scrub through the hero and capture beats.
const span = await page.evaluate(() => document.querySelector('.hero').offsetHeight - document.querySelector('.hero__stage').offsetHeight);
for (const p of [0.08, 0.25, 0.5, 0.65, 0.8, 1]) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(p * span));
    await wait(250);
    const info = await page.evaluate(() => ({ cursors: document.querySelectorAll('.bc-cursor').length, narr: document.querySelector('.bc-narr').textContent, overflow: document.documentElement.scrollWidth > innerWidth }));
    assert.equal(info.overflow, false, `no horizontal overflow at p=${p}`);
    if (p < 1) assert.ok(info.cursors > 0, `cursors visible at p=${p}`);
    console.log(`p=${p}: ${info.cursors} cursors · ${info.narr}`);
    await page.screenshot({ path: `${shots}/build-hero-${Math.round(p * 100)}.png` });
}
// Scrub back: text must un-type (timeline is reversible) and fully re-type.
await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await wait(200);
assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.hero__title')).opacity), '0');
await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), span);
await wait(200);
assert.equal(await page.evaluate(() => document.querySelector('.hero__title [aria-hidden]').textContent), 'Your business, built into better software.');

// Below the hero: sections build as they come into view, then clean up.
await page.locator('#services').scrollIntoViewIfNeeded();
await wait(350);
await page.screenshot({ path: `${shots}/build-services-mid.png` });
assert.ok(await page.locator('.bc-layer > .bc-cursor').count() > 0, 'cursors while a section builds');
await wait(3500);
await page.screenshot({ path: `${shots}/build-services-done.png` });

// Replay restarts from the top.
await page.locator('.bc-autoplay').click();
await wait(800);
assert.equal(await page.locator('.bc-autoplay').textContent(), 'Autoplay ⏸');
await page.mouse.wheel(0, 10);
await wait(150);
assert.equal(await page.locator('.bc-autoplay').textContent(), 'Replay ↺');

// Let everything finish, then: no cursors left, no hidden content, low CLS.
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 400) { await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await wait(60); }
await wait(5000);
const end = await page.evaluate(() => ({
    hidden: [...document.querySelectorAll('main *, .site-footer')].filter((e) => e.style.opacity === '0' && e.getClientRects().length && !e.closest('.hero')).map((e) => e.tagName + '.' + e.className).slice(0, 5),
    cursors: document.querySelectorAll('.bc-layer:not(.bc-layer--stage) > *').length,
    cls: window.__cls,
}));
console.log('home end state', end);
assert.deepEqual(end.hidden, [], 'everything visible once built');
assert.equal(end.cursors, 0, 'page-level cursors removed when done');
assert.ok(end.cls < 0.1, `CLS ${end.cls}`);

// Other pages and phone width: no timeline, sections still build; nothing left hidden.
for (const [route, w, hgt] of [['/', 390, 844], ['/work/the-ferment-formula.html', 1440, 900], ['/blog/nextjs-seo-2026.html', 390, 844], ['/nfc.html', 1024, 768]]) {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`${route}: ${e.message}`));
    await p.setViewportSize({ width: w, height: hgt });
    await p.goto(base + route);
    await p.mouse.wheel(0, 1);
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 300) { await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(80); }
    await p.waitForTimeout(6000);
    const r = await p.evaluate(() => ({
        timeline: !!document.querySelector('.is-timeline'),
        hidden: [...document.querySelectorAll('main *, .site-footer')].filter((e) => e.style.opacity === '0' && e.getClientRects().length).length,
        overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    console.log(route, w, r);
    assert.equal(r.hidden, 0, `${route} ${w}: all built`);
    assert.equal(r.overflow, false, `${route} ${w}: no overflow`);
    if (route === '/' && w === 390) { await p.evaluate(() => scrollTo(0, 0)); await p.screenshot({ path: `${shots}/build-home-390.png` }); }
    await p.close();
}

// Reduced motion: no gate, no cursors, no autoplay, text untouched.
const rm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const q = await rm.newPage();
await q.goto(base);
await q.waitForTimeout(800);
const r = await q.evaluate(() => ({ cls: document.documentElement.className, y: scrollY, cursors: document.querySelectorAll('.bc-cursor').length, btn: !!document.querySelector('.bc-autoplay'), h1: document.querySelector('h1').innerHTML }));
assert.equal(r.y, 0); assert.equal(r.cursors, 0); assert.equal(r.btn, false);
assert.equal(r.cls, 'js');
assert.equal(r.h1, 'Your business, built into better software.');
await rm.close();

assert.deepEqual(errors, [], 'no page errors');
console.log('build-effect: all checks passed');
await browser.close();
