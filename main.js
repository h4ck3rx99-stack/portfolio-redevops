(() => {
    const $ = (s, el = document) => el.querySelector(s);
    const $$ = (s, el = document) => [...el.querySelectorAll(s)];
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* ---------- Smooth scroll (desktop pointers only) ---------- */
    let lenis = null;
    if (window.Lenis && finePointer && !reduceMotion) {
        lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
    }

    const scrollToTarget = (target) => {
        if (lenis) lenis.scrollTo(target, { offset: -90 });
        else {
            const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - 90;
            window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    };

    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const id = a.getAttribute('href');
            if (id === '#') return;
            const el = id === '#top' ? 0 : $(id);
            if (el === null) return;
            e.preventDefault();
            closeMenu();
            scrollToTarget(el);
        });
    });

    /* ---------- Mobile menu ---------- */
    const toggle = $('#navToggle');
    const links = $('#navLinks');
    function closeMenu() {
        if (!toggle) return;
        toggle.setAttribute('aria-expanded', 'false');
        links.classList.remove('open');
    }
    toggle?.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        links.classList.toggle('open', open);
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    /* ---------- About: split statement into words ---------- */
    const statement = $('#aboutStatement');
    let words = [];
    if (statement) {
        statement.innerHTML = statement.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
        words = $$('.w', statement);
        if (reduceMotion) words.forEach(w => w.classList.add('on'));
    }

    /* ---------- Scroll-linked state (one rAF per scroll burst) ---------- */
    const nav = $('#siteNav');
    const progress = $('#scrollProgress');
    const navLinks = $$('.nav-links a');
    const sections = navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean);
    let ticking = false;
    let lastLit = -1;

    const onScroll = () => {
        const y = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        nav.classList.toggle('scrolled', y > 24);

        let current = '';
        for (const s of sections) if (s.getBoundingClientRect().top <= 140) current = s.id;
        navLinks.forEach(a => a.classList.toggle('active', a.dataset.section === current));

        if (words.length && !reduceMotion) {
            const r = statement.getBoundingClientRect();
            const vh = window.innerHeight;
            const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
            const lit = Math.round(p * words.length);
            if (lit !== lastLit) {
                words.forEach((w, i) => w.classList.toggle('on', i < lit));
                lastLit = lit;
            }
        }
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
    }, { passive: true });
    onScroll();

    /* ---------- Reveal on enter ---------- */
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('in');
            io.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    $$('.reveal, .tile').forEach(el => io.observe(el));

    /* ---------- Uptime bars ---------- */
    const bars = $('.uptime-bars');
    if (bars) {
        bars.innerHTML = Array.from({ length: 30 }, (_, i) =>
            `<i class="${i === 11 ? 'warn' : ''}" style="transition-delay:${i * 22}ms"></i>`).join('');
    }

    /* ---------- Pointer effects (desktop) ---------- */
    if (finePointer && !reduceMotion) {
        // Hero: accent dots follow the cursor through a CSS mask
        const hero = $('.hero');
        const heroBg = $('.hero-bg');
        let hx = 0, hy = 0, heroQueued = false;
        hero?.addEventListener('pointermove', e => {
            const r = hero.getBoundingClientRect();
            hx = e.clientX - r.left; hy = e.clientY - r.top;
            if (heroQueued) return;
            heroQueued = true;
            requestAnimationFrame(() => {
                heroBg.style.setProperty('--mx', hx + 'px');
                heroBg.style.setProperty('--my', hy + 'px');
                heroQueued = false;
            });
        });

        // Spotlight borders
        $$('.spotlight').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--sx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--sy', (e.clientY - r.top) + 'px');
            });
        });

        // Magnetic primary CTA
        $$('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - r.left - r.width / 2) * 0.18;
                const dy = (e.clientY - r.top - r.height / 2) * 0.28;
                btn.style.transform = `translate(${dx}px, ${dy}px)`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
    }

    /* ---------- Editor tabs ---------- */
    const tabs = $$('.editor-tab');
    tabs.forEach(tab => tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', String(t === tab)); });
        $$('.code').forEach(c => c.classList.toggle('active', c.id === `tabContent_${tab.dataset.tab}`));
    }));

    /* ---------- Simulated deploy ---------- */
    const runBtn = $('#runPipelineBtn');
    const term = $('#terminalOverlay');
    const termBody = $('#terminalBody');
    let running = false;
    const logs = [
        ['$ npm run ship', 80, '#ededef'],
        ['> lint + typecheck', 380, '#8d8d96'],
        ['  ✓ 0 errors, 0 warnings', 220, '#8d8d96'],
        ['> next build', 420, '#8d8d96'],
        ['  ✓ compiled 42 routes in 8.4s', 520, '#8d8d96'],
        ['  ✓ first load JS: 86.2 kB', 180, '#8d8d96'],
        ['> test', 380, '#8d8d96'],
        ['  ✓ 128 passed', 460, '#8d8d96'],
        ['> docker build → push → rollout', 420, '#8d8d96'],
        ['  ✓ ap-south-1 · 3/3 pods healthy', 640, '#8d8d96'],
        ['> lighthouse', 360, '#8d8d96'],
        ['  perf 98 · seo 100 · a11y 96', 420, '#f0b37e'],
        ['', 120, ''],
        ['✓ live at https://your-idea.com', 260, '#d4f56b'],
    ];
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    runBtn?.addEventListener('click', async () => {
        if (running) return;
        running = true;
        term.classList.add('active');
        termBody.textContent = '';
        for (const [text, delay, color] of logs) {
            await sleep(reduceMotion ? 0 : delay);
            if (!term.classList.contains('active')) break;
            const row = document.createElement('div');
            row.className = 'terminal-log-row';
            row.style.color = color;
            row.textContent = text || ' ';
            termBody.appendChild(row);
            termBody.scrollTop = termBody.scrollHeight;
        }
        if (term.classList.contains('active')) {
            const c = document.createElement('span');
            c.className = 'terminal-cursor';
            termBody.appendChild(c);
        }
        running = false;
    });
    $('#terminalCloseBtn')?.addEventListener('click', () => term.classList.remove('active'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') term?.classList.remove('active'); });

    /* ---------- Studio build links work offline too ---------- */
    if (location.protocol === 'file:') {
        $$('[data-local]').forEach(a => { a.href = a.dataset.local; a.target = '_self'; });
    }

    /* ---------- FAQ: one open at a time ---------- */
    const faqs = $$('.faq-item');
    faqs.forEach(d => d.addEventListener('toggle', () => {
        if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
    }));

    /* ---------- Calendly, loaded on first click ---------- */
    let calendlyLoading = null;
    const loadCalendly = () => calendlyLoading ??= new Promise((resolve, reject) => {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://assets.calendly.com/assets/external/widget.css';
        document.head.appendChild(css);
        const s = document.createElement('script');
        s.src = 'https://assets.calendly.com/assets/external/widget.js';
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
    $$('.trigger-calendly').forEach(btn => btn.addEventListener('click', async e => {
        e.preventDefault();
        try {
            await loadCalendly();
            window.Calendly.initPopupWidget({ url: 'https://calendly.com/redevops3/30min' });
        } catch {
            window.open('https://calendly.com/redevops3/30min', '_blank', 'noopener');
        }
    }));

    /* ---------- Contact form ---------- */
    const form = $('#contactForm');
    form?.addEventListener('submit', e => {
        e.preventDefault();
        const name = $('#formName'), email = $('#formEmail'), msg = $('#formMessage');
        const checks = [
            [name, name.value.trim().length > 1],
            [email, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())],
            [msg, msg.value.trim().length > 5],
        ];
        let firstBad = null;
        checks.forEach(([el, ok]) => {
            el.closest('.field').classList.toggle('invalid', !ok);
            el.setAttribute('aria-invalid', String(!ok));
            if (!ok && !firstBad) firstBad = el;
        });
        if (firstBad) { firstBad.focus(); return; }

        const needs = $$('input[name="need"]:checked', form).map(i => i.value).join(', ') || 'Not specified';
        const subject = encodeURIComponent(`Project enquiry from ${name.value.trim()}`);
        const body = encodeURIComponent(`Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\nNeeds: ${needs}\n\n${msg.value.trim()}`);
        window.location.href = `mailto:hello@redevops.in?subject=${subject}&body=${body}`;

        form.innerHTML = `
            <div class="form-done">
                <div class="form-done-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
                <h3>Your email app should be open.</h3>
                <p>Hit send there and we'll get back to you within a day. If nothing opened, write to <a class="text-link" href="mailto:hello@redevops.in">hello@redevops.in</a>.</p>
            </div>`;
    });
    $$('#contactForm input, #contactForm textarea').forEach(el =>
        el.addEventListener('input', () => el.closest('.field')?.classList.remove('invalid')));
})();
