import type { Metadata, Viewport } from 'next';
import { Archivo, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains', display: 'swap' });

const title = 'RE Dev Ops — Website & Web App Development Studio, India';
const description = 'Student-founded studio in India building websites, web apps and business systems. NFC cards and review stands in Bangalore. We reply within 6–12 hours.';

export const metadata: Metadata = {
    metadataBase: new URL('https://www.redevops.in'),
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', siteName: 'RE Dev Ops', locale: 'en_IN', url: '/', title, description, images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'RE Dev Ops — websites, web apps and NFC touchpoints' }] },
    twitter: { card: 'summary_large_image', site: '@redevops3', images: ['/og-image.png'] },
    verification: { google: 'lGYA5V6t05G9_ZQ_5RqyOPylErn0XRFtFnVE7S1bEJ4' },
    icons: { icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }, { url: '/favicon.ico', sizes: '48x48' }], apple: '/apple-touch-icon.png' },
    manifest: '/site.webmanifest',
};
export const viewport: Viewport = { themeColor: '#FFFFFF' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${archivo.variable} ${jetbrains.variable}`}>
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}
