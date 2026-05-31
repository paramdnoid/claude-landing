import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { splitText, revealWordsOnScroll, prefersReducedMotion } from '../../lib/animations';
import { getLenis } from '../../lib/smoothScroll';

import personalengelPic from '../../assets/work/personalengel.jpg?as=picture&w=400;800;1200&format=avif;webp;jpg';
import supriumPic from '../../assets/work/suprium.png?as=picture&w=400;800;1200&format=avif;webp;png';
import fieconPic from '../../assets/work/fiecon.png?as=picture&w=400;800;1200&format=avif;webp;png';
import lastizunPic from '../../assets/work/lastizun.jpg?as=picture&w=400;800;1200&format=avif;webp;jpg';
import nanasPic from '../../assets/work/nanas.png?as=picture&w=400;800;1200&format=avif;webp;png';

type Picture = {
  sources: Record<string, string>;
  img: { src: string; w: number; h: number };
};

type RawCase = {
  index: string;
  title: string;
  tag: string;
  year: string;
  blurb: string;
};

type Case = RawCase & {
  thumb?: Picture;
};

const THUMBS: Record<string, Picture> = {
  '01': personalengelPic,
  '02': supriumPic,
  '03': fieconPic,
  '04': lastizunPic,
  '05': nanasPic,
};

// Shared turbulence-noise overlay — defined once so the same data URL
// does not ship multiple times in rendered HTML.
const NOISE_OVERLAY_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/filter%3E%3C/svg%3E\")";

