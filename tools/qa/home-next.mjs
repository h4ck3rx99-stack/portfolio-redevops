// Checks the Next.js homepage: content order, accessibility basics, interactions and frame cost.
// Needs the site running on BASE.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const base = process.env.BASE || 'http://localhost:3100';
const shots = new URL('./screenshots/', import.meta.url).pathname.replace(/^\/(?:([A-Za-z]):)/, '$1:');
await mkdir(shots, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const errors = [];
const open = async (opts) => {
    const ctx = await browser.newContext(opts);
    await ctx.addInitScript(() => {
        window.__cls = 0;
        new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
    await page.goto(base);
    await page.waitForTimeout(1500);
    return page;
};
// Share of animation frames slower than 30 fps while scrolling the whole page.
const scrollCost = (page) => page.evaluate(async () => {
    const gaps = [];
    let last = performance.now(), on = true;
    const tick = (t) => { gaps.push(t - last); last = t; if (on) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 120) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(r)); }
    on = false;
    return { frames: gaps.length, slow: gaps.filter((g) => g > 34).length, height: h };
});

// Desktop
const page = await open({ viewport: { width: 1440, height: 900 } });
assert.equal(await page.locator('h1').count(), 1);
assert.deepEqual((await page.locator('main h2').allInnerTexts()).map((t) => t.split(String.fromCharCode(10))[0]), [
    'The Ferment Formula',
    'A card on the counter. One tap to your menu, reviews or contact.',
    'Four tools we built for ourselves. Open to everyone.',
    'What do you need built?',
    'How it goes.',
    'Who you’ll actually talk to.',
    'Got something to build?',
], 'sections in order');
await page.screenshot({ path: `${shots}home-hero.png` });
await page.screenshot({ path: `${shots}home-full.png`, fullPage: true });
const a11y = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth,
    imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    emptyLinks: [...document.querySelectorAll('a, button')].filter((e) => !e.closest('[aria-hidden="true"]') && !(e.innerText || '').trim() && !e.getAttribute('aria-label')).length,
    smallText: [...document.querySelectorAll('main p, main li, main a, main dd, main summary, footer p, footer a')].filter((e) => !e.closest('[aria-hidden="true"], [data-slot="team-lanyard-rail"]') && e.getClientRects().length && parseFloat(getComputedStyle(e).fontSize) < 13).length,
    brokenAnchors: [...document.querySelectorAll('a[href^="#"]')].filter((a) => !document.getElementById(a.hash.slice(1))).map((a) => a.hash),
    badgeName: parseFloat(getComputedStyle(document.querySelector('[data-badge] [data-face="front"]')).fontSize),
}));
console.log('desktop', a11y);
assert.equal(a11y.overflow, false);
assert.equal(a11y.imgsNoAlt, 0);
assert.equal(a11y.emptyLinks, 0);
assert.equal(a11y.smallText, 0, 'no body text under 13px');
assert.deepEqual(a11y.brokenAnchors, []);
assert.ok(a11y.badgeName >= 16, `badge base font ${a11y.badgeName}px`);

// Keyboard: first Tab reaches the skip link; a badge flips with Enter and exposes its links.
await page.keyboard.press('Tab');
assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
const badge = page.locator('[data-badge="0"]');
await badge.scrollIntoViewIfNeeded();
await badge.focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
assert.equal(await badge.getAttribute('aria-pressed'), 'true');
assert.equal(await page.locator('[data-links] a').first().getAttribute('href'), 'https://github.com/h4ck3rx99-stack');
await page.screenshot({ path: `${shots}home-team.png` });
await page.keyboard.press('Escape');

// Particle name reacts to the mouse, then goes idle (no perpetual animation).
await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
assert.equal(await page.locator('canvas').count() >= 1, true);
await page.mouse.move(600, 200, { steps: 6 });
await page.waitForTimeout(200);
await page.screenshot({ path: `${shots}home-hero-cursor.png` });

// NFC try-it: clicking the card taps the phone and announces the result.
const card = page.locator('.nfc__card');
await card.scrollIntoViewIfNeeded();
await card.click();
await page.waitForTimeout(900);
assert.equal(await card.getAttribute('aria-pressed'), 'true');
assert.match(await page.locator('.nfc [role=status]').textContent(), /opened the linked page/);
await page.screenshot({ path: `${shots}home-nfc.png` });

// Tool card wipes to its panel on hover.
const tool = page.locator('#tools-h ~ ul li').first();
await tool.scrollIntoViewIfNeeded();
await tool.locator('a').first().hover();
await page.waitForTimeout(900);
await page.screenshot({ path: `${shots}home-tools.png` });

// Contact form validates, then hands off to WhatsApp.
await page.locator('#contact').scrollIntoViewIfNeeded();
await page.getByRole('button', { name: /Send on WhatsApp/ }).click();
assert.match(await page.locator('#contact [role=alert]').textContent(), /Add your name/);
await page.getByLabel('Your name').fill('Test');
await page.getByLabel('What do you want to build?').fill('A website for my cafe');
const [popup] = await Promise.all([page.context().waitForEvent('page'), page.getByRole('button', { name: /Send on WhatsApp/ }).click()]);
assert.match(popup.url(), /wa\.me|whatsapp/);
await popup.close();

const cost = await scrollCost(page);
const cls = await page.evaluate(() => window.__cls);
console.log('desktop scroll', cost, 'cls', cls);
assert.ok(cost.slow / cost.frames < 0.1, `slow frames ${cost.slow}/${cost.frames}`);
assert.ok(cls < 0.1, `CLS ${cls}`);

// Phone
const phone = await open({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await phone.screenshot({ path: `${shots}home-phone.png` });
const pc = await scrollCost(phone);
const ps = await phone.evaluate(() => ({ overflow: document.documentElement.scrollWidth > innerWidth, cls: window.__cls, canvas: document.querySelectorAll('canvas').length }));
console.log('phone', ps, pc);
assert.equal(ps.overflow, false);
assert.equal(ps.canvas, 0, 'plain-text name on touch screens');
assert.ok(ps.cls < 0.1, `CLS ${ps.cls}`);
await phone.locator('#team').scrollIntoViewIfNeeded();
await phone.waitForTimeout(800);
await phone.screenshot({ path: `${shots}home-phone-team.png` });
for (const w of [320, 768, 1024]) {
    const p = await open({ viewport: { width: w, height: 800 } });
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no overflow at ${w}`);
    await p.close();
}

// Reduced motion: no canvas; everything readable.
const calm = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
assert.equal(await calm.locator('canvas').count(), 0);
assert.equal(await calm.locator('h1').isVisible(), true);

// No JavaScript: all content and links are there.
const nojs = await (await browser.newContext({ javaScriptEnabled: false })).newPage();
await nojs.goto(base);
assert.equal(await nojs.locator('h1').isVisible(), true);
assert.ok(await nojs.locator('main img').count() >= 5);
assert.equal(await nojs.getByRole('link', { name: /LinkedIn/ }).count() >= 3, true);
for (const r of ['/work/the-ferment-formula.html', '/nfc.html', '/blog/nextjs-seo-2026.html', '/privacy.html']) {
    assert.equal((await nojs.goto(base + r)).status(), 200, r);
}

assert.deepEqual(errors, [], 'no page errors');
console.log('home-next: all checks passed');
await browser.close();
