# ZIAN AI CONCEPTS — Landing Page

Animated single-page landing for **ZIAN AI CONCEPTS** (André Zimmermann). Tech-noir design, scroll-triggered timeline choreography, bilingual DE/EN.

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` config)
- **GSAP 3** + **ScrollTrigger** (pinned scrubbed timelines, horizontal pin scroll)
- **Three.js** (WebGL particle field in hero, lazy-loaded)
- **Lenis** (smooth scroll bridged into ScrollTrigger)
- **react-i18next** (DE default, EN toggle, persisted in localStorage)
- **lucide-react** icons, **Geist** + **Geist Mono** via `@fontsource-variable`

## Quick start

```bash
npm install
cp .env.example .env   # set form endpoint, ollama URL, analytics — all optional
npm run dev            # http://localhost:5173
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript only |

## Environment variables

| Variable | Purpose |
|---|---|
| `VITE_FORM_ENDPOINT` | POST URL for the contact form. Unset → form runs in demo mode. |
| `VITE_CONTACT_EMAIL` | mailto address next to the form. Default `hello@zian-ai.dev`. |
| `VITE_SITE_URL` | Public origin used for canonical URLs, OG, sitemap. Default `https://zian-ai.dev`. |
| `VITE_OLLAMA_ENDPOINT` | Ollama-compatible base URL (e.g. `https://ollama.example.com`). Unset → AI demo plays from mocked replies with Ollama branding. |
| `VITE_OLLAMA_MODEL` | Model name to request (default `llama3.2:3b`). |
| `VITE_ANALYTICS_SCRIPT_URL` | URL of a privacy-friendly analytics snippet (Plausible/Umami). Triggers the cookie banner; loaded only after consent. |
| `VITE_ANALYTICS_SITE_ID` | Site/website id forwarded to the analytics snippet. |
| `VITE_ANALYTICS_DOMAIN` | Domain attribute forwarded to the analytics snippet. |

## What to customize after install

1. **Logo** — replace `public/logo.svg` with your real SVG (square viewBox recommended).
2. **OG image** — replace `public/og-image.svg`.
3. **Avatar** — gradient placeholder in `src/components/sections/About.tsx`. Drop `public/avatar.jpg` if you want a real photo.
4. **Copy** — all text lives in `src/locales/de.json` and `src/locales/en.json`.
5. **Imprint / Privacy** — fill in `src/pages/Impressum.tsx`, `src/pages/Datenschutz.tsx` and the matching `imprint.body` / `privacy.body` translation strings.
6. **Form endpoint** — set `VITE_FORM_ENDPOINT` once your Formspree/Web3Forms project exists.
7. **AI Demo** — either set `VITE_OLLAMA_ENDPOINT` to a real Ollama host or keep mock mode. Edit greetings, suggestions, and mocked replies in `locales/{de,en}.json → aiDemo`.
8. **Client logos** — replace placeholder SVGs inside `src/components/sections/ClientLogos.tsx` with real logos.
9. **Analytics** — set `VITE_ANALYTICS_*` env vars to enable cookie banner + snippet loading.
10. **SEO** — `VITE_SITE_URL` controls canonical URLs and `public/sitemap.xml` / `public/robots.txt` entries; update those when you deploy.

## File map

```
src/
├── main.tsx              # entry + i18n init
├── App.tsx               # Router + Lenis + Cursor + SEO + Consent wiring
├── lib/
│   ├── i18n.ts           # react-i18next setup
│   ├── smoothScroll.ts   # Lenis ↔ ScrollTrigger bridge
│   ├── animations.ts     # GSAP helpers (splitText, reveal, fadeUp)
│   ├── useMagnet.ts      # magnetic hover hook
│   ├── consent.ts        # localStorage-backed consent state
│   └── analytics.ts      # consent-gated analytics snippet loader
├── locales/{de,en}.json
├── styles/globals.css    # Tailwind v4 @theme + cursor + utilities
├── components/
│   ├── Layout.tsx · Header.tsx · LangToggle.tsx · TimelineRail.tsx · Footer.tsx
│   ├── Cursor.tsx              # dot + trailing ring, desktop only
│   ├── HeroParticles.tsx       # Three.js shell of dots (lazy)
│   ├── PageTransition.tsx      # fade/slide between routes
│   ├── CookieBanner.tsx        # only renders if analytics is configured
│   ├── Seo.tsx                 # per-route title / OG / hreflang / JSON-LD
│   └── sections/
│       ├── Hero.tsx            # pinned scrubbed timeline + particles
│       ├── ClientLogos.tsx     # marquee of placeholder logos
│       ├── About.tsx           # vertical timeline rail + milestones
│       ├── Process.tsx         # timeline rail extension, Build ↔ AI toggle
│       ├── Showcase.tsx        # service cards
│       ├── ShowcaseCases.tsx   # horizontal pin-scroll cases
│       ├── AiDemo.tsx          # Ollama-branded mock chat with streaming
│       └── Contact.tsx         # form (demo-mode aware) + mailto
└── pages/
    ├── Home.tsx · Impressum.tsx · Datenschutz.tsx
```

## Accessibility & Performance

- `prefers-reduced-motion`: Lenis, particles and scroll-driven timelines all bypass.
- All animations are GPU-only (`transform` / `opacity`).
- Custom cursor hidden on touch devices.
- Three.js is lazy-loaded; initial JS bundle ≈ 90 KB gzipped, three.js chunk ≈ 115 KB gzipped (loaded async after first paint).
- Form fields use floating labels with `aria-invalid` and `aria-describedby` for errors.
- Cookie banner only mounts when analytics is actually configured.
