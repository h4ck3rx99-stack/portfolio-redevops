'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CursorDrivenParticleTypography } from '@/components/ui/cursor-driven-particle-typography';
import { SplitFlapDisplay } from '@/components/ui/split-flap-display';
import type { Spiral3DSlide } from '@/components/ui/spiral-3d-slider';

// three.js is only downloaded when the gallery is about to be shown.
const Spiral3DSlider = dynamic(() => import('@/components/ui/spiral-3d-slider').then((m) => m.Spiral3DSlider), { ssr: false });

// The studio name as particles that scatter away from the pointer.
export function HeroMark() {
    const [font, setFont] = useState('');
    const [small, setSmall] = useState(false);
    useEffect(() => {
        setSmall(innerWidth < 640); // fewer pixels per letter on phones, so pack the dots tighter
        document.fonts.ready.then(() => setFont(getComputedStyle(document.documentElement).getPropertyValue('--font-archivo').trim() || 'Arial'));
    }, []);
    return (
        <div aria-hidden="true" className="h-[clamp(110px,21vw,300px)] text-ink">
            {font && <CursorDrivenParticleTypography text="RE DEV OPS" fontSize={260} fontFamily={font} particleSize={small ? 1 : 1.6} particleDensity={small ? 2 : 4} dispersionStrength={18} className="min-h-0 touch-pan-y" />}
        </div>
    );
}

const BUILDS = ['WEBSITES', 'WEB APPS', 'MOBILE APPS', 'INTEGRATIONS', 'NFC CARDS'];

// Departure-board line cycling through what the studio builds.
export function BuildBoard() {
    const [i, setI] = useState(0);
    useEffect(() => {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const t = setInterval(() => setI((n) => (n + 1) % BUILDS.length), 2800);
        return () => clearInterval(t);
    }, []);
    return (
        <div className="flex flex-wrap items-center gap-3">
            <span className="label">We build</span>
            <span className="sr-only">{BUILDS.join(', ')}</span>
            <div aria-hidden="true" className="max-w-full overflow-hidden max-[420px]:[zoom:0.7]"><SplitFlapDisplay text={BUILDS[i]} columns={12} size="sm" showIndicators={false} /></div>
        </div>
    );
}

export function WorkSpiral({ items }: { items: Spiral3DSlide[] }) {
    return <Spiral3DSlider items={items} ariaLabel="Screenshots of our live projects" className="min-h-0 bg-transparent h-[420px] md:h-[600px]" cardWidth={300} cardAspectRatio={16 / 10} radius={340} verticalGap={96} blurStrength={0.8} />;
}
