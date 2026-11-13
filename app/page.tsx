import { BuildStatus } from '@/components/build-fx';
import { ContactForm } from '@/components/contact-form';
import { Safari } from '@/components/ui/safari';
import { TextReveal } from '@/components/ui/text-reveal';

const WA = 'https://wa.me/918734000403?text=' + encodeURIComponent("Hi! I'd like to talk about a project.");
const CALENDLY = 'https://calendly.com/redevops3/30min';

const CAST = ['design', 'copy', 'dev', 'pm', 'qa'] as const;
type Role = (typeof CAST)[number];
const who = (i: number): Role => CAST[i % CAST.length];
const ROLE_BG: Record<Role, string> = { design: 'bg-design', copy: 'bg-copy', dev: 'bg-dev', pm: 'bg-pm', qa: 'bg-qa' };

const TOOLS = [
    { slug: 'proposalforge', img: 'proposal_forge', name: 'ProposalForge', url: 'https://proposalforge.redevops.in/', alt: 'ProposalForge editor: invoice settings on the left and a live invoice preview on the right', desc: 'An invoice and proposal builder that runs entirely in the browser — no sign-up, no server.' },
    { slug: 'siteaudit-pro', img: 'siteaudit', name: 'SiteAudit Pro', url: 'https://siteaudit.redevops.in/', alt: 'SiteAudit Pro home screen with a field to enter a website address', desc: 'Paste any URL and get a scored audit of SEO, performance, accessibility, mobile and security headers.' },
    { slug: 'brandkit-studio', img: 'brandkit', name: 'BrandKit Studio', url: 'https://brandkit.redevops.in/', alt: 'BrandKit Studio showing a colour palette and contrast checks', desc: 'A brand identity toolkit: palettes, contrast checks, gradients, font pairings and token export.' },
    { slug: 'dashboard-studio', img: 'dashboard_studio', name: 'Dashboard Studio', url: 'https://dashboardstudio.redevops.in/', alt: 'Dashboard Studio showing charts and KPIs from a sales file', desc: 'Drop in a sales CSV and get KPIs, charts, filters and searchable records — all in the browser.' },
];

const SERVICES = [
    ['Websites & web applications', 'A clear home for your business, or a tool that supports how it runs. Useful content, considered interfaces and a documented handover.'],
    ['Mobile applications', 'Mobile experiences built around the task at hand, with interfaces and connected features shaped around your users.'],
    ['Infrastructure & integrations', 'Hosting, deployment workflows, APIs and connected business systems. We can discuss AI features and workflow automation where they fit your product.'],
];

const STEPS = [
    ['Discover', 'Understand your goals, users and constraints.'],
    ['Define', 'Agree the scope, deliverables and responsibilities.'],
    ['Build', 'Share previews and gather feedback as the work develops.'],
    ['Launch', 'Test, deploy, document and hand over.'],
];

const TEAM: { name: string; role: string; bio: string; tone: Role; github: string; linkedin: string }[] = [
    { name: 'Aayush Kumar', role: 'Founder & Lead Engineer', tone: 'design', bio: 'Architecture, full-stack development and deployment, from client websites to the studio’s own tools.', github: 'https://github.com/h4ck3rx99-stack', linkedin: 'https://www.linkedin.com/in/aayushkumar-redevops/' },
    { name: 'Mahima Hemanth', role: 'Co-Founder · AI & Product', tone: 'copy', bio: 'Product scoping, AI-powered features and workflow automation, connecting the brief to what gets built.', github: 'https://github.com/mahimahemanthuniversity', linkedin: 'https://www.linkedin.com/in/mahima-hemanth-845405441/' },
    { name: 'Thaseen Haque', role: 'Backend & Growth Engineer', tone: 'dev', bio: 'APIs, databases and integrations, alongside SEO, analytics and launch strategy.', github: 'https://github.com/thaseenabbut', linkedin: 'https://www.linkedin.com/in/thaseen-haque-765b05428/' },
];

const POSTS = [
    ['21 Jun 2026', 'How to Cut Cloud Infrastructure Costs Without Losing Performance', '/blog/cloud-cost-optimization.html'],
    ['15 Jun 2026', 'Next.js vs Traditional Websites: What Actually Matters for SEO in 2026', '/blog/nextjs-seo-2026.html'],
    ['8 Jun 2026', 'Building AI-Powered SaaS Features Without a Data Science Team', '/blog/ai-features-no-data-science.html'],
];

