# ZIAN AI CONCEPTS — Landing Page

Animated single-page landing for **ZIAN AI CONCEPTS** (André Zimmermann). Tech-noir design, scroll-triggered timeline choreography, bilingual DE/EN.

## Stack

- **Vite 6** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first `@theme` config)
- **GSAP 3** + **ScrollTrigger** (pinned scrubbed timelines, horizontal pin scroll)
- **Lenis** (smooth scroll bridged into ScrollTrigger)
- **react-i18next** (DE default, EN toggle, persisted in localStorage)
- **lucide-react** icons, **Geist** + **Geist Mono** via `@fontsource-variable`

## Quick start

```bash
npm install
cp .env.example .env   # optional, only needed for real form submissions
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
| `VITE_FORM_ENDPOINT` | POST URL for the contact form (Formspree, Web3Forms, EmailJS, custom). If unset, the form runs in **demo mode** (no real submission, success state shown for UX). |
| `VITE_CONTACT_EMAIL` | mailto address shown next to the form. Defaults to `hello@zian-ai.dev`. |

## What to customize after install

1. **Logo** — replace `public/logo.svg` with your real SVG (square viewBox recommended).
2. **OG image** — replace `public/og-image.svg`.
3. **Avatar** — currently a gradient placeholder in the About section (`src/components/sections/About.tsx`). Drop a `public/avatar.jpg` and swap the placeholder div if desired.
4. **Copy** — all text lives in `src/locales/de.json` and `src/locales/en.json`.
5. **Imprint / Privacy** — fill in `src/pages/Impressum.tsx` and `src/pages/Datenschutz.tsx` (and the corresponding `imprint.body` / `privacy.body` strings).
6. **Form endpoint** — set `VITE_FORM_ENDPOINT` once you've created your Formspree/Web3Forms project.

## File map

```
src/
├── main.tsx              # entry + i18n init
├── App.tsx               # Router + Lenis lifecycle
├── lib/
│   ├── i18n.ts           # react-i18next setup
│   ├── smoothScroll.ts   # Lenis ↔ ScrollTrigger bridge
│   └── animations.ts     # GSAP helpers (splitText, reveal, fadeUp)
├── locales/{de,en}.json
├── styles/globals.css    # Tailwind v4 @theme + utilities
├── components/
│   ├── Header.tsx · LangToggle.tsx · TimelineRail.tsx · Footer.tsx · Layout.tsx
│   └── sections/
│       ├── Hero.tsx              # pinned scrubbed timeline
│       ├── About.tsx             # vertical timeline rail + milestones
│       ├── Showcase.tsx          # service cards
│       ├── ShowcaseCases.tsx     # horizontal pin-scroll cases
│       └── Contact.tsx           # form (demo-mode aware) + mailto
└── pages/
    ├── Home.tsx · Impressum.tsx · Datenschutz.tsx
```

## Accessibility

- `prefers-reduced-motion`: Lenis is skipped, GSAP scroll timelines are bypassed, content shows statically.
- All animations are GPU-only (`transform` / `opacity`).
- Form fields use floating labels with `aria-invalid` and `aria-describedby` for errors.
- Focus rings are visible (cyan glow).
