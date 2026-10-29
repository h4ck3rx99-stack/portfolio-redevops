// Design lab controls: palette, display font, hero concept tabs, scaled viewport previews.
(() => {
    const root = document.documentElement;
    const FONTS = {
        bricolage: '"Bricolage Grotesque", "Bricolage Fallback", Arial, sans-serif',
        space: '"Space Grotesk", sans-serif',
        newsreader: '"Newsreader", Georgia, serif',
    };
    const store = {
        get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
        set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
    };
    const state = { palette: store.get('lab-palette') || 'ledger', font: store.get('lab-font') || 'bricolage' };

    const apply = () => {
        root.dataset.palette = state.palette;
        root.style.setProperty('--font-display', FONTS[state.font]);
        document.querySelectorAll('.seg').forEach((seg) => {
            const key = seg.dataset.control;
            seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state[key])));
        });
        document.querySelectorAll('.pv iframe').forEach((f) => {
            const fontQ = state.font === 'bricolage' ? '' : `&lab-font=${state.font}`;
            const src = `${f.dataset.src}?lab-palette=${state.palette}${fontQ}`;
            if (f.getAttribute('src') !== src) f.src = src;
        });
    };

    document.querySelectorAll('.seg').forEach((seg) => {
        seg.addEventListener('click', (e) => {
            const b = e.target.closest('button');
            if (!b) return;
            state[seg.dataset.control] = b.dataset.value;
            store.set(`lab-${seg.dataset.control}`, b.dataset.value);
            apply();
        });
    });

    // Concepts 2 and 3 preview their own palette, regardless of the global one.
    document.querySelectorAll('[data-palette-local]').forEach((el) => el.setAttribute('data-palette', el.dataset.paletteLocal));

    // Tabs (arrow keys move between them)
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
        tabs.forEach((t) => {
            const on = t === tab;
            t.setAttribute('aria-selected', String(on));
            t.tabIndex = on ? 0 : -1;
            document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
        });
        tab.focus();
    };
    tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') select(tabs[(i + 1) % tabs.length]);
            if (e.key === 'ArrowLeft') select(tabs[(i - 1 + tabs.length) % tabs.length]);
        });
    });

    // Scale each iframe so a full-width viewport fits its column.
    const fit = () => document.querySelectorAll('.pv').forEach((pv) => {
        const w = +pv.dataset.w, h = +pv.dataset.h;
        const scale = pv.clientWidth / w;
        const f = pv.querySelector('iframe');
        f.style.width = `${w}px`;
        f.style.height = `${h}px`;
        f.style.transform = `scale(${scale})`;
        pv.style.height = `${h * scale}px`;
    });
    window.addEventListener('resize', fit);

    apply();
    fit();
})();
