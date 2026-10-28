// Calendly popup, loaded on first click. Buttons are real links to the
// booking page, so they still work if the script is blocked or fails.
const URL_30 = 'https://calendly.com/redevops3/30min';
let loading = null;

function load() {
    loading ??= new Promise((resolve, reject) => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(css);
        const s = document.createElement('script');
        s.src = 'https://assets.calendly.com/assets/external/widget.js';
        s.async = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    return loading;
}

export function initCalendly() {
    document.addEventListener('click', async (e) => {
        const trigger = e.target.closest('[data-calendly]');
        if (!trigger) return;
        if (e.ctrlKey || e.metaKey || e.shiftKey) return; // let modified clicks open the link
        e.preventDefault();
        try {
            await load();
            window.Calendly.initPopupWidget({ url: URL_30 });
        } catch {
            window.open(URL_30, '_blank', 'noopener');
        }
    });
}
