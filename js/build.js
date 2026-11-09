// "Multiplayer cursors build the site": labelled cursors drag out blocks and type text in place.
// Every primitive is a pure render(d) of progress d (0..1), so the same code runs on a timer
// (sections as they scroll into view) or scrubbed by scroll (the homepage hero).
// Motion only; the copy in the HTML is never changed. Off entirely under reduced motion.
import { who } from './cast.js';

const ease = (d) => d * d * (3 - 2 * d);
const clamp = (v) => Math.min(1, Math.max(0, v));
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ARROW = '<svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true"><path d="M1 1v16l4.2-4 2.9 6.2 2.6-1.2-2.8-6H15z" fill="currentColor" stroke="#111" stroke-width="1.2" stroke-linejoin="round"/></svg>';

export function cursor(label, tone = 'neutral') {
    const c = mk('span', `bc-cursor bc-cursor--${tone}`);
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = ARROW;
    c.append(mk('span', 'bc-cursor__tag', label));
    return c;
}

export function sel() {
    const s = mk('span', 'bc-sel');
    s.setAttribute('aria-hidden', 'true');
    ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].forEach((h) => s.append(mk('i', `bc-h bc-h--${h}`)));
    s.append(mk('span', 'bc-sel__size'));
    return s;
}

// Position of el inside layer (both may move; measured each frame).
const at = (el, layer) => {
    const r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
    return { x: r.left - l.left, y: r.top - l.top };
};
const place = (node, x, y) => { node.style.transform = `translate(${x}px,${y}px)`; };

// Drag a block out from its top-left corner.
export function box(el, { by, tone, layer }) {
    const s = sel(), c = cursor(by, tone);
    let shown = false;
    const show = (on) => { if (on === shown) return; shown = on; if (on) layer.append(s, c); else { s.remove(); c.remove(); } };
    return {
        render(d) {
            el.style.opacity = d <= 0 ? '0' : '';
            if (d <= 0 || d >= 1) { el.style.clipPath = ''; show(false); return; }
            const e = ease(d), cut = (1 - e) * 100;
            el.style.clipPath = `inset(0 ${cut}% ${cut}% 0)`;
            show(true);
            const { x, y } = at(el, layer), w = el.offsetWidth * e, h = el.offsetHeight * e;
            place(s, x, y);
            s.style.width = `${w}px`;
            s.style.height = `${h}px`;
            s.lastChild.textContent = `${Math.round(w)} × ${Math.round(h)}`;
            place(c, x + w, y + h);
        },
        done() { el.style.opacity = ''; el.style.clipPath = ''; show(false); },
    };
}

// Type plain text in place. Untyped text keeps its space (visibility:hidden), so nothing shifts.
export function type(el, { by, tone, layer }) {
    const text = el.textContent;
    const typed = mk('span'), caret = mk('span', 'bc-caret'), rest = mk('span', 'bc-rest');
    const shown = mk('span');
    shown.setAttribute('aria-hidden', 'true');
    shown.append(typed, caret, rest);
    el.replaceChildren(mk('span', 'visually-hidden', text), shown);
    const c = cursor(by, tone);
    let last = -1;
    return {
        length: text.length,
        render(d) {
            el.style.opacity = d <= 0 ? '0' : '';
            const n = Math.round(text.length * clamp(d));
            if (n !== last) { typed.textContent = text.slice(0, n); rest.textContent = text.slice(n); last = n; }
            const active = d > 0 && d < 1;
            caret.hidden = !active;
            if (!active) { c.remove(); return; }
            if (!c.isConnected) layer.append(c);
            const { x, y } = at(caret, layer);
            place(c, x + 2, y + caret.offsetHeight * 0.6);
        },
        done() { el.style.opacity = ''; c.remove(); el.textContent = text; },
    };
}

// Time-driven run: d goes 0→1 once, after delay, over dur ms.
function play(prim, delay, dur) {
    const t0 = performance.now() + delay;
    const tick = (t) => {
        const d = clamp((t - t0) / dur);
        prim.render(d);
        if (d < 1) requestAnimationFrame(tick); else prim.done();
    };
    requestAnimationFrame(tick);
}

const BOX = '.btn, figure, pre, table, form, details, .product, .person, .step, .service, .writing__row, .feature__media, .nfc-diagram, .shot, .quote__body, .check';
const TEXT = 'h1, h2, h3, h4, p, li, dt, dd, blockquote, figcaption, summary, label';
const SKIP = '.site-header, .menu-sheet, .visually-hidden, [data-result], [hidden], .is-timeline';
const isPlain = (el) => [...el.childNodes].every((n) => n.nodeType === Node.TEXT_NODE) && el.textContent.trim().length > 0;

