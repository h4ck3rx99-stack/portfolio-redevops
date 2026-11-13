'use client';

import { useEffect, useState } from 'react';
import { CursorDrivenParticleTypography } from '@/components/ui/cursor-driven-particle-typography';
import { EyeTracking } from '@/components/ui/eye-tracking';
import { SplitFlapDisplay } from '@/components/ui/split-flap-display';
import { TextRepel } from '@/components/ui/text-repel';

// The studio name. Plain text by default (no JS, reduced motion, touch-only);
// with a mouse it becomes particles that scatter away from the pointer.
export function HeroMark() {
    const [font, setFont] = useState('');
    useEffect(() => {
        if (!matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
        document.fonts.ready.then(() => setFont(getComputedStyle(document.documentElement).getPropertyValue('--font-archivo').trim() || 'Arial'));
    }, []);
    return (
        <div aria-hidden="true" className="relative grid h-[clamp(72px,19vw,270px)] place-items-center text-ink">
            {font
                ? <CursorDrivenParticleTypography text="RE DEV OPS" fontSize={260} fontFamily={font} particleSize={1.7} particleDensity={5} dispersionStrength={18} className="absolute inset-0 min-h-0 touch-pan-y" />
                : <span className="display whitespace-nowrap text-[14.2vw] xl:text-[188px]">RE DEV OPS</span>}
        </div>
    );
}

// A pair of eyes that follow the pointer. Decorative.
export function Watching() {
    return <div aria-hidden="true" className="hidden md:block"><EyeTracking variant="cartoon" eyeSize={84} gap={14} irisColor="#D23A0C" idleAnimation={false} /></div>;
}

const BUILDS = ['WEBSITES', 'WEB APPS', 'MOBILE APPS', 'INTEGRATIONS', 'NFC CARDS'];

// Departure-board line cycling through what the studio builds. Decorative; the list is read out once.
export function BuildBoard() {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const t = setInterval(() => { if (!document.hidden) setI((n) => (n + 1) % BUILDS.length); }, 2800);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="label">We build</span>
            <span className="sr-only">{BUILDS.join(', ').toLowerCase()}</span>
            <div aria-hidden="true" className="max-w-full overflow-hidden max-[420px]:[zoom:0.7]"><SplitFlapDisplay text={BUILDS[i]} columns={12} size="sm" showIndicators={false} /></div>
        </div>
    );
}

// Heading whose letters dodge the pointer. Screen readers get the plain sentence.
export function RepelHeading({ text }: { text: string }) {
    return (
        <>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {text.split(' ').map((w, i) => <span key={i} className="mr-[0.25em] inline-block whitespace-nowrap"><TextRepel text={w} radius={140} strength={42} /></span>)}
            </span>
        </>
    );
}

const NFC_LINKS = ['Menu', 'Reviews', 'Contact', 'Socials'];

// Try-it NFC illustration: tap the card against the phone and the phone opens the links.
export function NfcDemo() {
    const [tapped, setTapped] = useState(false);
    return (
        <div className={`nfc ${tapped ? 'is-tapped' : ''}`}>
            <div className="nfc__stage">
                <button type="button" className="nfc__card" aria-pressed={tapped} onClick={() => setTapped(!tapped)}>
                    <span className="text-lg font-extrabold">RE Dev Ops</span>
                    <span className="font-mono text-xs">{tapped ? 'Tap again to reset' : 'Click to tap the phone'} ))) </span>
                </button>
                <div className="nfc__phone" aria-hidden="true">
                    <span className="nfc__ring" />
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{tapped ? 'Opened' : 'Waiting for a tap'}</span>
                    {NFC_LINKS.map((l, i) => <span key={l} className="nfc__link" style={{ transitionDelay: `${tapped ? 250 + i * 90 : 0}ms` }}>{l} →</span>)}
                </div>
            </div>
            <p role="status" className="sr-only">{tapped ? 'The phone opened the linked page: menu, reviews, contact and socials.' : ''}</p>
            <p className="label mt-4">Illustration — not a real phone screen</p>
        </div>
    );
}