export default function SelectedWork() {
  const { t, i18n } = useTranslation();

  // -- Refs --
  const sectionRef   = useRef<HTMLElement>(null);
  const eyebrowRef   = useRef<HTMLDivElement>(null);
  const headingRef   = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRefs    = useRef<(HTMLDivElement | null)[]>([]);
  const endLineRef   = useRef<HTMLParagraphElement>(null);

  // Which panel is currently in view (driven by ScrollTrigger onUpdate)
  const [activePanel, setActivePanel] = useState(0);

  // -- Data --
  const cases = useMemo<Case[]>(
    () => {
      const raw = t('work.cases', { returnObjects: true }) as RawCase[];
      return raw.map((c) => ({ ...c, thumb: THUMBS[c.index] }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  // -- Header entry animations (eyebrow + heading char stagger) --
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (!headingRef.current || !eyebrowRef.current) return;

      gsap.from(eyebrowRef.current, {
        y: 20, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: eyebrowRef.current, start: 'top 88%', once: true },
      });

      const chars = splitText(headingRef.current);
      gsap.from(chars, {
        y: 28, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.018,
        scrollTrigger: { trigger: headingRef.current, start: 'top 85%', once: true },
      });

      if (endLineRef.current) {
        revealWordsOnScroll(endLineRef.current, { scrub: 0.8 });
      }
    },
    { scope: sectionRef, dependencies: [] },
  );

  // -- Scroll-driven panel stack --
  // Each panel (yPercent: 100) slides up to cover the previous one (yPercent: 0).
  // ScrollTrigger pins the container and provides scrubbing + snap between panels.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const panels = panelRefs.current.filter(Boolean) as HTMLDivElement[];
    if (panels.length < 2) return;

    const n = panels.length;

    if (prefersReducedMotion()) {
      panels.forEach((p, i) => { gsap.set(p, { yPercent: i === 0 ? 0 : 100 }); });
      return;
    }

    // Initial state: first panel visible, rest stacked below
    panels.forEach((p, i) => { gsap.set(p, { yPercent: i === 0 ? 0 : 100 }); });

    // One timeline slot per transition (panel i starts at time i-1)
    const tl = gsap.timeline();
    panels.slice(1).forEach((panel, offset) => {
      tl.to(panel, { yPercent: 0, duration: 1, ease: 'power2.inOut' }, offset);
    });

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: () => `+=${(n - 1) * window.innerHeight}`,
      pin: true,
      scrub: 1,
      animation: tl,
      snap: {
        snapTo: 1 / (n - 1),
        duration: { min: 0.2, max: 0.55 },
        ease: 'power2.inOut',
        delay: 0.05,
      },
      onUpdate: (self) => {
        const idx = Math.round(self.progress * (n - 1));
        setActivePanel((prev) => (prev === idx ? prev : idx));
      },
      invalidateOnRefresh: true,
      refreshPriority: 1,
    });

    // Refresh once images decode so pin-spacer height is accurate
    const imgs = container.querySelectorAll('img');
    if (imgs.length > 0) {
      void Promise.all(Array.from(imgs).map((img) => img.decode().catch(() => {})))
        .then(() => ScrollTrigger.refresh());
    }

    return () => {
      st.kill();
      panels.forEach((p) => { gsap.set(p, { clearProps: 'transform,yPercent' }); });
    };
  }, [cases]);

  // -- Jump to a specific panel via Lenis (smooth) or native fallback --
  const scrollToPanel = useCallback(
    (idx: number) => {
      const container = containerRef.current;
      if (!container) return;
      const top =
        container.getBoundingClientRect().top + window.scrollY + idx * window.innerHeight;
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(top, { duration: 0.8 });
      else window.scrollTo({ top, behavior: 'smooth' });
    },
    [],
  );

  // --------------------------------------------------------------------------
  return (
    <section
      ref={sectionRef}
      id="work"
      aria-labelledby="work-title"
      className="relative"
    >
      {/* -- Section header -------------------------------------------------- */}
      <div className="px-6 pb-12 pt-24 md:px-10 lg:pt-32">
        <div className="mx-auto max-w-400">
          <div ref={eyebrowRef} className="mb-6 inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-px w-8 rounded-full bg-plasma-lime glow-lime"
            />
            <span className="tag">{t('work.eyebrow')}</span>
          </div>
          <h2
            id="work-title"
            ref={headingRef}
            lang={i18n.language}
            className="font-display text-display-lg [hyphens:auto]"
          >
            {t('work.title')}
          </h2>
        </div>
      </div>

      {/* -- Pinned panel stack ---------------------------------------------- */}
      <div
        ref={containerRef}
        className="relative h-svh overflow-hidden"
        role="region"
        aria-roledescription="carousel"
        aria-label={t('work.title')}
        tabIndex={0}
        data-cursor-label={t('work.dragLabel')}
      >
        <span className="sr-only">{t('work.carouselKeyboardHint')}</span>

        {cases.map((c, i) => (
          <div
            key={c.index}
            ref={(el) => { panelRefs.current[i] = el; }}
            className="absolute inset-0 overflow-hidden"
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${cases.length}: ${c.title}`}
            aria-hidden={activePanel !== i ? true : undefined}
          >
            {/* Full-bleed background image */}
            {c.thumb ? (
              <picture>
                {c.thumb.sources.avif && (
                  <source type="image/avif" srcSet={c.thumb.sources.avif} sizes="100vw" />
                )}
                {c.thumb.sources.webp && (
                  <source type="image/webp" srcSet={c.thumb.sources.webp} sizes="100vw" />
                )}
                <img
                  src={c.thumb.img.src}
                  width={c.thumb.img.w}
                  height={c.thumb.img.h}
                  alt=""
                  loading={i === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              </picture>
            ) : (
              <div className="absolute inset-0 bg-bg-elev-2" />
            )}

            {/* Heavy bottom gradient — ensures white-on-image legibility */}
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,7,0.97)_0%,rgba(5,5,7,0.82)_30%,rgba(5,5,7,0.45)_55%,rgba(5,5,7,0.1)_75%,rgba(5,5,7,0.0)_100%)]" />
            {/* Subtle top vignette for eyebrow readability */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,5,7,0.65)_0%,transparent_22%)]" />
            {/* Film-grain depth */}
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
              style={{ backgroundImage: NOISE_OVERLAY_URL }}
            />

            {/* Panel content */}
            <div className="relative z-10 flex h-full flex-col justify-between p-8 md:p-12 lg:p-16">

              {/* Top: section label + decorative index */}
              <div className="flex items-start justify-between">
                <span className="tag text-white/40">{t('work.eyebrow')}</span>
                <span
                  aria-hidden="true"
                  className="select-none font-mono font-bold leading-none tabular-nums text-[6rem] lg:text-[9rem]"
                  style={{ color: 'rgba(163,255,18,0.06)' }}
                >
                  {c.index}
                </span>
              </div>

              {/* Bottom: project identity */}
              <div>
                {/* Tech stack pills */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {c.tag.split(' · ').map((tag) => (
                    <span key={tag} className="glass glass-pill tag">{tag}</span>
                  ))}
                </div>

                {/* Project title */}
                <h3
                  id={`work-panel-${c.index}`}
                  className="font-display text-display-xl text-white"
                  style={{ lineHeight: '0.91' }}
                >
                  {c.title}
                </h3>

                {/* Description */}
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
                  {c.blurb}
                </p>

                {/* Footer: case-study badge + year */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime glow-lime"
                    />
                    <span className="tag text-white/60">{t('work.onRequest')}</span>
                  </div>
                  <span className="font-mono text-sm tabular-nums text-white/30">{c.year}</span>
                </div>
              </div>
            </div>

            {/* Plasma bottom accent line */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 z-10 h-px"
              style={{
                background:
                  'linear-gradient(90deg,var(--color-plasma-lime),var(--color-plasma-cyan) 60%,transparent)',
                boxShadow: 'var(--shadow-glow-lime)',
                opacity: 0.55,
              }}
            />
          </div>
        ))}

        {/* -- Progress indicator: vertical pills on right edge --------------- */}
        <nav
          aria-label="Projekt-Navigation"
          className="absolute right-5 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-3 lg:right-8"
        >
          {cases.map((c, i) => (
            <button
              key={c.index}
              type="button"
              onClick={() => scrollToPanel(i)}
              aria-label={`Projekt ${i + 1}: ${c.title}`}
              aria-current={activePanel === i ? 'true' : undefined}
              className="w-1.5 origin-center rounded-full transition-all duration-[400ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-plasma-lime"
              style={{
                height: activePanel === i ? '2rem' : '0.4rem',
                backgroundColor:
                  activePanel === i
                    ? 'var(--color-plasma-lime)'
                    : 'rgba(255,255,255,0.25)',
                boxShadow: activePanel === i ? 'var(--shadow-glow-lime)' : 'none',
              }}
            />
          ))}
        </nav>

        {/* -- Panel counter: bottom-center ----------------------------------- */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-10 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tabular-nums text-white/70">
              {String(activePanel + 1).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs tabular-nums text-white/30">
              {`/${String(cases.length).padStart(2, '0')}`}
            </span>
          </div>
        </div>
      </div>

      {/* -- End callout ----------------------------------------------------- */}
      <div className="px-6 pb-16 pt-14 md:px-10 lg:pb-24 lg:pt-20">
        <div className="mx-auto max-w-400">
          <div
            aria-hidden="true"
            className="mb-10 h-px rounded-full"
            style={{
              background:
                'linear-gradient(90deg,transparent,var(--color-plasma-indigo) 20%,var(--color-plasma-cyan) 60%,transparent)',
            }}
          />
          <div className="tag mb-4 text-muted">{t('work.endTag')}</div>
          <p
            ref={endLineRef}
            className="font-display text-display-md text-muted-2"
          >
            {t('work.endLine')}
          </p>
        </div>
      </div>
    </section>
  );
}
