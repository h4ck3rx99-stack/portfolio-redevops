// WhatsApp chat widget. Markup is injected so every page shares one copy
// (the widget needs JS to work at all, so nothing is lost without it).
import { buildWhatsAppUrl } from './contact.js';

const ICON_WA = '<svg class="wa-icon" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C8.86 3 3.03 8.82 3.03 16c0 2.3.6 4.54 1.74 6.52L3 29l6.65-1.74A12.96 12.96 0 0 0 16.04 29C23.2 29 29 23.18 29 16S23.2 3 16.04 3zm0 23.7c-1.95 0-3.86-.52-5.53-1.51l-.4-.24-3.95 1.03 1.05-3.85-.26-.4A10.66 10.66 0 0 1 5.33 16c0-5.9 4.8-10.7 10.71-10.7 5.9 0 10.66 4.8 10.66 10.7 0 5.9-4.77 10.7-10.66 10.7zm5.87-8.02c-.32-.16-1.9-.94-2.2-1.04-.29-.11-.5-.16-.72.16-.21.32-.83 1.04-1.01 1.25-.19.21-.37.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.95-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.15-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.77.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.9-.78 2.17-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37z"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';
const ICON_SEND = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6l-.01 6.53L15 12 3.39 13.87z"/></svg>';

const TEMPLATE = `
<div class="wa-panel" id="waPanel" role="dialog" aria-modal="false" aria-labelledby="waTitle" aria-hidden="true">
  <div class="wa-header">
    <div class="wa-avatar" aria-hidden="true">RE</div>
    <div class="wa-header-text">
      <span class="wa-title" id="waTitle">RE Dev Ops</span>
      <span class="wa-status">Usually replies within 6–12 hours</span>
    </div>
    <button type="button" class="wa-close" id="waClose" aria-label="Close chat">${ICON_X}</button>
  </div>
  <div class="wa-body" id="waBody">
    <div class="wa-msg wa-msg-in">Hi there. Tell us a little about your project — a website, app, or cloud setup — and we'll get back to you on WhatsApp.<span class="wa-time">RE Dev Ops</span></div>
    <div class="wa-quick" id="waQuick">
      <button type="button" data-msg="Hi! I'd like a quote for a website.">Website quote</button>
      <button type="button" data-msg="Hi! I want to build a web or mobile app.">Build an app</button>
      <button type="button" data-msg="Hi! I need help with hosting / cloud / DevOps.">Cloud &amp; DevOps</button>
    </div>
  </div>
  <form class="wa-input" id="waForm">
    <textarea id="waText" rows="1" placeholder="Type your message…" aria-label="Your message" maxlength="1000" enterkeyhint="send"></textarea>
    <button type="submit" class="wa-send" aria-label="Send on WhatsApp">${ICON_SEND}</button>
  </form>
  <p class="wa-note">Opens WhatsApp with your message ready to send.</p>
</div>
<button type="button" class="wa-fab" id="waFab" aria-label="Chat with us on WhatsApp" aria-expanded="false" aria-controls="waPanel">${ICON_WA}<span class="wa-x">${ICON_X}</span></button>`;

export function initWhatsApp() {
    if (document.body.hasAttribute('data-no-wa-fab')) return;
    const widget = document.createElement('div');
    widget.className = 'wa-widget';
    widget.id = 'waWidget';
    widget.innerHTML = TEMPLATE;
    document.body.appendChild(widget);

    const panel = widget.querySelector('#waPanel');
    const fab = widget.querySelector('#waFab');
    const form = widget.querySelector('#waForm');
    const text = widget.querySelector('#waText');
    const body = widget.querySelector('#waBody');

    const setOpen = (open) => {
        widget.classList.toggle('open', open);
        panel.setAttribute('aria-hidden', String(!open));
        fab.setAttribute('aria-expanded', String(open));
        fab.setAttribute('aria-label', open ? 'Close chat' : 'Chat with us on WhatsApp');
        if (open) setTimeout(() => text.focus({ preventScroll: true }), 240);
    };

    fab.addEventListener('click', () => setOpen(!widget.classList.contains('open')));
    widget.querySelector('#waClose').addEventListener('click', () => { setOpen(false); fab.focus(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && widget.classList.contains('open')) { setOpen(false); fab.focus(); }
    });

    const grow = () => { text.style.height = 'auto'; text.style.height = `${Math.min(text.scrollHeight, 120)}px`; };
    text.addEventListener('input', grow);
    text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); }
    });

    widget.querySelectorAll('#waQuick button').forEach((btn) => {
        btn.addEventListener('click', () => { text.value = btn.dataset.msg; grow(); text.focus(); });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const msg = text.value.trim();
        if (!msg) {
            text.focus();
            widget.classList.add('shake');
            setTimeout(() => widget.classList.remove('shake'), 400);
            return;
        }
        const bubble = document.createElement('div');
        bubble.className = 'wa-msg wa-msg-out';
        bubble.textContent = msg;
        body.appendChild(bubble);
        body.scrollTop = body.scrollHeight;

        window.sendLead?.({ source: 'whatsapp-widget', message: msg });
        window.open(buildWhatsAppUrl(`${msg}\n\n— sent from redevops.in`), '_blank', 'noopener');
        text.value = '';
        grow();
    });

    // Tuck the FAB away where the page already offers WhatsApp (contact + footer).
    const zones = [...document.querySelectorAll('#contact, .site-footer')];
    if (zones.length && 'IntersectionObserver' in window) {
        const inView = new Set();
        const io = new IntersectionObserver((entries) => {
            entries.forEach((en) => (en.isIntersecting ? inView.add(en.target) : inView.delete(en.target)));
            widget.classList.toggle('is-tucked', inView.size > 0);
        });
        zones.forEach((z) => io.observe(z));
    }
}
