// Existing delivery hook. No destination is configured in this checkout.
const LEAD_WEBHOOK_URL = '';
export const WHATSAPP_NUMBER = '918734000403';
const MAIL_TO = 'hello@redevops.in';
export function buildMailto({ name, email, message }) {
    return `mailto:${MAIL_TO}?subject=${encodeURIComponent(`Project Inquiry from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`)}`;
}
export function buildWhatsAppUrl(text) { return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`; }
window.sendLead = async lead => {
    if (!LEAD_WEBHOOK_URL) return { ok: false, error: 'Direct sending is not configured. Please use the email link below.' };
    try {
        const response = await fetch(LEAD_WEBHOOK_URL, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(15000),
            body: JSON.stringify({ ...lead, page: location.href, referrer: document.referrer || null, submittedAt: new Date().toISOString() }),
        });
        return response.ok ? { ok: true } : { ok: false, error: `Sending failed (HTTP ${response.status}). Please try again or email us.` };
    } catch { return { ok: false, error: 'The connection failed or timed out. Your message is still here. Please try again or email us.' }; }
};
export function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const error = document.getElementById('formError');
    const submit = form.querySelector('[type="submit"]');
    const fields = ['formName', 'formEmail', 'formMessage'].map(id => document.getElementById(id));
    const fallback = document.createElement('a');
    fallback.className = 'text-link text-link--tap';
    fallback.textContent = 'Prepare this enquiry in your email app ↗';
    fallback.href = 'mailto:hello@redevops.in';
    form.append(fallback);
    const values = () => Object.fromEntries(fields.map(field => [field.name, field.value.trim()]));
    const openedAt = Date.now();
    let pending = false;
    fields.forEach(field => field.addEventListener('input', () => {
        field.removeAttribute('aria-invalid');
        fallback.href = buildMailto(values());
    }));
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (pending) return;
        error.hidden = true;
        const lead = values();
        const messages = [!lead.name && 'Please enter your name.', !fields[1].validity.valid && 'Please enter a valid email address.', lead.message.length < 5 && 'Please add a message of at least five characters.'];
        fields.forEach((field, i) => field.setAttribute('aria-invalid', String(!!messages[i])));
        const invalid = messages.findIndex(Boolean);
        if (invalid !== -1) {
            error.textContent = messages.filter(Boolean).join(' ');
            error.hidden = false;
            fields[invalid].focus();
            return;
        }
        if (form.elements.website.value || Date.now() - openedAt < 3000) {
            error.textContent = 'Please wait a moment before sending and try again.';
            error.hidden = false;
            return;
        }
        pending = true;
        submit.disabled = true;
        submit.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
        try {
            const result = await window.sendLead({ source: 'contact-form', ...lead });
            if (result === true || result?.ok === true) {
                const status = document.createElement('p');
                status.className = 'form-success';
                status.setAttribute('role', 'status');
                status.tabIndex = -1;
                status.textContent = 'Your enquiry was sent. Thank you for telling us about your project.';
                form.replaceWith(status);
                status.focus();
            } else {
                error.textContent = result?.error || 'Sending failed. Your message is still here. Please try again or email us.';
                error.hidden = false;
            }
        } catch {
            error.textContent = 'Sending failed. Your message is still here. Please try again or email us.';
            error.hidden = false;
        } finally {
            pending = false;
            submit.disabled = false;
            submit.textContent = 'Send enquiry';
            form.removeAttribute('aria-busy');
        }
    });
    submit.disabled = false;
}