const FAQ = [
    ['How do we decide what to build?', 'We start with your goals, users and constraints, then agree the scope and deliverables before development.'],
    ['How is a project priced?', 'We prepare a quote around the agreed scope. Changes to that scope are discussed before extra work begins.'],
    ['Who owns the finished work?', 'Source code, domain and hosting ownership are covered in the project agreement, with a documented handover.'],
    ['How will we communicate?', 'You work directly with the founding team. We agree how to share progress previews, feedback and decisions.'],
    ['How long will it take?', 'Timing depends on scope, integrations and feedback. We agree a schedule during planning rather than promise the same window for every project.'],
    ['Where do you work?', 'Our studio operates from India and collaborates remotely. NFC products are currently available only in Bangalore.'],
];

function Frame({ id, name, note, now, children, className = '' }: { id?: string; name: string; note?: string; now?: boolean; children: React.ReactNode; className?: string }) {
    return (
        <section id={id} data-build={now ? 'now' : ''} className="mx-auto w-full max-w-[1320px]">
            <p className="frame-label"><span>{name}</span>{note && <span className="hidden sm:inline">{note}</span>}</p>
            <div className={`frame ${className}`}>{children}</div>
        </section>
    );
}

function Shot({ img, alt, eager }: { img: string; alt: string; eager?: boolean }) {
    return (
        <picture>
            <source type="image/avif" srcSet={`/assets/img/${img}-640.avif 640w, /assets/img/${img}-960.avif 960w, /assets/img/${img}-1440.avif 1440w`} sizes="(min-width: 1024px) 50vw, 100vw" />
            <source type="image/webp" srcSet={`/assets/img/${img}-640.webp 640w, /assets/img/${img}-960.webp 960w, /assets/img/${img}-1440.webp 1440w`} sizes="(min-width: 1024px) 50vw, 100vw" />
            <img src={`/assets/${img}.jpg`} alt={alt} width={1440} height={900} loading={eager ? 'eager' : 'lazy'} decoding="async" className="block h-auto w-full" />
        </picture>
    );
}