export function initBuild() {
    const root = document.documentElement;
    const ready = () => root.classList.remove('building');
    if (!root.classList.contains('building')) return;
    const hero = document.querySelector('.hero[data-timeline]');
    if (hero && matchMedia('(min-width: 1024px) and (min-height: 640px)').matches) hero.classList.add('is-timeline');
    const layer = mk('div', 'bc-layer');
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);

    const scope = [...document.querySelectorAll('main, .site-footer')];
    const footer = document.querySelector('.site-footer');
    const boxes = [];
    const texts = [];
    scope.forEach((s) => {
        if (s === footer) { boxes.push(s); return; }
        s.querySelectorAll(BOX).forEach((el) => { if (!el.closest(SKIP) && !el.parentElement.closest(BOX)) boxes.push(el); });
        s.querySelectorAll(TEXT).forEach((el) => {
            if (el.closest(SKIP) || el.closest(BOX) || el.querySelector(TEXT)) return;
            if (isPlain(el)) texts.push(el); else boxes.push(el);
        });
    });

    let n = 0;
    const jobs = new Map();
    const sibIndex = (el) => [...el.parentElement.children].filter((c) => jobs.has(c)).length;
    boxes.forEach((el) => {
        const dur = el.matches('.btn') ? 400 : el.matches('figure, pre, table, .shot, .feature__media') ? 800 : 650;
        jobs.set(el, { prim: box(el, { by: who(n++), tone: el.matches('.btn--primary') ? 'accent' : 'neutral', layer }), delay: sibIndex(el) * 150, dur });
    });
    texts.forEach((el) => {
        const prim = type(el, { by: who(n++), layer });
        const cps = /^H\d$/.test(el.tagName) ? 70 : 140;
        jobs.set(el, { prim, delay: sibIndex(el) * 150, dur: (prim.length / cps) * 1000 });
    });
    jobs.forEach(({ prim }) => prim.render(0));
    ready();

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const j = jobs.get(e.target);
        play(j.prim, j.delay, j.dur);
    }), { threshold: 0.25 });
    jobs.forEach((_, el) => io.observe(el));

    initHero();
}

// ---------- Homepage hero: a scroll-scrubbed timeline ----------
const BEATS = [
    { at: [0.00, 0.14], say: 'copy types the headline' },
    { at: [0.12, 0.34], say: 'design drags out the page and the lead' },
    { at: [0.32, 0.48], say: 'PM labels what is on screen' },
    { at: [0.46, 0.60], say: 'build steps get checked off' },
    { at: [0.58, 0.76], say: 'QA catches a phone layout bug, dev fixes it' },
    { at: [0.74, 0.94], say: 'the buttons go in — ready to ship' },
];
const local = ([a, b], p) => clamp((p - a) / (b - a));

