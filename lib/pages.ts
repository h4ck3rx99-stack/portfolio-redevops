// Inner pages (projects, articles, NFC, privacy) keep their original HTML in content/.
// This reads one at build time and returns its metadata and <main> content, with links
// rewritten for the new site. The copy itself is untouched.
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'content');

// Section ids on the old homepage that moved or were merged on the new one.
const HASHES: Record<string, string> = { '#blog': '#writing', '#about': '#top', '#process': '#services', '#faq': '#services', '#testimonials': '#work' };

export function allPages(): string[][] {
    const walk = (dir: string, prefix: string[]): string[][] => readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name), [...prefix, e.name]) : e.name.endsWith('.html') ? [[...prefix, e.name]] : []);
    return walk('', []);
}

const decode = (s: string) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

export function loadPage(segments: string[]) {
    const url = '/' + segments.join('/');
    const file = path.join(ROOT, ...segments);
    if (!file.startsWith(ROOT) || !allPages().some((p) => p.join('/') === segments.join('/'))) return null;
    const src = readFileSync(file, 'utf8');

    const resolve = (u: string) => {
        if (/^(https?:|mailto:|tel:|#|\/|data:)/.test(u)) return u;
        const r = new URL(u, 'https://x' + url);
        const p = r.pathname === '/index.html' ? '/' : r.pathname;
        return p + (p === '/' ? HASHES[r.hash] ?? r.hash : r.hash);
    };
    const main = src.slice(src.indexOf('>', src.indexOf('<main')) + 1, src.indexOf('</main>'))
        .replace(/\b(href|src)="([^"]*)"/g, (_, a, u) => `${a}="${resolve(decode(u)).replace(/&/g, '&amp;')}"`)
        .replace(/(["\s,])(?:\.\.\/)*assets\//g, '$1/assets/')
        .replace(/\sreveal(?=["\s])/g, '');

    return {
        url,
        title: decode(src.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? 'RE Dev Ops'),
        description: decode(src.match(/<meta content="([^"]*)" name="description">/)?.[1] ?? src.match(/<meta name="description" content="([^"]*)">/)?.[1] ?? ''),
        jsonLd: [...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]),
        html: main,
    };
}
