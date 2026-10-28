// Scroll reveal — progressive enhancement only.
// Elements are visible by default; we hide only those below the first viewport,
// after the observer exists, and a safety timer reveals everything after 1.5 s.

export function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const els = [...document.querySelectorAll('.reveal')].filter(
        (el) => el.getBoundingClientRect().top > window.innerHeight
    );
    if (!els.length) return;

    const reveal = (el) => {
        el.classList.remove('is-pending');
        io.unobserve(el);
    };

    const io = new IntersectionObserver((entries) => {
        entries.filter((en) => en.isIntersecting).forEach((en) => reveal(en.target));
    }, { rootMargin: '0px 0px -8% 0px' });

    // Stagger up to 3 siblings by 60 ms.
    els.forEach((el) => {
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        const i = Math.min(siblings.indexOf(el), 2);
        if (i > 0) el.style.setProperty('--reveal-delay', `${i * 60}ms`);
        el.classList.add('is-pending');
        io.observe(el);
    });

    const revealAll = () => els.forEach(reveal);
    setTimeout(revealAll, 1500);

    // Anchor jumps must never land on blank content.
    const revealTarget = () => {
        const id = location.hash.slice(1);
        const target = id && document.getElementById(id);
        if (target) target.querySelectorAll('.reveal.is-pending').forEach(reveal);
    };
    window.addEventListener('hashchange', revealTarget);
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href^="#"]');
        if (!a) return;
        const target = document.getElementById(a.getAttribute('href').slice(1));
        target?.querySelectorAll('.reveal.is-pending').forEach(reveal);
    });
    revealTarget();
}
