import { BuildStatus } from '@/components/build-fx';
import { ContactForm } from '@/components/contact-form';
import { BuildBoard, HeroMark, SiteDock, Watching, WorkFlip, WorkSpiral } from '@/components/hero-fx';
import { TextRepel } from '@/components/ui/text-repel';
import { TeamLanyardRail } from '@/components/ui/team-lanyard-rail';
import { TextReveal } from '@/components/ui/text-reveal';

const WA = 'https://wa.me/918734000403?text=' + encodeURIComponent("Hi! I'd like to talk about a project.");
const CALENDLY = 'https://calendly.com/redevops3/30min';

const CAST = ['design', 'copy', 'dev', 'pm', 'qa'] as const;
type Role = (typeof CAST)[number];
const who = (i: number): Role => CAST[i % CAST.length];
const ROLE_BG: Record<Role, string> = { design: 'bg-design', copy: 'bg-copy', dev: 'bg-dev', pm: 'bg-pm', qa: 'bg-qa' };

const SLIDES = ['ferment_formula', 'proposal_forge', 'siteaudit', 'brandkit', 'dashboard_studio'].map((n) => ({ src: `/assets/img/${n}-960.webp`, alt: `${n.replace('_', ' ')} screenshot` }));

const ROLE_HEX: Record<Role, string> = { design: '#FF4A1C', copy: '#1F5BFF', dev: '#0A8F5B', pm: '#B87A00', qa: '#D81B7A' };

