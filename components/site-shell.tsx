// Header and footer shared by the homepage and the inner pages.
const NAV = [['/#work', 'Work'], ['/#nfc', 'NFC'], ['/#services', 'Services'], ['/#team', 'Team'], ['/#contact', 'Contact']];

const POSTS = [
    ['How to Cut Cloud Infrastructure Costs Without Losing Performance', '/blog/cloud-cost-optimization.html'],
    ['Next.js vs Traditional Websites: What Actually Matters for SEO in 2026', '/blog/nextjs-seo-2026.html'],
    ['Building AI-Powered SaaS Features Without a Data Science Team', '/blog/ai-features-no-data-science.html'],
];

export const wrap = 'mx-auto w-full max-w-[1240px] px-5 md:px-10';

export function SiteHeader() {
    return (
        <>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-white">Skip to content</a>
            <header className="sticky top-0 z-40 border-b border-line bg-paper">
                <div className={`${wrap} flex min-h-16 flex-wrap items-center justify-between gap-x-6`}>
                    <a href="/" className="py-3 text-lg font-extrabold tracking-tight">RE Dev Ops</a>
                    <a href="/#contact" className="btn btn-ink order-2 !min-h-11 !px-4 md:order-3">Start a project</a>
                    <nav aria-label="Main" className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto pb-2 font-medium md:order-2 md:mx-0 md:w-auto md:pb-0">
                        {NAV.map(([href, label]) => <a key={href} href={href} className="px-3 py-2 hover:text-accent">{label}</a>)}
                    </nav>
                </div>
            </header>
        </>
    );
}

export function SiteFooter() {
    return (
        <footer className="border-t border-line bg-paper">
            <div className={`${wrap} grid gap-8 py-10 md:grid-cols-3`}>
                <div>
                    <p className="text-lg font-extrabold">RE Dev Ops</p>
                    <p className="mt-2 text-muted-foreground">A student-founded software studio in India. NFC products in Bangalore.</p>
                    <p className="mt-4 text-muted-foreground">© 2026 RE Dev Ops</p>
                </div>
                <nav aria-label="Writing" id="writing">
                    <h2 className="label">Writing</h2>
                    <ul className="mt-3 grid gap-2">
                        {POSTS.map(([title, href]) => <li key={href}><a className="link" href={href}>{title}</a></li>)}
                    </ul>
                </nav>
                <nav aria-label="Elsewhere">
                    <h2 className="label">Elsewhere</h2>
                    <ul className="mt-3 grid grid-cols-2 gap-2 font-medium">
                        <li><a className="link" href="https://github.com/RE-Dev-Ops" target="_blank" rel="noopener">GitHub ↗</a></li>
                        <li><a className="link" href="https://www.linkedin.com/in/redevops/" target="_blank" rel="noopener">LinkedIn ↗</a></li>
                        <li><a className="link" href="https://x.com/redevops3" target="_blank" rel="noopener">X ↗</a></li>
                        <li><a className="link" href="https://www.instagram.com/redevops3/" target="_blank" rel="noopener">Instagram ↗</a></li>
                        <li><a className="link" href="/nfc.html">NFC</a></li>
                        <li><a className="link" href="/privacy.html">Privacy</a></li>
                    </ul>
                </nav>
            </div>
        </footer>
    );
}
