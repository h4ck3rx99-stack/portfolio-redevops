"use client";

import { NeuroNoise } from "@paper-design/shaders-react";
import { useEffect, useRef, useState } from "react";

// 21st.dev cta-06, adapted: the site's own buttons and copy, no theme switcher.
// The flowing background is a WebGL shader, which costs frames, so it is only mounted
// while the card is on screen and rendered at a reduced resolution. A still frame of it
// (public/assets/cta-noise.webp) sits underneath for everyone else: off screen, reduced
// motion, no JavaScript.
const CTA = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(([e]) => setLive(!!e?.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="px-0 py-16 sm:px-6 md:py-24">
      <div ref={ref} className="relative mx-auto max-w-[1160px] overflow-hidden border-y border-line bg-paper p-8 sm:border-x md:p-14">
        <div aria-hidden="true" className="mask-l-from-30% sm:mask-l-from-10% absolute inset-0">
          <div className="cta-noise absolute inset-0" />
          {live && (
            <NeuroNoise
              brightness={0}
              className="absolute inset-0 bg-paper"
              colorBack="rgba(0, 0, 0, 0.08)"
              colorFront="rgba(0, 0, 0, 0.08)"
              colorMid="rgba(0, 0, 0, 0.5)"
              contrast={1}
              scale={0.55}
              speed={0.8}
              minPixelRatio={1}
              maxPixelCount={360000}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>

        <div className="relative isolate">
          <h2 className="display max-w-[14em] text-4xl md:text-5xl">Have a project like these?</h2>
          <p className="mt-4 max-w-[30em] text-balance text-xl text-muted-foreground">
            Tell us what you need. A rough idea is enough to start, and we reply within 6–12 hours.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href="#contact" className="btn btn-ink">Start a project →</a>
            <a href="https://calendly.com/redevops3/30min" target="_blank" rel="noopener" className="btn btn-ghost bg-paper">
              Book a 30-minute call ↗<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTA;
