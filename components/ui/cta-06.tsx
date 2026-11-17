// 21st.dev cta-06, adapted: the site's own buttons and copy, no theme switcher.
// The background is one captured frame of the original NeuroNoise shader
// (public/assets/cta-noise.webp): the live WebGL shader cost scroll frames, a still costs none.
const CTA = () => (
  <div className="px-0 py-16 sm:px-6 md:py-24">
    <div className="relative mx-auto max-w-[1160px] overflow-hidden border-y border-line bg-paper p-8 sm:border-x md:p-14">
      <div aria-hidden="true" className="cta-noise mask-l-from-30% sm:mask-l-from-10% absolute inset-0" />

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

export default CTA;
