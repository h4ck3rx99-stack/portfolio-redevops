'use client';

import { useState } from 'react';

const WHATSAPP = '918734000403';
const EMAIL = 'hello@redevops.in';

// No backend: the brief is handed to the visitor's own WhatsApp or email app.
export function ContactForm() {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const send = (via: 'whatsapp' | 'email') => {
        if (!name.trim() || message.trim().length < 5) {
            setError('Add your name and a line about what you want to build.');
            return;
        }
        setError('');
        const text = `Hi, I'm ${name.trim()}.\n\n${message.trim()}`;
        const url = via === 'whatsapp'
            ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
            : `mailto:${EMAIL}?subject=${encodeURIComponent(`Project enquiry from ${name.trim()}`)}&body=${encodeURIComponent(text)}`;
        window.open(url, via === 'whatsapp' ? '_blank' : '_self', 'noopener');
    };

    const field = 'w-full border border-white/25 bg-transparent px-4 py-3 text-white placeholder:text-white/40';
    return (
        <form onSubmit={(e) => { e.preventDefault(); send('whatsapp'); }} className="grid gap-3" noValidate>
            <label className="grid gap-1.5">
                <span className="font-mono text-[13px] uppercase tracking-wider text-white/75">Your name</span>
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            </label>
            <label className="grid gap-1.5">
                <span className="font-mono text-[13px] uppercase tracking-wider text-white/75">What do you want to build?</span>
                <textarea className={`${field} min-h-32 resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            {error && <p role="alert" className="text-sm text-[#FFC2B0]">{error}</p>}
            <div className="mt-1 flex flex-wrap gap-3">
                <button type="submit" className="btn btn-accent">Send on WhatsApp ↗</button>
                <button type="button" onClick={() => send('email')} className="btn btn-ghost-light">Send by email</button>
            </div>
            <p className="text-white/75">Opens your own WhatsApp or email app with the message filled in. We reply within 6–12 hours.</p>
        </form>
    );
}
