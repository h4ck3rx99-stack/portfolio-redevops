import { prepareDialog, openDialog } from './dialog.js';
// Native modal provides focus containment, Escape and an inert background.
const BOOKING_URL = 'https://calendly.com/redevops3/30min';
export function initCalendly() {
    let dialog;
    let opener;
    document.addEventListener('click', event => {
        const trigger = event.target.closest('[data-calendly]');
        if (!trigger || event.ctrlKey || event.metaKey || event.shiftKey) return;
        event.preventDefault();
        opener = trigger;
        if (!dialog) {
            dialog = document.createElement('dialog');
            dialog.className = 'site-dialog booking-dialog';
            dialog.setAttribute('aria-labelledby', 'booking-title');
            dialog.innerHTML = `<button type="button" class="dialog-close" aria-label="Close booking">×</button><h2 id="booking-title">An introductory conversation</h2><p>Calendly handles scheduling and receives your connection information when you load its booking calendar. Analytics consent is not required.</p><div class="btn-row"><button type="button" class="btn btn--primary" data-load-booking>Load booking calendar</button><a class="text-link text-link--tap" href="${BOOKING_URL}" target="_blank" rel="noopener">Open Calendly in a new tab ↗</a></div><div data-calendar></div>`;
            document.body.append(dialog);
            prepareDialog(dialog);
            const close = () => { dialog.close(); opener?.focus(); };
            dialog.querySelector('.dialog-close').addEventListener('click', close);
            dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
            dialog.querySelector('[data-load-booking]').addEventListener('click', e => {
                const frame = document.createElement('iframe');
                frame.title = 'Book a 30-minute call with RE Dev Ops';
                frame.src = `${BOOKING_URL}?embed_type=Inline&hide_gdpr_banner=0`;
                frame.style.cssText = 'width:100%;height:560px;border:0;margin-top:24px';
                dialog.querySelector('[data-calendar]').append(frame);
                e.target.disabled = true;
                e.target.textContent = 'Calendar loaded below';
                frame.focus();
            });
        }
        openDialog(dialog);
    });
}
