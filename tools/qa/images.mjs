// Captures real screenshots of the live projects and writes the responsive images the site uses.
//   desktop 1440×900 @2x → public/assets/<name>.jpg + public/assets/img/<name>-<w>.(avif|webp)
//   phone    390×844 @3x → public/assets/img/<name>-phone-<w>.(avif|webp)
// Run: node images.mjs            (re-capture everything)
//      node images.mjs siteaudit  (one project)
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const assets = path.join(root, 'public/assets');
const out = path.join(assets, 'img');
await mkdir(out, { recursive: true });

const sites = {
    ferment_formula: 'https://thefermentformula.in/',
    proposal_forge: 'https://proposalforge.redevops.in/',
    siteaudit: 'https://siteaudit.redevops.in/',
    brandkit: 'https://brandkit.redevops.in/',
    dashboard_studio: 'https://dashboardstudio.redevops.in/',
};
const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge', headless: true });

for (const [name, url] of Object.entries(sites)) {
    if (only.length && !only.includes(name)) continue;
    for (const [kind, viewport, scale] of [['desktop', { width: 1440, height: 900 }, 2], ['phone', { width: 390, height: 844 }, 3]]) {
        const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale, isMobile: kind === 'phone', hasTouch: kind === 'phone', reducedMotion: 'reduce' });
        const page = await ctx.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
        await page.waitForTimeout(2500);
        const png = await page.screenshot({ type: 'png' });
        await ctx.close();
        if (kind === 'desktop') {
            await sharp(png).resize(1440).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(assets, `${name}.jpg`));
            for (const w of [640, 960, 1440, 1920]) {
                await sharp(png).resize(w).avif({ quality: 58 }).toFile(path.join(out, `${name}-${w}.avif`));
                await sharp(png).resize(w).webp({ quality: 80 }).toFile(path.join(out, `${name}-${w}.webp`));
            }
        } else {
            for (const w of [390, 780]) {
                await sharp(png).resize(w).avif({ quality: 58 }).toFile(path.join(out, `${name}-phone-${w}.avif`));
                await sharp(png).resize(w).webp({ quality: 80 }).toFile(path.join(out, `${name}-phone-${w}.webp`));
            }
        }
    }
    console.log('done', name);
}
await browser.close();