const CASES = [
    { number: '01', eyebrow: 'Client website · Bengaluru · live', title: 'The Ferment Formula', description: 'Website for a craft-brewery consultancy led by brewmaster Satyam Awasthi: brewery setup, revival, recipes and training, with local SEO and a WhatsApp enquiry widget.', image: '/assets/img/ferment_formula-1440.webp', imageAlt: 'The Ferment Formula homepage with a brewhouse photo', background: '#2B1D14', foreground: '#F6EFE6' },
    { number: '02', eyebrow: 'Our own tool · live', title: 'ProposalForge', description: 'An invoice and proposal builder that runs entirely in the browser — no sign-up, no server.', image: '/assets/img/proposal_forge-1440.webp', imageAlt: 'ProposalForge editor with a live invoice preview', background: '#0E0E0E', foreground: '#FFFFFF' },
    { number: '03', eyebrow: 'Our own tool · live', title: 'SiteAudit Pro', description: 'Paste any URL and get a scored audit of SEO, performance, accessibility, mobile and security headers.', image: '/assets/img/siteaudit-1440.webp', imageAlt: 'SiteAudit Pro home screen', background: '#1F5BFF', foreground: '#FFFFFF' },
    { number: '04', eyebrow: 'Our own tool · live', title: 'BrandKit Studio', description: 'A brand identity toolkit: palettes, contrast checks, gradients, font pairings and token export.', image: '/assets/img/brandkit-1440.webp', imageAlt: 'BrandKit Studio colour palette', background: '#FF4A1C', foreground: '#FFFFFF' },
    { number: '05', eyebrow: 'Our own tool · live', title: 'Dashboard Studio', description: 'Drop in a sales CSV and get KPIs, charts, filters and searchable records — all in the browser.', image: '/assets/img/dashboard_studio-1440.webp', imageAlt: 'Dashboard Studio charts', background: '#0A8F5B', foreground: '#FFFFFF' },
];
const LINKS = [
    ['/work/the-ferment-formula.html', 'https://thefermentformula.in/'],
    ['/work/proposalforge.html', 'https://proposalforge.redevops.in/'],
    ['/work/siteaudit-pro.html', 'https://siteaudit.redevops.in/'],
    ['/work/brandkit-studio.html', 'https://brandkit.redevops.in/'],
    ['/work/dashboard-studio.html', 'https://dashboardstudio.redevops.in/'],
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

export default function Home() {
    return (
        <>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-white">Skip to content</a>

            {/* Toolbar */}
            <header className="sticky top-0 z-40 border-b border-line bg-paper">
                <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-8">
                    <a href="#top" className="flex items-baseline gap-2 font-extrabold tracking-tight">
                        RE Dev Ops<span className="hidden font-mono text-[11px] font-normal text-muted-foreground sm:inline">/ home</span>
                    </a>
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

            <main id="main" className="grid gap-16 [&>*]:min-w-0 px-4 pb-24 pt-10 md:gap-24 md:px-8 md:pt-14">
                <span id="top" className="absolute top-0" />

                {/* Hero */}
                <section className="mx-auto w-full max-w-[1320px]">
                    <p className="frame-label"><span>01 — Hero</span><span className="hidden sm:inline">Move your cursor through the name</span></p>
                    <div className="frame overflow-hidden p-6 md:p-12 lg:p-16">
                        <HeroMark />
                        <div className="mt-8 grid gap-8 [&>*]:min-w-0 lg:grid-cols-12 lg:gap-12">
                            <h1 className="display text-[clamp(1.9rem,1rem+2.6vw,3.4rem)] lg:col-span-7">We’re a student-founded studio. We build websites, apps and the systems behind them.</h1>
                            <div className="grid content-start gap-6 [&>*]:min-w-0 lg:col-span-5">
                                <p className="text-lg text-muted-foreground">No account managers and no handoffs. You talk to the people writing the code, and we reply within 6–12 hours.</p>
                                <div className="flex flex-wrap gap-3">
                                    <a href="#contact" className="btn btn-ink">Start a project →</a>
                                    <a href="#work" className="btn btn-ghost">See the work</a>
                                </div>
                                <BuildBoard />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Every live project on a 3D spiral (Componentry spiral-3d-slider) */}
                <section id="work" className="mx-auto w-full max-w-[1320px]">
                    <p className="frame-label"><span>02 — Work</span><span className="hidden sm:inline">Scroll to move through it</span></p>
                    <div className="frame overflow-hidden !border-ink !bg-ink text-white">
                        <div className="px-6 pt-6 md:px-12 md:pt-12">
                            <h2 className="display h2">Real work. All of it live.</h2>
                            <p className="mt-3 max-w-[36em] text-white/65">One client website and four tools of our own. Nothing here is a mock-up — every one opens.</p>
                        </div>
                        <WorkSpiral items={SLIDES} />
                    </div>
                </section>

                {/* The five builds as fold-away case studies (Componentry case-study-flip-stack) */}
                <WorkFlip items={CASES} />

                <Frame name="03 — Open them" note="Every one is live" className="p-6 md:p-12">
                    <ul>
                        {CASES.map((c, i) => (
                            <li key={c.title} className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line py-4" data-inspect data-b="box" data-by={who(i)} data-dur="450">
                                <span className="text-xl font-extrabold tracking-tight md:text-2xl">{c.title}</span>
                                <span className="flex gap-5 text-sm font-semibold">
                                    <a className="link" href={LINKS[i][0]}>Project details →</a>
                                    <a className="link" href={LINKS[i][1]} target="_blank" rel="noopener">Open it ↗</a>
                                </span>
                            </li>
                        ))}
                    </ul>
                    {/* The client's review, left as a comment on the frame */}
                    <figure className="mt-10 flex gap-4" data-b="box" data-by="pm" data-dur="700">
                        <span className="pin" aria-hidden="true">SA</span>
                        <div className="grid gap-3">
                            <figcaption className="text-sm"><strong>Satyam Awasthi</strong> <span className="text-muted-foreground">— Founder & Principal Brewmaster, The Ferment Formula (Bengaluru)</span></figcaption>
                            <blockquote className="max-w-[52em] text-lg leading-relaxed md:text-xl">“We needed a website that felt as crafted as the beer we help make, and that explained what a brewery consultant actually does without drowning people in jargon. Aayush and Thaseen asked the right questions, were straight with us about timelines, and turned around every change quickly. The site is fast even on a patchy connection in the middle of a brewhouse, and it&apos;s the first thing I now send to a brewery owner who wants to know who we are.”</blockquote>
                        </div>
                    </figure>
                </Frame>

                {/* Who we are, revealed word by word on scroll (Magic UI text-reveal) */}
                <TextReveal>RE Dev Ops is an independent, student-founded studio in India. We bring product thinking and engineering together, with direct collaboration throughout your project.</TextReveal>

                {/* Services */}
                <Frame id="services" name="04 — Services" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10" data-b="type" data-by="copy" data-cps="45">What do you need built?</h2>
                    <ol>
                        {SERVICES.map(([title, body], i) => (
                            <li key={title} className="grid gap-3 border-t border-line py-7 md:grid-cols-12 md:gap-8" data-inspect data-b="box" data-by={who(i + 2)} data-dur="600">
                                <span className="label md:col-span-1">0{i + 1}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight md:col-span-5 md:text-3xl">{title}</h3>
                                <p className="text-muted-foreground md:col-span-6">{body}</p>
                            </li>
                        ))}
                        <li className="grid gap-3 border-y border-line bg-canvas px-4 py-7 md:grid-cols-12 md:gap-8" data-inspect data-b="box" data-by="qa" data-dur="600">
                            <span className="label md:col-span-1">NFC</span>
                            <h3 className="text-2xl font-extrabold tracking-tight md:col-span-5 md:text-3xl">NFC cards & review stands</h3>
                            <p className="text-muted-foreground md:col-span-6">A tap opens your menu, review page, contact or social profile on compatible phones. We design, program and deliver them — in Bangalore only. <a className="link whitespace-nowrap font-semibold text-ink" href="/nfc.html">Explore NFC →</a></p>
                        </li>
                    </ol>
                </Frame>

                {/* Process */}
                <Frame name="05 — Process" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10" data-b="type" data-by="copy" data-cps="45">How it goes.</h2>
                    <ol className="grid gap-4 md:grid-cols-4">
                        {STEPS.map(([title, body], i) => (
                            <li key={title} className="relative grid content-start gap-3 border border-line p-5" data-inspect data-b="box" data-by={who(i)} data-dur="500">
                                <span className="label">Step 0{i + 1}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                                <p className="text-muted-foreground">{body}</p>
                                {i < 3 && <span aria-hidden="true" className="absolute -right-[13px] top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full bg-ink text-xs text-white md:grid">→</span>}
                            </li>
                        ))}
                    </ol>
                    <a href={CALENDLY} target="_blank" rel="noopener" className="btn btn-ghost mt-8" data-b="box" data-by="pm" data-dur="350">Book an introductory call ↗</a>
                </Frame>

                {/* Studio */}
                <Frame id="studio" name="06 — Studio" className="p-6 md:p-12">
                    <h2 className="display h2 mb-10 max-w-[14em]" data-b="type" data-by="copy" data-cps="45">Who you’ll actually talk to.</h2>
                    <TeamLanyardRail
                        items={TEAM.map((p, i) => ({
                            id: p.name,
                            name: p.name,
                            role: p.role,
                            team: 'RE Dev Ops',
                            image: '',
                            bio: p.bio,
                            tone: ([1, 2, 3] as const)[i],
                            links: [{ label: 'GitHub', href: p.github }, { label: 'LinkedIn', href: p.linkedin }],
                        }))}
                        caption="Brush along the rail, pull a badge down, click to flip it."
                    />
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
                        <h2 className="display mb-6 text-4xl" data-b="type" data-by="pm" data-cps="45">Asked first, usually.</h2>
                        <div data-b="box" data-by="dev" data-dur="700">
                            {FAQ.map(([q, a]) => (
                                <details key={q} className="group border-t border-line">
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold">{q}<span aria-hidden="true" className="font-mono text-muted-foreground group-open:rotate-45">+</span></summary>
                                    <p className="pb-5 text-muted-foreground">{a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </Frame>

                {/* Contact */}
                <Frame id="contact" name="08 — Contact" className="grid gap-12 !border-ink !bg-ink p-6 text-white md:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
                    <div className="grid content-start gap-6">
                        <Watching />
                        <h2 className="display text-[clamp(2.4rem,1rem+4.6vw,5rem)]">{'Got something to build?'.split(' ').map((w) => <span key={w} className="mr-[0.25em] inline-block whitespace-nowrap"><TextRepel text={w} radius={140} strength={46} /></span>)}</h2>
                        <p className="max-w-[30em] text-lg text-white/70" data-b="type" data-by="copy" data-cps="200">Tell us in a line or two. A rough idea is enough to start.</p>
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

            <SiteDock />

            <footer className="border-t border-line bg-paper pb-24">
                <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-6 text-sm md:px-8">
                    <p className="text-muted-foreground">© 2026 RE Dev Ops · India · The named cursors on this page are a scripted animation.</p>
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
