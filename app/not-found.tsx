import { SiteFooter, SiteHeader, wrap } from '@/components/site-shell';

export default function NotFound() {
    return (
        <>
            <SiteHeader />
            <main id="main" className={`${wrap} grid min-h-[60vh] content-center gap-6 py-20`}>
                <p className="label">404</p>
                <h1 className="display text-5xl md:text-7xl">Nothing was built here.</h1>
                <a className="btn btn-ink w-fit" href="/">Back to the homepage</a>
            </main>
            <SiteFooter />
        </>
    );
}
