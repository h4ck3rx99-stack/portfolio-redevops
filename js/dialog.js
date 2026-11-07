// Native modality supplies inert background; explicitly wrap Tab and lock page scroll.
export function prepareDialog(dialog) {
    dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const items = [...dialog.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),iframe')]
            .filter(el => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault(); first.focus();
        }
    });
    dialog.addEventListener('close', () => document.body.classList.remove('is-locked'));
}
export function openDialog(dialog) {
    dialog.showModal();
    document.body.classList.add('is-locked');
    dialog.querySelector('.dialog-close').focus();
}
