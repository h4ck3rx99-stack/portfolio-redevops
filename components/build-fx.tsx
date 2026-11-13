'use client';

import { useEffect, useRef, useState } from 'react';
import { initBuild, initPresence } from '@/lib/build';

// Starts the build effect once and shows its state in the toolbar.
export function BuildStatus() {
    const replay = useRef<() => void>(() => {});
    const [state, setState] = useState<'idle' | 'building' | 'done'>('idle');

    useEffect(() => {
        const onState = (e: Event) => setState((e as CustomEvent).detail);
        addEventListener('build:state', onState);
        replay.current = initBuild();
        initPresence();
        return () => removeEventListener('build:state', onState);
    }, []);

    if (state === 'idle') return null;
    return (
        <button
            type="button"
            onClick={() => replay.current()}
            disabled={state === 'building'}
            className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground hover:text-ink disabled:cursor-default md:flex"
        >
            <span className={`size-1.5 rounded-full ${state === 'building' ? 'animate-pulse bg-accent' : 'bg-dev'}`} />
            {state === 'building' ? 'Building…' : 'Built — replay ↺'}
        </button>
    );
}
