# RE Dev Ops — "Ledger" redesign notes

Branch: `redesign/creative-studio-v2`. Nothing on this branch is pushed or deployed.

## 1. Audit (Phase 1, before any change)

| Area | Finding |
|---|---|
| Framework | Static hand-written HTML/CSS/vanilla JS. No root `package.json`, no build step. Vercel serves files as-is. |
| Routing | Files on disk + `vercel.json` redirects (`/index.html` → `/`, the four app folders with and without trailing slash → their subdomains). No `cleanUrls`. |
| Styles | One `style.css` (≈97 KB, cyan-on-black theme). Inline `<style>` blocks in `blog/*.html`, `privacy.html`, `404.html`. Many inline `style=""` attributes in `index.html`. |
| Scripts | 13 `<script>` tags in `index.html`, all inline except Lenis (unpkg) and Calendly (loaded eagerly in `<head>`). Includes particle canvas, custom cursor, fake terminal, scroll-spy, counters, project modal, FAQ, contact form + `LEAD_WEBHOOK_URL` (empty), WhatsApp widget, NFC off-screen pause, mobile dock auto-hide. |
| Fonts | Space Grotesk from Google Fonts. |
| Contact | `#contactForm` with honeypot `website`, 3 s timing check, validation message, mailto fallback, `window.sendLead`; WhatsApp widget `#waWidget`; Calendly popup `https://calendly.com/redevops3/30min`. |
| SEO | Canonicals, OG/Twitter on `https://www.redevops.in`; JSON-LD: WebSite **with a SearchAction the site doesn't support**, Organization/LocalBusiness, ItemList, FAQPage. Sitemap + robots on www. Google verification + Microsoft Clarity present. |
| Manifest | `site.webmanifest` references `/favicon-32x32.png`, **which does not exist**; colours are the old cyan theme. |
| Assets | Real 1440×900 JPG screenshots for all five projects (`ferment_formula`, `proposal_forge`, `siteaudit`, `brandkit`, `dashboard_studio`). Older PNGs: `brandkit.png`/`siteaudit.png` 1200×750, `proposal_forge.png`/`dashboard_studio.png` 1024×1024 (these two are mock renders, not the real apps — not used). `kinetik_studio.png`, `vortex_analytics.png` unrelated — not used. |
| Deployment | Vercel from the default branch. |

### Where the brief and the repository differ
- §2.6 says "all 1440×900": true for the JPGs only; the PNG variants are different sizes (and two are not real app screenshots). The redesign uses only the JPGs.
- §2.4 says Calendly should be lazy-loaded: today it is loaded eagerly in `<head>`. Redesign makes it lazy, as briefed.
- FAQ "What technologies…" lists Kubernetes, GraphQL, Redis, React Native etc., which the projects themselves don't show. These are the owner's own stated skills, so the answer is kept verbatim (owner may trim).
- `site.webmanifest` icon `favicon-32x32.png` missing (fixed in the redesign).
- Reply-time copy is "6–12 hours" everywhere (matches the brief).

## 2. What changed and why

Direction: **Ledger** — warm paper, black ink, one signal colour (`#C73A17`), monospace metadata, hairline rules, one dark "night" band for NFC. The real projects are the hero's visual (a typeset project index + live screenshot), so the first screen proves the studio ships.

Added on the owner's request ("make it fun, interactive, bolder, non-laggy") on top of the brief:
- Condensed, heavier display type (full variable Bricolage, `font-display: optional` → no layout shift).
- Hero headline letters lean toward the cursor (transforms only, mouse devices only, off under reduced motion).
- Signal marker on "your business", outlined index/service numerals, studio-product screenshots tilted ±1.2° that straighten on hover, a "Bengaluru · Software studio · Since 2025" sticker that spins on hover.
- A playable NFC demo (Menu / Reviews / Instagram) — a diagram, not a fake app screen.
These deliberately relax §6.3/§5.3 "no tilt" and add hover motion; nothing animates while idle, and all of it is removed under `prefers-reduced-motion`.

Palettes: `ledger` (live), `night` and `moss` (design lab only, `css/tokens.css`).

### Files
- Added: `css/tokens.css`, `css/base.css`, `css/layout.css`, `css/components.css`, `css/pages/{home,work,nfc,article}.css`; `js/{main,nav,index-preview,reveal,contact,whatsapp,calendly,deeplinks,fun}.js`; `work/*.html` (5); `nfc.html`; `design-lab/`; `assets/fonts/` (+ licences); `assets/img/` (AVIF/WebP + 4:5 crops); `assets/nfc/README.md`; `favicon-32x32.png`; `tools/qa/` (Playwright checks, html-validate config, image script); `.vercelignore`.
- Rewritten: `index.html`, `privacy.html`, `404.html`, `blog/*.html` (same URLs, metadata and JSON-LD), `favicon.svg`/`.ico`/PNGs, `og-image.png`, `site.webmanifest`, `sitemap.xml` (+6 URLs).
- Removed: `style.css`; Lenis/unpkg, particle canvas, fake IDE/terminal, marquee, stats counter, custom cursor, floating social dock, WhatsApp "1" badge, `WebSite → SearchAction` JSON-LD.
- Untouched: `proposalforge/`, `siteaudit/`, `brandkit/`, `dashboardstudio/`, `vercel.json`.

