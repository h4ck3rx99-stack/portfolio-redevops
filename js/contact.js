// Contact: lead webhook hook, mail fallback, the form, and the quick brief.

// Paste your n8n webhook URL (Production URL of a "Webhook" node, method POST)
// between the quotes. Leave empty to keep the email-app fallback only.
const LEAD_WEBHOOK_URL = '';

export const WHATSAPP_NUMBER = '918734000403';
const MAIL_TO = 'hello@redevops.in';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function buildMailto({ name, email, message }) {
    const subject = encodeURIComponent(`Project Inquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    return `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
}

export function buildWhatsAppUrl(text) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function briefSentence(need, who) {
    return `Hi! I need ${need} for ${who}.`;
}

const pageLoadedAt = Date.now();

// Global: the WhatsApp widget calls this too.
window.sendLead = async (lead) => {
    if (!LEAD_WEBHOOK_URL) return false;
    try {
        const res = await fetch(LEAD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
            body: JSON.stringify({
                ...lead,
                page: location.href,
                referrer: document.referrer || null,
                submittedAt: new Date().toISOString(),
            }),
        });
        return res.ok;
    } catch {
        return false;
    }
};

export function initContact() {
    initForm();
    initBrief();
}

function initForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    const error = document.getElementById('formError');
    const submit = form.querySelector('[type="submit"]');
    const fields = ['formName', 'formEmail', 'formMessage'].map((id) => document.getElementById(id));

    // Built with textContent so visitor input is never parsed as HTML.
    const showSuccess = (title, text) => {
        const box = document.createElement('div');
        box.className = 'form-success';
        box.setAttribute('role', 'status');
        box.tabIndex = -1;
        const h = document.createElement('h3');
        h.textContent = title;
        const p = document.createElement('p');
        p.textContent = text;
        box.append(h, p);
        form.replaceWith(box);
        box.focus();
    };

    const openMailFallback = (name, email, message) => {
        window.location.href = buildMailto({ name, email, message });
        showSuccess('Almost there', `Your email app should have opened with your message filled in — just hit send. Or email us directly at ${MAIL_TO}.`);
    };

    fields.forEach((f) => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        error.hidden = true;

        const [name, email, message] = fields.map((f) => f.value.trim());
        const honeypot = document.getElementById('formWebsite').value;

        const bad = [!name, !EMAIL_RE.test(email), message.length < 5];
        if (bad.some(Boolean)) {
            fields.forEach((f, i) => (bad[i] ? f.setAttribute('aria-invalid', 'true') : f.removeAttribute('aria-invalid')));
            error.textContent = 'Please add your name, a valid email and a short message.';
            error.hidden = false;
            fields[bad.indexOf(true)].focus();
            return;
        }

        // Bots fill hidden fields or submit instantly; quietly pretend success.
        if (honeypot || Date.now() - pageLoadedAt < 3000) {
            showSuccess('Message sent', 'Thanks — we usually reply within 6–12 hours.');
            return;
        }

        if (!LEAD_WEBHOOK_URL) {
            openMailFallback(name, email, message);
            return;
        }

        submit.disabled = true;
        submit.textContent = 'Sending…';
        const ok = await window.sendLead({ source: 'contact-form', name, email, message });
        if (ok) {
            showSuccess('Message sent', `Thanks ${name.split(' ')[0]} — we usually reply within 6–12 hours. Keep an eye on ${email}.`);
        } else {
            openMailFallback(name, email, message);
        }
    });
}

function initBrief() {
    const brief = document.querySelector('[data-brief]');
    if (!brief) return;
    const need = brief.querySelector('[name="need"]');
    const who = brief.querySelector('[name="who"]');
    const sentence = () => briefSentence(need.value, who.value);

    brief.querySelector('[data-brief-whatsapp]').addEventListener('click', () => {
        window.sendLead({ source: 'quick-brief', message: sentence() });
        window.open(buildWhatsAppUrl(sentence()), '_blank', 'noopener');
    });
    brief.querySelector('[data-brief-form]').addEventListener('click', () => {
        const msg = document.getElementById('formMessage');
        const name = document.getElementById('formName');
        if (!msg || !name) return;
        msg.value = sentence();
        name.focus();
    });
}
