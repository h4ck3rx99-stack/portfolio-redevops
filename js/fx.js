// Pointer interactions (ported 21st.dev / componentry patterns): rolling link text,
// magnetic buttons, tilting project shots and a design-tool crosshair in the hero.
// Mouse/trackpad only, never under reduced motion; one rAF per pointer move, transforms only.
export function initFx() {
    if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
    document.documentElement.classList.add('fx');

    // Rolling text: the label slides up and a copy rolls in from below (CSS).
    document.querySelectorAll('.site-nav__link, .text-link, .site-footer a').forEach((a) => {
        if (a.children.length || !a.textContent.trim()) return;
        const text = a.textContent;
        const roll = document.createElement('span');
        roll.className = 'fx-roll';
        roll.dataset.text = text;
        roll.append(Object.assign(document.createElement('span'), { textContent: text }));
        a.replaceChildren(roll);
    });

    const magnets = '.btn--primary, .btn--ink';
    const tilts = 'a .shot';
    let target = null, ev = null, queued = false;
    const reset = (el) => { if (el) { el.style.removeProperty('--mx'); el.style.removeProperty('--my'); el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); } };

    const hair = buildCrosshair();

    const frame = () => {
        queued = false;
        if (target) {
            const r = target.getBoundingClientRect();
            const dx = (ev.clientX - r.left) / r.width - 0.5, dy = (ev.clientY - r.top) / r.height - 0.5;
            if (target.matches(magnets)) {
                target.style.setProperty('--mx', `${(dx * 14).toFixed(1)}px`);
                target.style.setProperty('--my', `${(dy * 10).toFixed(1)}px`);
            } else {
                target.style.setProperty('--rx', `${(-dy * 6).toFixed(2)}deg`);
                target.style.setProperty('--ry', `${(dx * 8).toFixed(2)}deg`);
            }
        }
        hair?.move(ev);
    };

    addEventListener('pointermove', (e) => {
        const t = e.target.closest?.(`${magnets}, ${tilts}`) || null;
        if (t !== target) { reset(target); target = t; }
        ev = e;
        if (!queued) { queued = true; requestAnimationFrame(frame); }
    }, { passive: true });
    document.addEventListener('pointerleave', () => { reset(target); target = null; hair?.hide(); });
}

// Crosshair + live coordinates over the hero, like the rulers in a design tool.
function buildCrosshair() {
    const stage = document.querySelector('.hero__stage');
    if (!stage) return null;
    const box = document.createElement('div');
    box.className = 'fx-hair';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = '<i class="fx-hair__x"></i><i class="fx-hair__y"></i><span class="fx-hair__xy"></span>';
    stage.append(box);
    const [lx, ly, xy] = box.children;
    let on = false;
    return {
        move(e) {
            const r = stage.getBoundingClientRect();
            const x = e.clientX - r.left, y = e.clientY - r.top;
            const inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height && !e.target.closest('a, button, input');
            if (inside !== on) { on = inside; box.classList.toggle('is-on', on); }
            if (!on) return;
            lx.style.transform = `translateY(${y}px)`;
            ly.style.transform = `translateX(${x}px)`;
            xy.style.transform = `translate(${x + 14}px,${y + 14}px)`;
            xy.textContent = `x ${Math.round(x)}  y ${Math.round(y)}`;
        },
        hide() { on = false; box.classList.remove('is-on'); },
    };
}