### Decisions where the brief was silent or in tension
- Header "Start a project" is the **ink** button, so the signal button appears once per viewport (§6.1) alongside the hero CTA.
- WhatsApp widget markup is injected by `js/whatsapp.js` (same IDs/ARIA) instead of copied into 11 pages; it needs JS to work anyway. `nfc.html` uses the sticky bar instead (`data-no-wa-fab`).
- The contact success message is now built with `textContent` (the old version injected the visitor's name/email into `innerHTML`).
- All `ch` measures converted to `em`: `ch` changes when the web font loads and caused CLS 0.067 on articles.
- FAQ answers kept verbatim (including the technology lists the owner wrote); JSON-LD matches the visible text exactly.
- Hero H1 runs to 5 lines at 1440 in the 6-column copy area; H1, lead, both CTAs and the full preview are still above the fold (checked).
- Portrait slot: replace `<div class="monogram" aria-hidden="true">AK</div>` with `<img class="person__photo" src="assets/team/aayush.jpg" width="320" height="320" alt="Aayush Kumar">` (style exists).

## 3. Owner to confirm
New copy written for the redesign (not on the old site):
- Hero H1 "We build the websites, apps and tools your business runs on." and lead. Alternatives: "Software for real businesses, built by the people you talk to." / "Websites, apps and automations — designed, built and shipped by a small studio."
- Services rows (titles, one-liners, bullets, "Example" choices).
- Studio intro: "RE Dev Ops is a small studio founded in 2025 by three college students who already do real client work…"
- Mahima's bio: removed "that save our clients hours every week".
- Project "problem it solves" lines on each `/work/` page, and **"Our role: Design, development and deployment"** for all five.
- NFC "How it works" three steps on `/nfc.html`, and the NFC demo labels ("Your café", "Today's menu", "@yourcafe").
- Sticker text "Bengaluru · Software studio · Since 2025".
- Footer description.
Pending from the owner: real NFC product photos (`assets/nfc/README.md`), optional team portraits.

## 4. Test results (local, `python -m http.server`)
- Layout checks (`tools/qa/run-checks.mjs`): 11 pages × 9 viewports = 99 runs. No horizontal overflow, no tap target under 44×44, no text under 12px, no clipped text, all images sized + alt, no console errors, max CLS 0.004. Hero above the fold at 390×844, 375×667, 1440×900.
  - **Remaining:** "WhatsApp FAB overlaps a link" at some scroll positions on `/` and three `/work/` pages (29 hits). Any floating button passes over content while scrolling; it is hidden over Contact and the footer and the footer has 88px clearance. Accepted rather than hiding the button mid-page.
- Behaviour (18/18 pass): menu open / focus trap / Esc / link-close, FAQ, quick brief → exact `wa.me` URL, quick brief → form, empty-submit validation, `buildMailto()`, honeypot path, `#project-*` deep link redirect, preview swap on hover and on keyboard focus, reduced motion (nothing hidden, no transforms), no animation running on load, nav jump never lands on blank content, no-JS hero visible.
- HTML validation (html-validate, recommended rules): 0 errors on all pages.
- Internal links (linkinator): 82 checked, 0 broken.
- Lighthouse (local, no compression/HTTP2):

| Page | Mobile perf | Desktop perf | A11y | Best pr. | SEO | Mobile LCP | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 88 | 100 | 100 | 100 | 100 | 3.6 s | 0 |
| `/work/the-ferment-formula.html` | 97 | 100 | 100 | 100 | 100 | 2.4 s | 0 |
| `/nfc.html` | 95 | 100 | 100 | 100 | 100 | 2.7 s | 0 |

  Homepage mobile misses the ≥90 / LCP <2.0 s goal. LCP element is the hero screenshot; Lighthouse attributes ~530 ms to render-blocking CSS (5 files, uncompressed on the dev server). Vercel serves Brotli over HTTP/2, so re-measure with PageSpeed Insights after deploy; if still <90, concatenate the four core CSS files.
- Page height (homepage): 10,758 px at 1440 (target ≤7,500), 17,450 px at 390 (target ≤11,000). Over target because the brief also requires full-bleed 4:5 screenshots for all five projects plus every section; trimming further means cutting content the owner should decide on.
- Screenshots: `tools/qa/screenshots/` (git-ignored).

## 5. Preview and deploy
```
git checkout redesign/creative-studio-v2
python -m http.server 5510
```
Open http://localhost:5510/ and http://localhost:5510/design-lab/.
QA: `cd tools/qa && npm install && npm test` (server running), `npx html-validate --config .htmlvalidate.json "../../*.html"`.
Deploy when ready: merge the branch into `main` and push; Vercel deploys. `.vercelignore` keeps `design-lab/`, `tools/` and this file out of production.
