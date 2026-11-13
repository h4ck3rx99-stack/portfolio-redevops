'use client';

import { useEffect, useState } from 'react';
import { CursorDrivenParticleTypography } from '@/components/ui/cursor-driven-particle-typography';
import { EyeTracking } from '@/components/ui/eye-tracking';

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
