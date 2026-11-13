import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

const title = 'RE Dev Ops — Websites, Apps & Connected Systems';
const description = 'A student-founded studio in India building websites, apps and connected business systems. NFC products available in Bangalore.';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.redevops.in'),
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: 'RE Dev Ops', locale: 'en_IN', url: '/', title, description, images: [{ url: '/og-image.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', site: '@redevops3' },
    verification: { google: 'lGYA5V6t05G9_ZQ_5RqyOPylErn0XRFtFnVE7S1bEJ4' },
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico' }], apple: '/apple-touch-icon.png' },
};
export const viewport: Viewport = { themeColor: '#ECECE6' };

// Gate the build effect before first paint; a 3 s failsafe shows everything if the script never runs.
const gate = `(function(r){if(matchMedia('(prefers-reduced-motion: no-preference)').matches){r.classList.add('building');setTimeout(function(){r.classList.remove('building')},3000)}})(document.documentElement)`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: gate }} />
            </head>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
