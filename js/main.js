import { initDeeplinks } from './deeplinks.js';
import { initNav } from './nav.js';
import { initIndexPreview } from './index-preview.js';
import { initContact } from './contact.js';
import { initWhatsApp } from './whatsapp.js';
import { initCalendly } from './calendly.js';
import { initReveal } from './reveal.js';

// Design lab previews: palette/font via query string, local hosts only.
if (['localhost', '127.0.0.1'].includes(location.hostname)) {
    const q = new URLSearchParams(location.search);
    const palette = q.get('lab-palette');
    const font = q.get('lab-font');
    const fonts = {
        space: '"Space Grotesk", sans-serif',
        newsreader: '"Newsreader", Georgia, serif',
    };
    if (palette) document.documentElement.dataset.palette = palette;
    if (font && fonts[font]) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap';
        document.head.appendChild(link);
        document.documentElement.style.setProperty('--font-display', fonts[font]);
    }
}

initDeeplinks();
initNav();
initIndexPreview();
initContact();
initWhatsApp();
initCalendly();
initReveal();