function initHero() {
    const hero = document.querySelector('.hero.is-timeline');
    if (!hero) return;
    const stage = hero.querySelector('.hero__stage');
    const q = (s) => hero.querySelector(s);
    const layer = mk('div', 'bc-layer bc-layer--stage');
    layer.setAttribute('aria-hidden', 'true');
    stage.append(layer);

    const T = (el, by, tone) => type(el, { by, tone, layer });
    const B = (el, by, tone) => box(el, { by, tone, layer });
    const visual = q('.hero__visual');
    const chips = mk('ul', 'bc-chips');
    chips.setAttribute('aria-hidden', 'true');
    const chipList = ['Wireframe', 'Copy', 'Build'].map((t) => { const li = mk('li', 'bc-chip', `✓ ${t}`); chips.append(li); return li; });
    const bug = mk('li', 'bc-chip bc-chip--danger', '✕ Text overflows on phones');
    chips.append(bug);
    visual.append(chips);
    const narr = mk('p', 'bc-narr');
    narr.setAttribute('aria-hidden', 'true');
    const label = mk('span', 'bc-narr__tag', 'Illustration');
    const say = mk('span');
    narr.append(label, say);
    stage.append(narr);
    const ctas = [...hero.querySelectorAll('.hero__ctas .btn')];

    // Each entry: [primitive, [start, end]] in hero progress.
    const tracks = [
        [T(q('.hero__eyebrow'), 'PM'), [0.00, 0.05]],
        [T(q('.hero__title'), 'copy', 'accent'), [0.02, 0.14]],
        [B(visual, 'design'), [0.12, 0.30]],
        [T(q('.hero__lead'), 'copy'), [0.18, 0.34]],
        [T(q('.preview__caption'), 'PM'), [0.32, 0.46]],
        ...chipList.map((li, i) => [{ render: (d) => li.classList.toggle('is-on', d > 0) }, [0.46 + i * 0.04, 0.47 + i * 0.04]]),
        [{ render: (d) => bug.classList.toggle('is-on', d > 0) }, [0.58, 0.59]],
        [{ render: (d) => { const fixed = d >= 1; bug.classList.toggle('bc-chip--danger', !fixed); bug.textContent = fixed ? '✓ Fixed on phones' : '✕ Text overflows on phones'; } }, [0.60, 0.72]],
        ...ctas.map((b, i) => [B(b, who(6 + i), i ? 'neutral' : 'accent'), [0.76 + i * 0.06, 0.86 + i * 0.06]]),
        [T(q('.hero__wa'), 'client'), [0.80, 0.94]],
    ];
    // Free-roaming cursors with keyframe paths, [p, x%, y%].
    const roam = [
        ['QA', 'danger', [[0.50, 90, 90], [0.60, 78, 70], [0.72, 74, 62], [0.76, 92, 96]]],
        ['dev', 'neutral', [[0.56, 4, 92], [0.64, 70, 66], [0.74, 76, 64], [0.80, 50, 98]]],
        ['SEO', 'neutral', [[0.20, 2, 30], [0.40, 30, 12], [0.60, 6, 60]]],
        ['a11y', 'neutral', [[0.36, 98, 20], [0.52, 64, 40], [0.70, 98, 50]]],
    ].map(([n, tone, keys]) => ({ node: cursor(n, tone), keys }));

    const path = (keys, p) => {
        if (p < keys[0][0] || p > keys.at(-1)[0]) return null;
        const i = keys.findIndex((k) => k[0] >= p);
        const [a, b] = i <= 0 ? [keys[0], keys[0]] : [keys[i - 1], keys[i]];
        const t = b[0] === a[0] ? 1 : ease((p - a[0]) / (b[0] - a[0]));
        return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    };

    let queued = false;
    const frame = () => {
        queued = false;
        const r = hero.getBoundingClientRect();
        const p = clamp(-r.top / (hero.offsetHeight - stage.offsetHeight));
        tracks.forEach(([prim, span]) => prim.render(local(span, p)));
        const W = stage.clientWidth, H = stage.clientHeight;
        roam.forEach(({ node, keys }) => {
            const xy = path(keys, p);
            if (!xy) { node.remove(); return; }
            if (!node.isConnected) layer.append(node);
            place(node, (xy[0] / 100) * (W - 90), (xy[1] / 100) * (H - 40));
        });
        const beat = [...BEATS].reverse().find((b) => p >= b.at[0]);
        say.textContent = p >= 0.96 ? 'Built — scroll on' : `${BEATS.indexOf(beat) + 1}/${BEATS.length} · ${beat.say}`;
    };
    const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    frame();
}

// ---------- Auto-scroll on load (homepage) ----------
export function initAutoplay() {
    const hero = document.querySelector('.hero[data-timeline]');
    if (!hero || !document.documentElement.classList.contains('is-build') || location.hash) return;
    const btn = mk('button', 'bc-autoplay');
    btn.type = 'button';
    document.body.append(btn);
    let raf = 0;
    const STOPS = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    const stop = (e) => {
        if (e && e.type !== 'wheel' && e.target instanceof Node && btn.contains(e.target)) return; // the button's own click toggles
        cancelAnimationFrame(raf);
        raf = 0;
        STOPS.forEach((t) => removeEventListener(t, stop));
        btn.textContent = 'Replay ↺';
    };
    const start = () => {
        scrollTo({ top: 0, behavior: 'instant' });
        // Hero takes ~11 s; the rest of the page continues at the same speed.
        const speed = Math.max(hero.offsetHeight - innerHeight, innerHeight * 3) / 11000;
        const t0 = performance.now();
        const step = (t) => {
            const max = document.documentElement.scrollHeight - innerHeight;
            const y = Math.min(max, (t - t0) * speed);
            scrollTo({ top: y, behavior: 'instant' });
            if (y < max) raf = requestAnimationFrame(step); else stop();
        };
        STOPS.forEach((t) => addEventListener(t, stop, { passive: true }));
        btn.textContent = 'Autoplay ⏸';
        raf = requestAnimationFrame(step);
    };
    btn.addEventListener('click', () => (raf ? stop() : start()));
    history.scrollRestoration = 'manual';
    start();
}
