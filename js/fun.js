// Playful, pointer-driven moments. Nothing animates unless someone is interacting.

export function initFun() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) document.querySelectorAll('[data-wobble]').forEach(wobble);
    document.querySelectorAll('[data-nfc-demo]').forEach((el) => nfcDemo(el, reduce));
}

// Letters lean and lift toward the cursor. Transforms only, so layout never shifts.
function wobble(el) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const letters = [];
    const split = (node) => {
        [...node.childNodes].forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
                const frag = document.createDocumentFragment();
                // Keep each word together so wrapping never changes.
                child.textContent.split(/(\s+)/).forEach((part) => {
                    if (!part) return;
                    if (/^\s+$/.test(part)) { frag.append(part); return; }
                    const word = document.createElement('span');
                    word.className = 'wb-word';
                    word.setAttribute('aria-hidden', 'true');
                    [...part].forEach((ch) => {
                        const s = document.createElement('span');
                        s.className = 'wb';
                        s.textContent = ch;
                        word.append(s);
                        letters.push(s);
                    });
                    frag.append(word);
                });
                child.replaceWith(frag);
            } else if (child.nodeType === Node.ELEMENT_NODE) {
                split(child);
            }
        });
    };
    split(el);

    let centres = [];
    const measure = () => {
        centres = letters.map((s) => {
            const r = s.getBoundingClientRect();
            return [r.left + r.width / 2 + window.scrollX, r.top + r.height / 2 + window.scrollY];
        });
    };
    let px = 0, py = 0, queued = false, active = false;
    const RADIUS = 160;

    const frame = () => {
        queued = false;
        letters.forEach((s, i) => {
            if (!active) { s.style.transform = ''; return; }
            const dx = px - centres[i][0], dy = py - centres[i][1];
            const d = Math.hypot(dx, dy);
            const t = Math.max(0, 1 - d / RADIUS);
            s.style.transform = t ? `translateY(${(-0.12 * t).toFixed(3)}em) rotate(${(dx > 0 ? -1 : 1) * 8 * t}deg) scale(${1 + 0.12 * t})` : '';
            s.classList.toggle('is-hot', t > 0.72);
        });
    };
    const request = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

    el.addEventListener('pointerenter', () => { measure(); active = true; });
    el.addEventListener('pointermove', (e) => { px = e.pageX; py = e.pageY; request(); });
    el.addEventListener('pointerleave', () => { active = false; letters.forEach((s) => s.classList.remove('is-hot')); request(); });
    window.addEventListener('resize', () => { if (active) measure(); });
}

// NFC demo: pick a destination, the card taps the phone, the screen changes.
function nfcDemo(root, reduce) {
    const opts = [...root.querySelectorAll('.nfc-demo__opt')];
    const screens = [...root.querySelectorAll('.nfc-demo__screen')];
    const status = root.querySelector('[data-nfc-status]');
    const stage = root.querySelector('.nfc-demo__stage');
    let timer;

    const choose = (btn) => {
        opts.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const key = btn.dataset.target;
        stage.classList.remove('is-tapping');
        void stage.offsetWidth; // restart the CSS animation
        stage.classList.add('is-tapping');
        clearTimeout(timer);
        const show = () => {
            screens.forEach((s) => { s.hidden = s.dataset.screen !== key; });
            status.textContent = `Tapping now opens: ${btn.textContent}`;
        };
        if (reduce) show(); else timer = setTimeout(show, 380);
    };
    opts.forEach((b) => b.addEventListener('click', () => choose(b)));
    stage.addEventListener('animationend', () => stage.classList.remove('is-tapping'));
}
