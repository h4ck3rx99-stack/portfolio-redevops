import { prepareDialog, openDialog } from './dialog.js';
// Six calendar months is a product preference, not a legal requirement.
export const CONSENT_KEY = 'redevops-consent';
export const CONSENT_VERSION = 1;
export const CONSENT_MONTHS = 6;
let initialized = false;

export function readConsent(storage, now = Date.now()) {
    try {
        const record = JSON.parse(storage.getItem(CONSENT_KEY));
        if (record?.version !== CONSENT_VERSION || record.necessary !== true ||
            typeof record.analytics !== 'boolean' || !Number.isFinite(record.timestamp) ||
            !Number.isFinite(record.expires) || record.timestamp > now || record.expires <= now ||
            record.expires <= record.timestamp) return null;
        const limit = new Date(record.timestamp);
        limit.setMonth(limit.getMonth() + CONSENT_MONTHS);
        return record.expires <= limit.getTime() ? record : null;
    } catch { return null; }
}

function startAnalytics() {
    if (initialized) return;
    initialized = true;
    window.clarity = window.clarity || function (...args) { (window.clarity.q ||= []).push(args); };
    window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
    const script = document.createElement('script');
    script.src = 'https://www.clarity.ms/tag/xc847faimf';
    script.async = true;
    script.dataset.analytics = 'clarity';
    document.head.append(script);
}

function removeAccessibleCookies() {
    for (const name of ['_clck', '_clsk']) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
        const labels = location.hostname.split('.');
        for (let i = 0; i < labels.length - 1; i++) {
            document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${labels.slice(i).join('.')}; SameSite=Lax`;
        }
    }
}

export function initConsent() {
    let storage;
    try { storage = window.localStorage; } catch { /* Optional tracking stays off. */ }
    let choice = readConsent(storage);
    const forcedOff = new URL(location.href).searchParams.get('analytics') === 'off';
    if (forcedOff) choice = null;
    // A stored grant is usable only while preference storage is writable.
    if (choice) {
        try { storage.setItem(CONSENT_KEY, JSON.stringify(choice)); }
        catch { choice = null; }
    }
    const banner = document.createElement('aside');
    banner.className = 'consent-banner';
    banner.setAttribute('aria-label', 'Cookie choices');
    banner.innerHTML = `<p>We use necessary storage to remember your cookie choice. With your permission, we also use analytics to understand how visitors use this site. You can change your choice anytime.</p><div class="consent-actions"><button type="button" class="btn btn--primary" data-accept>Accept all</button><button type="button" class="btn btn--primary" data-reject>Reject optional</button><button type="button" class="btn btn--outline settings-action" data-cookie-settings>Cookie settings</button></div><p class="dialog-status" role="status"></p>`;
    banner.hidden = !!choice;
    document.body.append(banner);
    const dialog = document.createElement('dialog');
    dialog.className = 'site-dialog';
    dialog.setAttribute('aria-labelledby', 'cookie-title');
    dialog.innerHTML = `<button type="button" class="dialog-close" aria-label="Close cookie settings">×</button><h2 id="cookie-title">Your cookie choices</h2><div class="consent-category"><strong>Necessary — always enabled</strong><p>Remembers your preferences so we can respect your choice on future visits.</p></div><div class="consent-category"><label for="analytics-choice">Analytics <input type="checkbox" role="switch" id="analytics-choice" aria-describedby="analytics-description"></label><p id="analytics-description">Microsoft Clarity helps us understand page interactions. It loads only with your permission. Advertising storage stays disabled.</p></div><p>Preferences last six months. Withdrawing analytics reloads this page to stop the tracker. Save any unsent enquiry text before withdrawing.</p><a href="/privacy.html">Read our privacy policy</a><div class="consent-actions"><button type="button" class="btn btn--primary" data-accept>Accept all</button><button type="button" class="btn btn--primary" data-reject>Reject optional</button><button type="button" class="btn btn--outline settings-action" data-save>Save preferences</button></div><p class="dialog-status" role="status"></p>`;
    document.body.append(dialog);
    prepareDialog(dialog);
    const toggle = dialog.querySelector('input');
    let opener;
    const close = () => { dialog.close(); opener?.focus(); };
    dialog.querySelector('.dialog-close').addEventListener('click', close);
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
    document.addEventListener('click', e => {
        const trigger = e.target.closest('[data-cookie-settings]');
        if (!trigger) return;
        opener = trigger;
        toggle.checked = choice?.analytics === true;
        openDialog(dialog);
    });
    const save = analytics => {
        const timestamp = Date.now();
        const expires = new Date(timestamp);
        expires.setMonth(expires.getMonth() + CONSENT_MONTHS);
        const record = { version: CONSENT_VERSION, necessary: true, analytics, timestamp, expires: expires.getTime() };
        try {
            storage.setItem(CONSENT_KEY, JSON.stringify(record));
            if (!readConsent(storage)) throw new Error('Storage did not persist');
        } catch {
            for (const status of document.querySelectorAll('.dialog-status')) status.textContent = 'Your browser cannot save preferences. Analytics remains off.';
            if (initialized) revoke(true);
            return;
        }
        choice = record;
        if (forcedOff) {
            const url = new URL(location.href);
            url.searchParams.delete('analytics');
            history.replaceState(null, '', url);
        }
        if (!analytics && initialized) { revoke(); return; }
        if (analytics) startAnalytics();
        else removeAccessibleCookies();
        banner.hidden = true;
        if (dialog.open) close();
    };
    function revoke(forceOff = false) {
        window.clarity?.('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
        window.clarity?.('consent', false);
        removeAccessibleCookies();
        // A loaded tracker can run without cookies. Reload stops all collection.
        if (forceOff) {
            // Persist denial in the URL if browser storage becomes unavailable mid-session.
            const url = new URL(location.href);
            url.searchParams.set('analytics', 'off');
            location.replace(url);
        } else location.reload();
    }
    for (const surface of [banner, dialog]) {
        surface.querySelector('[data-accept]').addEventListener('click', () => save(true));
        surface.querySelector('[data-reject]').addEventListener('click', () => save(false));
    }
    dialog.querySelector('[data-save]').addEventListener('click', () => save(toggle.checked));
    window.addEventListener('storage', e => {
        if (e.key !== CONSENT_KEY && e.key !== null) return;
        choice = readConsent(storage);
        if (!choice?.analytics && initialized) revoke();
        else if (choice?.analytics) startAnalytics();
        banner.hidden = !!choice;
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        choice = readConsent(storage);
        if (!choice?.analytics && initialized) revoke();
        banner.hidden = !!choice;
    });
    if (choice?.analytics) startAnalytics();
    else removeAccessibleCookies();
}