export default function Home() {
    return (
        <>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-white">Skip to content</a>

            {/* Toolbar */}
            <header className="sticky top-0 z-40 border-b border-line bg-paper">
                <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
                    <a href="#top" className="flex items-baseline gap-2 font-extrabold tracking-tight">
                        RE Dev Ops<span className="hidden font-mono text-[11px] font-normal text-muted sm:inline">/ home</span>
                    </a>
                    <nav aria-label="Main" className="hidden gap-7 text-sm font-medium md:flex">
                        <a href="#work" className="hover:text-accent">Work</a>
                        <a href="#services" className="hover:text-accent">Services</a>
                        <a href="#studio" className="hover:text-accent">Studio</a>
                        <a href="#writing" className="hover:text-accent">Writing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <BuildStatus />
                        <div className="hidden -space-x-1.5 lg:flex" aria-hidden="true">
                            {CAST.map((r) => (
                                <span key={r} title={r} className={`grid size-7 place-items-center rounded-full border-2 border-paper font-mono text-[10px] font-medium uppercase text-white ${ROLE_BG[r]}`}>{r[0]}</span>
                            ))}
                        </div>
                        <a href="#contact" className="btn btn-ink !min-h-10 !px-4 text-sm">Start a project</a>
                    </div>
                </div>
            </header>

            <main id="main" className="grid gap-16 px-4 pb-24 pt-10 md:gap-24 md:px-8 md:pt-14">
                <span id="top" className="absolute top-0" />

                {/* Hero */}
                <Frame name="01 — Hero" note="Illustration: these cursors are scripted, not live people" now className="grid items-center gap-10 p-6 md:p-12 lg:grid-cols-12 lg:gap-8 lg:p-16">
                    <div className="grid gap-6 lg:col-span-7">
                        <p className="label" data-b="type" data-by="pm" data-d="0">Student-founded studio · India</p>
                        <h1 className="display text-[clamp(2.5rem,1rem+4.3vw,4.75rem)]">
                            <span className="block" data-b="type" data-by="copy" data-d="250" data-cps="42">This website is building itself.</span>
                            <span className="block text-accent" data-b="type" data-by="design" data-d="1150" data-cps="30">Yours is next.</span>
                        </h1>
                        <p className="max-w-[34em] text-lg text-muted md:text-xl" data-b="type" data-by="copy" data-d="1700" data-cps="260">We design and build websites, apps and connected systems around how your business works — and you work directly with the people building them.</p>
                        <div className="flex flex-wrap gap-3">
                            <a href="#contact" className="btn btn-ink" data-b="box" data-by="pm" data-d="2250" data-dur="380">Start a project →</a>
                            <a href="#work" className="btn btn-ghost" data-b="box" data-by="qa" data-d="2450" data-dur="380">See the work</a>
                        </div>
                        <p className="text-sm text-muted" data-b="type" data-by="qa" data-d="2850" data-cps="120">We reply within 6–12 hours.</p>
                    </div>
                    <figure className="lg:col-span-5">
                        <div data-b="box" data-by="design" data-d="500" data-dur="1000">
                            <Safari url="thefermentformula.in" imageSrc="/assets/img/ferment_formula-960.webp" aria-label="The Ferment Formula homepage: brewhouse photo with the headline End-to-End Brewery Setup" role="img" />
                        </div>
                        <figcaption className="mt-3 flex items-center gap-2 font-mono text-[11px] text-muted">
                            <span className="bg-dev px-1.5 py-0.5 text-white" data-b="box" data-by="dev" data-d="1550" data-dur="300">LIVE</span>
                            <span data-b="type" data-by="dev" data-d="1850" data-cps="60">The Ferment Formula — client website</span>
                        </figcaption>
                    </figure>
                </Frame>

                {/* Client work */}
                <Frame id="work" name="02 — Client work" note="Bengaluru · 2026" className="grid gap-10 p-6 md:p-12 lg:grid-cols-12 lg:gap-12">
                    <div className="lg:col-span-7">
                        <a href="/work/the-ferment-formula.html" className="block border border-line" data-inspect data-b="box" data-by="design" data-dur="800" aria-label="The Ferment Formula project">
                            <Shot img="ferment_formula" alt="The Ferment Formula homepage: brewhouse photo with the headline End-to-End Brewery Setup and an Explore setup button" />
                        </a>
                    </div>
                    <div className="grid content-start gap-5 lg:col-span-5">
                        <p className="label" data-b="type" data-by="pm">Client website · live</p>
                        <h2 className="display h2" data-b="type" data-by="copy" data-cps="40">The Ferment Formula</h2>
                        <p className="text-muted" data-b="type" data-by="copy" data-cps="320">Website for a Bengaluru craft-brewery consultancy led by principal brewmaster Satyam Awasthi. Multi-page site covering brewery setup, revival, recipes and training — with local-business SEO, a gallery, awards and a WhatsApp enquiry widget.</p>
                        <div className="flex flex-wrap gap-3">
                            <a href="/work/the-ferment-formula.html" className="btn btn-ink" data-b="box" data-by="dev" data-dur="350">Explore the project →</a>
                            <a href="https://thefermentformula.in/" target="_blank" rel="noopener" className="btn btn-ghost" data-b="box" data-by="qa" data-dur="350">Visit the site ↗</a>
                        </div>
                    </div>
                    {/* The client's review, left as a comment on the frame */}
                    <figure className="flex gap-4 border-t border-line pt-8 lg:col-span-12" data-b="box" data-by="pm" data-dur="700">
                        <span className="pin" aria-hidden="true">SA</span>
                        <div className="grid gap-3">
                            <figcaption className="text-sm"><strong>Satyam Awasthi</strong> <span className="text-muted">— Founder & Principal Brewmaster, The Ferment Formula (Bengaluru)</span></figcaption>
                            <blockquote className="max-w-[52em] text-lg leading-relaxed md:text-xl">“We needed a website that felt as crafted as the beer we help make, and that explained what a brewery consultant actually does without drowning people in jargon. Aayush and Thaseen asked the right questions, were straight with us about timelines, and turned around every change quickly. The site is fast even on a patchy connection in the middle of a brewhouse, and it&apos;s the first thing I now send to a brewery owner who wants to know who we are.”</blockquote>
                        </div>
                    </figure>
                </Frame>

                {/* Studio tools */}
                <Frame name="03 — Studio tools" note="Free — try any of them" className="p-6 md:p-12">
                    <h2 className="display h2 mb-3" data-b="type" data-by="copy" data-cps="45">Tools we built and run.</h2>
                    <p className="mb-10 max-w-[38em] text-muted" data-b="type" data-by="copy" data-cps="300">Four free tools we designed, built and host ourselves to sharpen our own craft.</p>
                    <ul className="grid gap-x-8 gap-y-12 md:grid-cols-2">
                        {TOOLS.map((t, i) => (
                            <li key={t.slug} className="grid content-start gap-4" data-b="box" data-by={who(i)} data-dur="700">
                                <a href={`/work/${t.slug}.html`} className="block border border-line" data-inspect tabIndex={-1} aria-hidden="true"><Shot img={t.img} alt={t.alt} /></a>
                                <h3 className="text-2xl font-extrabold tracking-tight"><a href={`/work/${t.slug}.html`} className="hover:text-accent">{t.name}</a></h3>
                                <p className="text-muted">{t.desc}</p>
                                <p className="flex flex-wrap gap-5 text-sm font-semibold">
                                    <a className="link" href={`/work/${t.slug}.html`}>Project details →</a>
                                    <a className="link" href={t.url} target="_blank" rel="noopener">Open the app ↗</a>
                                </p>
                            </li>
                        ))}
                    </ul>
                </Frame>

                {/* Who we are, revealed word by word on scroll (Magic UI text-reveal) */}
                <TextReveal>RE Dev Ops is an independent, student-founded studio in India. We bring product thinking and engineering together, with direct collaboration throughout your project.</TextReveal>

                {/* Services */}
                <Frame id="services" name="04 — Services" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10" data-b="type" data-by="copy" data-cps="45">What needs building?</h2>
                    <ol>
                        {SERVICES.map(([title, body], i) => (
                            <li key={title} className="grid gap-3 border-t border-line py-7 md:grid-cols-12 md:gap-8" data-inspect data-b="box" data-by={who(i + 2)} data-dur="600">
                                <span className="label md:col-span-1">0{i + 1}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight md:col-span-5 md:text-3xl">{title}</h3>
                                <p className="text-muted md:col-span-6">{body}</p>
                            </li>
                        ))}
                        <li className="grid gap-3 border-y border-line bg-canvas px-4 py-7 md:grid-cols-12 md:gap-8" data-inspect data-b="box" data-by="qa" data-dur="600">
                            <span className="label md:col-span-1">NFC</span>
                            <h3 className="text-2xl font-extrabold tracking-tight md:col-span-5 md:text-3xl">NFC cards & review stands</h3>
                            <p className="text-muted md:col-span-6">A tap opens your menu, review page, contact or social profile on compatible phones. We design, program and deliver them — in Bangalore only. <a className="link whitespace-nowrap font-semibold text-ink" href="/nfc.html">Explore NFC →</a></p>
                        </li>
                    </ol>
                </Frame>

                {/* Process */}
                <Frame name="05 — Process" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10" data-b="type" data-by="copy" data-cps="45">From brief to handover.</h2>
                    <ol className="grid gap-4 md:grid-cols-4">
                        {STEPS.map(([title, body], i) => (
                            <li key={title} className="relative grid content-start gap-3 border border-line p-5" data-inspect data-b="box" data-by={who(i)} data-dur="500">
                                <span className="label">Step 0{i + 1}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                                <p className="text-muted">{body}</p>
                                {i < 3 && <span aria-hidden="true" className="absolute -right-[13px] top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-ink text-xs text-white md:grid">→</span>}
                            </li>
                        ))}
                    </ol>
                    <a href={CALENDLY} target="_blank" rel="noopener" className="btn btn-ghost mt-8" data-b="box" data-by="pm" data-dur="350">Book an introductory call ↗</a>
                </Frame>

                {/* Studio */}
                <Frame id="studio" name="06 — Studio" note="The people behind the cursors" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10 max-w-[14em]" data-b="type" data-by="copy" data-cps="45">Work directly with the people building it.</h2>
                    <ul className="grid gap-4 md:grid-cols-3">
                        {TEAM.map((p) => (
                            <li key={p.name} className="grid content-start gap-3 border border-line p-6" data-inspect data-b="box" data-by={p.tone} data-dur="600">
                                <span className={`w-fit px-2 py-1 font-mono text-[11px] text-white ${ROLE_BG[p.tone]}`}>{p.name.split(' ')[0].toLowerCase()}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight">{p.name}</h3>
                                <p className="label">{p.role}</p>
                                <p className="text-muted">{p.bio}</p>
                                <p className="flex gap-5 text-sm font-semibold">
                                    <a className="link" href={p.github} target="_blank" rel="noopener">GitHub ↗</a>
                                    <a className="link" href={p.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
                                </p>
                            </li>
                        ))}
                    </ul>
                </Frame>

                {/* Writing + FAQ */}
                <Frame id="writing" name="07 — Writing & questions" className="grid gap-14 p-6 md:p-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <h2 className="display mb-6 text-4xl" data-b="type" data-by="copy" data-cps="45">Notes from the studio.</h2>
                        <ul>
                            {POSTS.map(([date, title, href], i) => (
                                <li key={href} data-b="box" data-by={who(i + 1)} data-dur="450">
                                    <a href={href} className="group grid gap-1 border-t border-line py-5" data-inspect>
                                        <span className="label">{date}</span>
                                        <span className="text-lg font-semibold group-hover:text-accent">{title} →</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h2 className="display mb-6 text-4xl" data-b="type" data-by="pm" data-cps="45">Before we begin.</h2>
                        <div data-b="box" data-by="dev" data-dur="700">
                            {FAQ.map(([q, a]) => (
                                <details key={q} className="group border-t border-line">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">{q}<span aria-hidden="true" className="font-mono text-muted group-open:rotate-45">+</span></summary>
                                    <p className="pb-5 text-muted">{a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </Frame>

                {/* Contact */}
                <Frame id="contact" name="08 — Contact" className="grid gap-12 !border-ink !bg-ink p-6 text-white md:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
                    <div className="grid content-start gap-6">
                        <h2 className="display text-[clamp(2.4rem,1rem+4.6vw,5rem)]" data-b="type" data-by="design" data-cps="38">Tell us what you want to build.</h2>
                        <p className="max-w-[30em] text-lg text-white/70" data-b="type" data-by="copy" data-cps="200">Share the problem, the idea, or the part that isn’t working yet.</p>
                        <ul className="grid gap-2 text-lg font-semibold" data-b="box" data-by="pm" data-dur="500">
                            <li><a className="link" href="mailto:hello@redevops.in">hello@redevops.in</a></li>
                            <li><a className="link" href="tel:+918734000403">+91 8734000403</a></li>
                            <li><a className="link" href={WA} target="_blank" rel="noopener">WhatsApp ↗</a></li>
                            <li><a className="link" href={CALENDLY} target="_blank" rel="noopener">Book a 30-minute call ↗</a></li>
                        </ul>
                    </div>
                    <div data-b="box" data-by="dev" data-dur="800"><ContactForm /></div>
                </Frame>
            </main>

            <footer className="border-t border-line bg-paper">
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 text-sm md:px-8">
                    <p className="text-muted">© 2026 RE Dev Ops · India</p>
                    <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 font-medium">
                        <a className="hover:text-accent" href="https://github.com/RE-Dev-Ops" target="_blank" rel="noopener">GitHub ↗</a>
                        <a className="hover:text-accent" href="https://www.linkedin.com/in/redevops/" target="_blank" rel="noopener">LinkedIn ↗</a>
                        <a className="hover:text-accent" href="https://x.com/redevops3" target="_blank" rel="noopener">X ↗</a>
                        <a className="hover:text-accent" href="https://www.instagram.com/redevops3/" target="_blank" rel="noopener">Instagram ↗</a>
                        <a className="hover:text-accent" href="/nfc.html">NFC</a>
                        <a className="hover:text-accent" href="/privacy.html">Privacy</a>
                    </nav>
                </div>
            </footer>
        </>
    );
}
