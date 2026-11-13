import { ContactForm } from '@/components/contact-form';
import { HeroMark, Watching } from '@/components/hero-fx';
import { TeamLanyardRail } from '@/components/ui/team-lanyard-rail';

const WA = (text: string) => `https://wa.me/918734000403?text=${encodeURIComponent(text)}`;
const CALENDLY = 'https://calendly.com/redevops3/30min';

const NAV = [['#work', 'Work'], ['#nfc', 'NFC'], ['#services', 'Services'], ['#team', 'Team'], ['#contact', 'Contact']];

const FACTS = [
    ['6–12 hours', 'How fast we reply to a message.'],
    ['No middlemen', 'You talk to the people who write the code.'],
    ['Documented handover', 'Every project ends with one, so you are never locked in.'],
];

const TOOLS = [
    { slug: 'proposalforge', img: 'proposal_forge', name: 'ProposalForge', url: 'https://proposalforge.redevops.in/', desc: 'An invoice and proposal builder that runs entirely in the browser — no sign-up, no server.' },
    { slug: 'siteaudit-pro', img: 'siteaudit', name: 'SiteAudit Pro', url: 'https://siteaudit.redevops.in/', desc: 'Paste any URL and get a scored audit of SEO, performance, accessibility, mobile and security headers.' },
    { slug: 'brandkit-studio', img: 'brandkit', name: 'BrandKit Studio', url: 'https://brandkit.redevops.in/', desc: 'A brand identity toolkit: palettes, contrast checks, gradients, font pairings and token export.' },
    { slug: 'dashboard-studio', img: 'dashboard_studio', name: 'Dashboard Studio', url: 'https://dashboardstudio.redevops.in/', desc: 'Drop in a sales CSV and get KPIs, charts, filters and searchable records — all in the browser.' },
];

const SERVICES = [
    ['Websites', 'A clear home for your business: useful content, considered interfaces and a documented handover.', 'See The Ferment Formula above.'],
    ['Web applications', 'A tool that supports how your business runs, built for the browser.', 'See our four tools above.'],
    ['Mobile applications', 'Mobile experiences built around the task at hand, with interfaces and connected features shaped around your users.', ''],
    ['Infrastructure & integrations', 'Hosting, deployment workflows, APIs and connected business systems. We can discuss AI features and workflow automation where they fit your product.', ''],
];

const STEPS = [
    ['Discover', 'We understand your goals, users and constraints.'],
    ['Define', 'We agree the scope, deliverables and responsibilities — and quote around that scope.'],
    ['Build', 'You see previews and give feedback as the work develops.'],
    ['Launch', 'We test, deploy, document and hand over.'],
];

const TEAM = [
    { name: 'Aayush Kumar', role: 'Founder & Lead Engineer', bio: 'Architecture, full-stack development and deployment, from client websites to the studio’s own tools.', github: 'https://github.com/h4ck3rx99-stack', linkedin: 'https://www.linkedin.com/in/aayushkumar-redevops/' },
    { name: 'Mahima Hemanth', role: 'Co-Founder · AI & Product', bio: 'Product scoping, AI-powered features and workflow automation, connecting the brief to what gets built.', github: 'https://github.com/mahimahemanthuniversity', linkedin: 'https://www.linkedin.com/in/mahima-hemanth-845405441/' },
    { name: 'Thaseen Haque', role: 'Backend & Growth Engineer', bio: 'APIs, databases and integrations, alongside SEO, analytics and launch strategy.', github: 'https://github.com/thaseenabbut', linkedin: 'https://www.linkedin.com/in/thaseen-haque-765b05428/' },
];

const FAQ = [
    ['How is a project priced?', 'We prepare a quote around the agreed scope. Changes to that scope are discussed before extra work begins.'],
    ['How long will it take?', 'Timing depends on scope, integrations and feedback. We agree a schedule during planning rather than promise the same window for every project.'],
    ['Who owns the finished work?', 'Source code, domain and hosting ownership are covered in the project agreement, with a documented handover.'],
    ['Where do you work?', 'Our studio operates from India and collaborates remotely. NFC products are currently available only in Bangalore.'],
];

const POSTS = [
    ['How to Cut Cloud Infrastructure Costs Without Losing Performance', '/blog/cloud-cost-optimization.html'],
    ['Next.js vs Traditional Websites: What Actually Matters for SEO in 2026', '/blog/nextjs-seo-2026.html'],
    ['Building AI-Powered SaaS Features Without a Data Science Team', '/blog/ai-features-no-data-science.html'],
];

