// Header state, mobile menu sheet, scroll-spy.

export function initNav() {
    const header = document.querySelector('.site-header');
    if (header) {
        const update = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
        update();
        window.addEventListener('scroll', update, { passive: true });
    }

    initMenu();
    initScrollSpy();
}

function initMenu() {
    const toggle = document.querySelector('.menu-toggle');
    const sheet = document.getElementById('site-menu');
    if (!toggle || !sheet) return;
    const close = sheet.querySelector('.menu-sheet__close');
    const background = () => [...document.body.children].filter(el => el !== sheet && !el.contains(sheet) && el.tagName !== 'SCRIPT');
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.setAttribute('aria-label', 'Site navigation');
    const focusables = () => [...sheet.querySelectorAll('a[href], button:not([disabled])')];

    const open = () => {
        sheet.hidden = false;
        background().forEach(el => el.inert = true);
        document.body.classList.add('is-locked');
        toggle.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => sheet.classList.add('is-open'));
        const first = sheet.querySelector('.menu-sheet__links a');
        (first || close).focus();
        document.addEventListener('keydown', onKey);
    };

    const shut = (returnFocus = true) => {
        sheet.classList.remove('is-open');
        document.body.classList.remove('is-locked');
        toggle.setAttribute('aria-expanded', 'false');
        document.removeEventListener('keydown', onKey);
        sheet.hidden = true;
        background().forEach(el => el.inert = false);
        if (returnFocus) toggle.focus();
    };

    function onKey(e) {
        if (e.key === 'Escape') { shut(); return; }
        if (e.key !== 'Tab') return;
        const items = focusables();
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    toggle.addEventListener('click', open);
    close?.addEventListener('click', () => shut());
    sheet.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        // Same-page anchors: close first, then let the browser jump.
        shut(false);
        const url = new URL(link.href);
        if (url.pathname === location.pathname && url.hash) {
            const target = document.getElementById(url.hash.slice(1));
            if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
        }
    });
    // Leaving the mobile layout with the sheet open should not leave the page locked.
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (mq) => {
        if (mq.matches && !sheet.hidden) shut(false);
    });
}

function initScrollSpy() {
    const links = [...document.querySelectorAll('.site-nav__link[href^="#"]')];
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const sections = [...byId.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const visible = new Set();

    const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => (en.isIntersecting ? visible.add(en.target.id) : visible.delete(en.target.id)));
        const current = sections.find((s) => visible.has(s.id));
        links.forEach((a) => a.removeAttribute('aria-current'));
        if (current) byId.get(current.id).setAttribute('aria-current', 'true');
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach((s) => io.observe(s));
}
