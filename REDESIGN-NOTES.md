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
- FAQ "What technologies…" lists Kubernetes, GraphQL, Redis, React Native etc. Not verifiable from the repo; trimmed to what the projects show (see Owner to confirm).
- `site.webmanifest` icon `favicon-32x32.png` missing (fixed in the redesign).
- Reply-time copy is "6–12 hours" everywhere (matches the brief).