function Shot({ img, alt, eager, sizes }: { img: string; alt: string; eager?: boolean; sizes: string }) {
    return (
        <picture>
            <source type="image/avif" srcSet={`/assets/img/${img}-640.avif 640w, /assets/img/${img}-960.avif 960w, /assets/img/${img}-1440.avif 1440w`} sizes={sizes} />
            <source type="image/webp" srcSet={`/assets/img/${img}-640.webp 640w, /assets/img/${img}-960.webp 960w, /assets/img/${img}-1440.webp 1440w`} sizes={sizes} />
            <img src={`/assets/${img}.jpg`} alt={alt} width={1440} height={900} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} decoding="async" className="block h-auto w-full" />
        </picture>
    );
}

const wrap = 'mx-auto w-full max-w-[1240px] px-5 md:px-10';
const section = `${wrap} py-16 md:py-24`;

export default function Home() {
    return (
        <>
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-4 focus:py-3 focus:text-white">Skip to content</a>

            <header className="sticky top-0 z-40 border-b border-line bg-paper">
                <div className={`${wrap} flex min-h-16 flex-wrap items-center justify-between gap-x-6`}>
                    <a href="#top" className="py-3 text-lg font-extrabold tracking-tight">RE Dev Ops</a>
                    <a href="#contact" className="btn btn-ink order-2 !min-h-11 !px-4 md:order-3">Start a project</a>
                    <nav aria-label="Main" className="order-3 -mx-2 flex w-full gap-1 overflow-x-auto pb-2 font-medium md:order-2 md:mx-0 md:w-auto md:pb-0">
                        {NAV.map(([href, label]) => <a key={href} href={href} className="px-3 py-2 hover:text-accent">{label}</a>)}
                    </nav>
                </div>
            </header>

            <main id="main">
                <span id="top" className="absolute top-0" />

                {/* 1. Who we are and what we do */}
                <section className={`${wrap} pb-14 pt-8 md:pb-20 md:pt-12`}>
                    <HeroMark />
                    <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
                        <h1 className="display text-[clamp(2rem,1rem+2.9vw,3.6rem)] lg:col-span-7">We build websites, web apps and NFC touchpoints. You work with the three people who build them.</h1>
                        <div className="grid content-start gap-6 lg:col-span-5">
                            <p className="text-lg text-muted-foreground md:text-xl">RE Dev Ops is a student-founded studio in India. No account managers and no handoffs — and we reply within 6–12 hours.</p>
                            <div className="flex flex-wrap gap-3">
                                <a href="#contact" className="btn btn-ink">Start a project →</a>
                                <a href="#work" className="btn btn-ghost">See the work</a>
                            </div>
                        </div>
                    </div>
                    <dl className="mt-14 grid gap-px border border-line bg-line sm:grid-cols-3">
                        {FACTS.map(([big, small]) => (
                            <div key={big} className="bg-paper p-6">
                                <dt className="text-2xl font-extrabold tracking-tight">{big}</dt>
                                <dd className="mt-1 text-muted-foreground">{small}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                {/* 2. Proof: the client project, with the client's own words */}
                <section id="work" aria-labelledby="work-h" className="bg-ink text-white">
                    <div className={`${section} grid gap-10 lg:grid-cols-12 lg:gap-14`}>
                        <div className="lg:col-span-7">
                            <a href="/work/the-ferment-formula.html" className="block" aria-label="The Ferment Formula project details">
                                <Shot img="ferment_formula" eager sizes="(min-width: 1024px) 56vw, 100vw" alt="The Ferment Formula homepage: brewhouse photo with the headline End-to-End Brewery Setup and an Explore setup button" />
                            </a>
                        </div>
                        <div className="grid content-start gap-5 lg:col-span-5">
                            <p className="label !text-white/70">Client website · Bangalore · live</p>
                            <h2 id="work-h" className="display h2">The Ferment Formula</h2>
                            <p className="text-lg text-white/80">Website for a Bangalore craft-brewery consultancy led by principal brewmaster Satyam Awasthi. Multi-page site covering brewery setup, revival, recipes and training — with local-business SEO, a gallery, awards and a WhatsApp enquiry widget.</p>
                            <div className="flex flex-wrap gap-3">
                                <a href="/work/the-ferment-formula.html" className="btn btn-accent">Explore the project →</a>
                                <a href="https://thefermentformula.in/" target="_blank" rel="noopener" className="btn btn-ghost-light">Visit the site ↗<span className="sr-only"> (opens in a new tab)</span></a>
                            </div>
                        </div>
                        <figure className="border-t border-white/20 pt-10 lg:col-span-12">
                            <blockquote className="max-w-[46em] text-xl leading-relaxed md:text-2xl md:leading-relaxed">“We needed a website that felt as crafted as the beer we help make, and that explained what a brewery consultant actually does without drowning people in jargon. Aayush and Thaseen asked the right questions, were straight with us about timelines, and turned around every change quickly. The site is fast even on a patchy connection in the middle of a brewhouse, and it&apos;s the first thing I now send to a brewery owner who wants to know who we are.”</blockquote>
                            <figcaption className="mt-5 text-white/80"><strong className="text-white">Satyam Awasthi</strong> — Founder & Principal Brewmaster, The Ferment Formula</figcaption>
                        </figure>
                    </div>
                </section>

                {/* 3. The product you can buy today */}
                <section id="nfc" aria-labelledby="nfc-h" className={`${section} grid gap-10 lg:grid-cols-12 lg:gap-14`}>
                    <div className="grid content-start gap-5 lg:col-span-7">
                        <p className="label">NFC · Bangalore only</p>
                        <h2 id="nfc-h" className="display h2">A card on the counter. One tap to your menu, reviews or contact.</h2>
                        <p className="max-w-[36em] text-lg text-muted-foreground">NFC cards and stands open a menu, review page, contact or social profile on compatible phones. We design, program and deliver them in Bangalore.</p>
                        <div className="flex flex-wrap gap-3">
                            <a href={WA("Hi! I'm interested in your NFC products in Bangalore.")} target="_blank" rel="noopener" className="btn btn-ink">Enquire on WhatsApp ↗<span className="sr-only"> (opens in a new tab)</span></a>
                            <a href="/nfc.html" className="btn btn-ghost">Explore NFC →</a>
                        </div>
                    </div>
                    <ol className="grid gap-px self-center border border-line bg-line text-lg font-semibold lg:col-span-5" aria-label="How NFC works">
                        {['Customer taps the card or stand', 'Their phone opens your link', 'Menu, reviews, contact or socials'].map((t, i) => (
                            <li key={t} className="flex items-center gap-4 bg-paper p-5"><span className="grid size-9 flex-none place-items-center bg-ink font-mono text-sm text-white">{i + 1}</span>{t}</li>
                        ))}
                    </ol>
                </section>

                {/* 4. More proof: tools we built and run */}
                <section aria-labelledby="tools-h" className="border-y border-line bg-canvas">
                    <div className={section}>
                        <p className="label">Our own tools · free · live</p>
                        <h2 id="tools-h" className="display h2 mt-4">Four tools we built for ourselves. Open to everyone.</h2>
                        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {TOOLS.map((t) => (
                                <li key={t.slug} className="grid content-start gap-3">
                                    <a href={`/work/${t.slug}.html`} tabIndex={-1} aria-hidden="true" className="block border border-line"><Shot img={t.img} alt="" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" /></a>
                                    <h3 className="text-xl font-extrabold tracking-tight"><a href={`/work/${t.slug}.html`} className="hover:text-accent">{t.name}</a></h3>
                                    <p className="text-muted-foreground">{t.desc}</p>
                                    <a className="link font-semibold" href={t.url} target="_blank" rel="noopener">Open {t.name} ↗<span className="sr-only"> (opens in a new tab)</span></a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 5. What we do and how it goes */}
                <section id="services" aria-labelledby="services-h" className={section}>
                    <h2 id="services-h" className="display h2">What do you need built?</h2>
                    <ul className="mt-10">
                        {SERVICES.map(([title, body, proof]) => (
                            <li key={title} className="grid gap-2 border-t border-line py-6 md:grid-cols-12 md:gap-8">
                                <h3 className="text-2xl font-extrabold tracking-tight md:col-span-5">{title}</h3>
                                <p className="text-lg text-muted-foreground md:col-span-7">{body}{proof && <> <span className="font-semibold text-ink">{proof}</span></>}</p>
                            </li>
                        ))}
                    </ul>

                    <h2 className="display mt-20 text-4xl md:text-5xl">How it goes.</h2>
                    <ol className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                        {STEPS.map(([title, body], i) => (
                            <li key={title} className="grid content-start gap-2 bg-paper p-6">
                                <span className="label">Step {i + 1}</span>
                                <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
                                <p className="text-muted-foreground">{body}</p>
                            </li>
                        ))}
                    </ol>
                    <div className="mt-10 grid gap-x-12 lg:grid-cols-2">
                        {FAQ.map(([q, a]) => (
                            <details key={q} className="group border-t border-line">
                                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-lg font-semibold">{q}<span aria-hidden="true" className="font-mono text-xl text-muted-foreground group-open:rotate-45">+</span></summary>
                                <p className="pb-5 text-lg text-muted-foreground">{a}</p>
                            </details>
                        ))}
                    </div>
                </section>

                {/* 6. The people */}
                <section id="team" aria-labelledby="team-h" className="border-y border-line">
                    <div className={section}>
                        <h2 id="team-h" className="display h2">Who you’ll actually talk to.</h2>
                        <TeamLanyardRail
                            className="mt-6"
                            aria-label="Team badges"
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
                        {/* The same details as plain text, for anyone who does not use the badges */}
                        <ul className="mt-4 grid gap-8 md:grid-cols-3">
                            {TEAM.map((p) => (
                                <li key={p.name} className="grid content-start gap-2 border-t border-line pt-5">
                                    <h3 className="text-2xl font-extrabold tracking-tight">{p.name}</h3>
                                    <p className="font-semibold">{p.role}</p>
                                    <p className="text-lg text-muted-foreground">{p.bio}</p>
                                    <p className="flex gap-5 font-semibold">
                                        <a className="link" href={p.github} target="_blank" rel="noopener">GitHub ↗<span className="sr-only"> of {p.name} (opens in a new tab)</span></a>
                                        <a className="link" href={p.linkedin} target="_blank" rel="noopener">LinkedIn ↗<span className="sr-only"> of {p.name} (opens in a new tab)</span></a>
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* 7. Contact */}
                <section id="contact" aria-labelledby="contact-h" className="bg-ink text-white">
                    <div className={`${section} grid gap-12 lg:grid-cols-2 lg:gap-16`}>
                        <div className="grid content-start gap-6">
                            <Watching />
                            <h2 id="contact-h" className="display text-[clamp(2.4rem,1rem+4.4vw,4.75rem)]">Got something to build?</h2>
                            <p className="max-w-[30em] text-xl text-white/80">Tell us in a line or two. A rough idea is enough to start, and we reply within 6–12 hours.</p>
                            <ul className="grid gap-1 text-xl font-semibold">
                                <li><a className="link inline-block py-1.5" href="mailto:hello@redevops.in">hello@redevops.in</a></li>
                                <li><a className="link inline-block py-1.5" href="tel:+918734000403">+91 8734000403</a></li>
                                <li><a className="link inline-block py-1.5" href={WA("Hi! I'd like to talk about a project.")} target="_blank" rel="noopener">WhatsApp ↗<span className="sr-only"> (opens in a new tab)</span></a></li>
                                <li><a className="link inline-block py-1.5" href={CALENDLY} target="_blank" rel="noopener">Book a 30-minute call ↗<span className="sr-only"> (opens in a new tab)</span></a></li>
                            </ul>
                        </div>
                        <ContactForm />
                    </div>
                </section>
            </main>

            <footer className="bg-paper">
                <div className={`${wrap} grid gap-8 py-10 md:grid-cols-3`}>
                    <div>
                        <p className="text-lg font-extrabold">RE Dev Ops</p>
                        <p className="mt-2 text-muted-foreground">A student-founded software studio in India. NFC products in Bangalore.</p>
                        <p className="mt-4 text-muted-foreground">© 2026 RE Dev Ops</p>
                    </div>
                    <nav aria-label="Writing">
                        <h2 className="label">Writing</h2>
                        <ul className="mt-3 grid gap-2">
                            {POSTS.map(([title, href]) => <li key={href}><a className="link" href={href}>{title}</a></li>)}
                        </ul>
                    </nav>
                    <nav aria-label="Elsewhere">
                        <h2 className="label">Elsewhere</h2>
                        <ul className="mt-3 grid grid-cols-2 gap-2 font-medium">
                            <li><a className="link" href="https://github.com/RE-Dev-Ops" target="_blank" rel="noopener">GitHub ↗</a></li>
                            <li><a className="link" href="https://www.linkedin.com/in/redevops/" target="_blank" rel="noopener">LinkedIn ↗</a></li>
                            <li><a className="link" href="https://x.com/redevops3" target="_blank" rel="noopener">X ↗</a></li>
                            <li><a className="link" href="https://www.instagram.com/redevops3/" target="_blank" rel="noopener">Instagram ↗</a></li>
                            <li><a className="link" href="/nfc.html">NFC</a></li>
                            <li><a className="link" href="/privacy.html">Privacy</a></li>
                        </ul>
                    </nav>
                </div>
            </footer>
        </>
    );
}
