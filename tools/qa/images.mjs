// Generates responsive AVIF/WebP from the real 1440×900 screenshots in /assets.
//   16:10 at 640/960/1440 → assets/img/<name>-<w>.(avif|webp)
//   4:5 mobile crops at 480/800 → assets/img/<name>-m<w>.(avif|webp|jpg)
// `left` = x offset (in the 1440 original) of the 720×900 4:5 crop, chosen by eye
// so the product UI, not empty margin, fills the frame.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'assets/img');
await mkdir(out, { recursive: true });

const shots = [
    { name: 'ferment_formula', left: 360 },
    { name: 'proposal_forge', left: 600 },
    { name: 'siteaudit', left: 360 },
    { name: 'brandkit', left: 180 },
    { name: 'dashboard_studio', left: 330 },
];

for (const { name, left } of shots) {
    const src = path.join(root, 'assets', `${name}.jpg`);
    const meta = await sharp(src).metadata();
    if (meta.width !== 1440 || meta.height !== 900) throw new Error(`${name}: expected 1440×900, got ${meta.width}×${meta.height}`);

    for (const w of [640, 960, 1440]) {
        const img = sharp(src).resize(w);
        await img.clone().avif({ quality: 55 }).toFile(path.join(out, `${name}-${w}.avif`));
        await img.clone().webp({ quality: 78 }).toFile(path.join(out, `${name}-${w}.webp`));
    }
    for (const w of [480, 800]) {
        const crop = sharp(src).extract({ left, top: 0, width: 720, height: 900 }).resize(w);
        await crop.clone().avif({ quality: 55 }).toFile(path.join(out, `${name}-m${w}.avif`));
        await crop.clone().webp({ quality: 78 }).toFile(path.join(out, `${name}-m${w}.webp`));
        await crop.clone().jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(out, `${name}-m${w}.jpg`));
    }
    console.log('done', name);
}

// Favicons from the redrawn SVG mark
const svg = path.join(root, 'favicon.svg');
await sharp(svg).resize(32, 32).png().toFile(path.join(root, 'favicon-32x32.png'));
await sharp(svg).resize(48, 48).png().toFile(path.join(root, 'favicon-48x48.png'));
await sharp(svg).resize(180, 180).flatten({ background: '#F3F0E8' }).png().toFile(path.join(root, 'apple-touch-icon.png'));
console.log('favicons done');
