// Hero project index: hovering or focusing a row swaps the preview screenshot.
// Images other than the default load on first hover/focus only.

export function initIndexPreview() {
    const list = document.querySelector('[data-pindex]');
    const frame = document.querySelector('[data-preview]');
    if (!list || !frame) return;
    const caption = document.querySelector('[data-preview-caption]');
    const rows = [...list.querySelectorAll('.pindex__row')];
    let front = frame.querySelector('.preview__img');
    let back = front.cloneNode();
    back.classList.add('is-hidden');
    back.removeAttribute('fetchpriority');
    back.setAttribute('aria-hidden', 'true');
    back.alt = '';
    frame.appendChild(back);
    let active = rows.find((r) => r.classList.contains('is-active')) || rows[0];
    let token = 0;

    const show = async (row) => {
        if (row === active) return;
        active?.classList.remove('is-active');
        active = row;
        row.classList.add('is-active');
        const { src, srcset, alt, caption: text } = row.dataset;
        const mine = ++token;
        back.srcset = srcset || '';
        back.src = src;
        back.alt = alt;
        try { await back.decode(); } catch { /* show anyway */ }
        if (mine !== token) return;
        back.classList.remove('is-hidden');
        back.removeAttribute('aria-hidden');
        front.classList.add('is-hidden');
        front.setAttribute('aria-hidden', 'true');
        front.alt = '';
        [front, back] = [back, front];
        if (caption && text) caption.textContent = text;
    };

    // Only swap on devices that can hover; on touch the rows are plain links.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)');
    rows.forEach((row) => {
        const link = row.querySelector('a');
        row.addEventListener('pointerenter', () => { if (canHover.matches) show(row); });
        link.addEventListener('focus', () => show(row));
    });
}
