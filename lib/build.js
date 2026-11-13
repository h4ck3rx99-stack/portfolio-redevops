// "The site builds itself": named cursors drag out blocks and type text in place, like a
// shared design file. Markup opts in with data attributes (the copy itself is never changed):
//   <section data-build>            a group; plays once when it scrolls into view ("now" = on load)
//   <h2 data-b="type" data-by="copy">  plain-text element typed in place
//   <div data-b="box" data-by="design" data-d="300" data-dur="800">  block dragged out from its corner
// Runs only when <html> has the "building" class (set in the head for motion-OK visitors).

const ease = (d) => d * d * (3 - 2 * d);
const clamp = (v) => Math.min(1, Math.max(0, v));
const mk = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ARROW = '<svg width="16" height="20" viewBox="0 0 16 20" aria-hidden="true"><path d="M1 1v16l4.2-4 2.9 6.2 2.6-1.2-2.8-6H15z" fill="currentColor" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>';

export function cursor(label) {
    const c = mk('span', 'bc-cursor');
    c.dataset.role = label;
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = ARROW;
    c.append(mk('span', 'bc-cursor__tag', label));
    return c;
}

function sel(role) {
    const s = mk('span', 'bc-sel');
    s.dataset.role = role;
    s.setAttribute('aria-hidden', 'true');
    ['nw', 'ne', 'se', 'sw'].forEach((h) => s.append(mk('i', `bc-h bc-h--${h}`)));
    s.append(mk('span', 'bc-sel__size'));
    return s;
}

const at = (el, layer) => {
    const r = el.getBoundingClientRect(), l = layer.getBoundingClientRect();
    return { x: r.left - l.left, y: r.top - l.top };
};
const place = (node, x, y) => { node.style.transform = `translate(${x}px,${y}px)`; };

function box(el, by, layer) {
    const s = sel(by), c = cursor(by);
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
    };
}

// Untyped text keeps its space (visibility:hidden), so the layout never shifts.
function type(el, by, layer) {
    const text = el.textContent;
    const typed = mk('span'), caret = mk('span', 'bc-caret'), rest = mk('span', 'bc-rest');
    const shown = mk('span');
    shown.setAttribute('aria-hidden', 'true');
    shown.append(typed, caret, rest);
    el.replaceChildren(mk('span', 'sr-only', text), shown);
    const c = cursor(by);
    caret.dataset.role = by;
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
    };
}

let replay = () => {};

export function initBuild() {
    const root = document.documentElement;
    if (!root.classList.contains('building')) return replay; // reduced motion, or already started
    const layer = mk('div', 'bc-layer');
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);

    const groups = [...document.querySelectorAll('[data-build]')].map((g) => ({
        el: g,
        gen: 0,
        jobs: [...g.querySelectorAll('[data-b]')].map((el, i) => {
            const by = el.dataset.by || 'design';
            const prim = el.dataset.b === 'type' ? type(el, by, layer) : box(el, by, layer);
            const dur = prim.length ? (prim.length / Number(el.dataset.cps || 160)) * 1000 : Number(el.dataset.dur || 550);
            return { prim, delay: Number(el.dataset.d ?? i * 110), dur };
        }),
    }));
    groups.forEach((g) => g.jobs.forEach((j) => j.prim.render(0)));
    root.classList.remove('building');

    const play = (g) => {
        const gen = ++g.gen, t0 = performance.now();
        const end = Math.max(0, ...g.jobs.map((j) => j.delay + j.dur));
        if (g.el.dataset.build === 'now') dispatchEvent(new CustomEvent('build:state', { detail: 'building' }));
        const tick = (t) => {
            if (gen !== g.gen) return;
            g.jobs.forEach((j) => j.prim.render(clamp((t - t0 - j.delay) / j.dur)));
            if (t - t0 < end) requestAnimationFrame(tick);
            else if (g.el.dataset.build === 'now') dispatchEvent(new CustomEvent('build:state', { detail: 'done' }));
        };
        requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        play(groups.find((g) => g.el === e.target));
    }), { rootMargin: '0px 0px -18% 0px' });
    groups.forEach((g) => (g.el.dataset.build === 'now' ? play(g) : io.observe(g.el)));

    // Replay: rebuild the hero from scratch.
    return replay = () => {
        const hero = groups.find((g) => g.el.dataset.build === 'now');
        if (!hero) return;
        scrollTo({ top: 0, behavior: 'instant' });
        hero.jobs.forEach((j) => j.prim.render(0));
        play(hero);
    };
}

// The visitor joins the file: a "you" name tag follows the pointer, and hovering a
// [data-inspect] block shows its selection outline and live size. Mouse only.
export function initPresence() {
    if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    const you = mk('span', 'bc-you', 'you');
    const ring = mk('span', 'bc-inspect');
    const size = mk('span', 'bc-sel__size');
    ring.append(size);
    [you, ring].forEach((n) => { n.setAttribute('aria-hidden', 'true'); document.body.append(n); });
    let ev = null, queued = false, target = null;
    const frame = () => {
        queued = false;
        you.style.transform = `translate(${ev.clientX + 14}px,${ev.clientY + 16}px)`;
        you.classList.add('is-on');
        const t = ev.target.closest?.('[data-inspect]') || null;
        if (t !== target) { target = t; ring.classList.toggle('is-on', !!t); }
        if (!t) return;
        const r = t.getBoundingClientRect();
        ring.style.transform = `translate(${r.left}px,${r.top}px)`;
        ring.style.width = `${r.width}px`;
        ring.style.height = `${r.height}px`;
        size.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
    };
    const queue = (e) => { if (e.clientX != null) ev = e; if (ev && !queued) { queued = true; requestAnimationFrame(frame); } };
    addEventListener('pointermove', queue, { passive: true });
    addEventListener('scroll', queue, { passive: true });
    document.addEventListener('pointerleave', () => { you.classList.remove('is-on'); ring.classList.remove('is-on'); target = null; });
}
