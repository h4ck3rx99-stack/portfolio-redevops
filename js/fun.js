// Interactive moments. Nothing animates unless someone is interacting.

export function initFun() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-nfc-demo]').forEach((el) => nfcDemo(el, reduce));
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
