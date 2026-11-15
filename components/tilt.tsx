'use client';

import { useEffect, useRef } from 'react';

// 3D scene that leans toward the pointer. Children sit at different depths with the
// .z1/.z2/.z3 classes. CSS transforms only; one rAF per pointer move. Without a mouse,
// or with reduced motion, the scene keeps its resting pose.
export function Tilt({ children, className = '', max = 12 }: { children: React.ReactNode; className?: string; max?: number }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return;
        let raf = 0, x = 0, y = 0;
        const apply = () => {
            raf = 0;
            el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
            el.style.setProperty('--rx', `${(-y * max * 0.7).toFixed(2)}deg`);
        };
        const move = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            x = (e.clientX - r.left) / r.width - 0.5;
            y = (e.clientY - r.top) / r.height - 0.5;
            if (!raf) raf = requestAnimationFrame(apply);
        };
        const leave = () => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', leave);
        return () => { cancelAnimationFrame(raf); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
    }, [max]);

    return <div ref={ref} className={`tilt ${className}`}><div className="tilt__scene">{children}</div></div>;
}
