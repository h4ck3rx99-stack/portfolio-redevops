# RE Dev Ops — redevops.in

The studio website. Next.js 16 (App Router) + Tailwind 4, deployed on Vercel.
A push to `main` deploys production; any other branch gets a preview.

## Run it

```bash
npm install
npm run dev
```

## Layout

| Path | What it is |
|---|---|
| `app/page.tsx` | Homepage |
| `app/[...path]/page.tsx` | Inner pages (projects, articles, NFC, privacy), generated from `content/` |
| `content/` | The inner pages' original HTML. Edit copy here; only the `<main>`, title, description and JSON-LD are used |
| `lib/pages.ts` | Reads `content/` and rewrites links for the site |
| `components/site-shell.tsx` | Header and footer shared by every page |
| `components/hero-fx.tsx` | Client pieces: particle name, flip board, NFC try-it, eyes, repelling heading |
| `components/ui/` | Third-party components (Componentry, 21st.dev), lightly adapted |
| `app/api/check` + `lib/check.js` | Website-checker API. Not used by any page at the moment |
| `public/` | Images, icons, sitemap, robots |
| `proposalforge/`, `siteaudit/`, `brandkit/`, `dashboardstudio/` | The four tool apps. Separate Vercel projects; not part of this site's build |
| `tools/qa/` | Dev-only browser tests (own `package.json`) |

`vercel.json` holds the redirects to the tool subdomains. Page addresses still end in `.html` on purpose, so existing links and search results keep working.

## Tests

With the site running on port 3100 (`npm run dev -- -p 3100`):

```bash
cd tools/qa
npm install
node home-next.mjs
node inner-pages.mjs
node api-check.test.mjs
```

`node lighthouse.mjs` expects a production build on port 3200 (`npm run build && npx next start -p 3200`).

## Rules for content

- Nothing invented: no clients, numbers, reviews, prices or photos that are not real.
- The review on the homepage is attributed to a real person. Change its wording only with his agreement.

## Open items

- Starting price and typical timeline are not on the site yet.
- Team badges show a silhouette until real photos are added (`image` in `app/page.tsx`).
- The contact form hands off to the visitor's WhatsApp or email; there is no lead capture or analytics. If analytics is added, the privacy page (`content/privacy.html`) must say so.
