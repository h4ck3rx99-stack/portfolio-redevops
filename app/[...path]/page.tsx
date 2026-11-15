import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { allPages, loadPage } from '@/lib/pages';

export const dynamicParams = false;
export const generateStaticParams = () => allPages().map((path) => ({ path }));

type Props = { params: Promise<{ path: string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const page = loadPage((await params).path);
    if (!page) return {};
    const image = page.image ?? '/og-image.png';
    return {
        title: page.title,
        description: page.description,
        alternates: { canonical: page.url },
        openGraph: { type: page.url.startsWith('/blog/') ? 'article' : 'website', siteName: 'RE Dev Ops', locale: 'en_IN', title: page.title, description: page.description, url: page.url, images: [image] },
        twitter: { card: 'summary_large_image', site: '@redevops3', images: [image] },
    };
}

export default async function InnerPage({ params }: Props) {
    const page = loadPage((await params).path);
    if (!page) notFound();
    return (
        <>
            <SiteHeader />
            {/* Our own static HTML from content/, not user input. */}
            <main id="main" className="legacy" dangerouslySetInnerHTML={{ __html: page.html }} />
            {page.jsonLd.map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />)}
            <SiteFooter />
        </>
    );
}
