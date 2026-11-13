// Checks the Next.js homepage and its "site builds itself" effect. Needs the site on BASE.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.BASE || 'http://localhost:3100';
const shots = new URL('./screenshots/', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:');
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
const open = async (opts, route = '/') => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(base + route);
    return page;
};
const scrollAll = async (page) => {
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 350) { await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(120); }
    await page.waitForTimeout(2500);
};
const state = (page) => page.evaluate(() => ({
    hidden: [...document.querySelectorAll('[data-b]')].filter((e) => getComputedStyle(e).opacity === '0' && e.getClientRects().length).length,
    cursors: document.querySelectorAll('.bc-layer > *').length,
    overflow: document.documentElement.scrollWidth > innerWidth,
    h1: document.querySelectorAll('h1').length,
    cls: window.__cls,
}));

// Desktop: hero builds on load, then every frame builds on scroll and cleans up.
const page = await open({ viewport: { width: 1440, height: 900 } });
await page.waitForTimeout(900);
assert.ok(await page.locator('.bc-layer > .bc-cursor').count() > 0, 'cursors are building the hero');
await page.screenshot({ path: `${shots}next-hero-building.png` });
await page.waitForTimeout(3200);
assert.equal(await page.locator('h1 [aria-hidden] span').first().textContent(), 'This website is building itself.');
await page.screenshot({ path: `${shots}next-hero-built.png` });
await page.locator('#work').scrollIntoViewIfNeeded();
await page.waitForTimeout(450);
await page.screenshot({ path: `${shots}next-work-building.png` });
await scrollAll(page);
let s = await state(page);
console.log('desktop', s);
assert.equal(s.hidden, 0, 'everything visible once built');
assert.equal(s.cursors, 0, 'cursors removed when done');
assert.equal(s.overflow, false);
assert.equal(s.h1, 1);
assert.ok(s.cls < 0.1, `CLS ${s.cls}`);
await page.screenshot({ path: `${shots}next-full.png`, fullPage: true });

// Presence: "you" tag follows the pointer; hovering an inspectable block outlines it.
const card = page.locator('#studio [data-inspect]').first();
await card.scrollIntoViewIfNeeded();
await card.hover();
await page.mouse.move(400, 400);
await card.hover();
await page.waitForTimeout(300);
assert.equal(await page.locator('.bc-you.is-on').count(), 1, '"you" tag');
assert.equal(await page.locator('.bc-inspect.is-on').count(), 1, 'inspect outline');
await page.screenshot({ path: `${shots}next-inspect.png` });

// Replay rebuilds the hero.
await page.getByRole('button', { name: /replay/i }).click();
await page.waitForTimeout(700);
assert.ok(await page.locator('.bc-layer > .bc-cursor').count() > 0, 'replay restarts the build');

// Contact form validates, then hands off to WhatsApp.
await page.waitForTimeout(3500);
await page.locator('#contact').scrollIntoViewIfNeeded();
await page.waitForTimeout(2500);
await page.getByRole('button', { name: /Send on WhatsApp/ }).click();
assert.match(await page.locator('#contact [role=alert]').textContent(), /Add your name/);
await page.getByLabel('Your name').fill('Test');
await page.getByLabel('What do you want to build?').fill('A website for my cafe');
const [popup] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('button', { name: /Send on WhatsApp/ }).click()]);
assert.match(popup.url(), /wa\.me|whatsapp/);

// Phone.
const phone = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await phone.waitForTimeout(4000);
await phone.screenshot({ path: `${shots}next-phone-hero.png` });
await scrollAll(phone);
s = await state(phone);
console.log('phone', s);
assert.equal(s.hidden, 0); assert.equal(s.overflow, false); assert.ok(s.cls < 0.1, `CLS ${s.cls}`);
for (const w of [320, 768, 1024]) {
    const p = await open({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no overflow at ${w}`);
    await p.close();
}

// Reduced motion: static page, no cursors, text untouched.
const calm = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
await calm.waitForTimeout(500);
assert.equal(await calm.locator('.bc-cursor, .bc-you').count(), 0);
assert.equal(await calm.locator('h1').innerText(), 'This website is building itself.\nYours is next.');

// No JavaScript: content is all there.
const nojs = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await nojs.goto(base);
assert.equal(await nojs.locator('h1').isVisible(), true);
assert.equal(await nojs.locator('main img').count(), 6);

// Older pages still load from /public.
for (const r of ['/work/the-ferment-formula.html', '/nfc.html', '/blog/nextjs-seo-2026.html', '/privacy.html']) {
    const res = await nojs.goto(base + r);
    assert.equal(res.status(), 200, r);
}

assert.deepEqual(errors, [], 'no page errors');
console.log('home-next: all checks passed');
await browser.close();
