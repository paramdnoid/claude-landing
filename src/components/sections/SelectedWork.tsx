import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/gsap';
import { splitText, revealWordsOnScroll, prefersReducedMotion } from '../../lib/animations';

// vite-imagetools generates AVIF + WebP + JPEG variants at 400/800/1200 wide
// for each source asset. `?as=picture` returns { sources, img } so we can wire
// up a `<picture>` element with progressive format negotiation.
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

// Image sizes: desktop panel ~55vw, mobile ~78vw
const THUMB_SIZES_DESKTOP = '(min-width: 1024px) 55vw, 78vw';
const THUMB_SIZES_MOBILE = '(min-width: 768px) 58vw, 78vw';

// Shared turbulence-noise overlay defined once so the same
// data URL does not ship multiple times in rendered HTML.
const NOISE_OVERLAY_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/filter%3E%3C/svg%3E\")";

export default function SelectedWork() {
  const { t, i18n } = useTranslation();

  // -- Refs ------------------------------------------------------------------
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const rowsRef = useRef<(HTMLLIElement | null)[]>([]);
  const imagePanelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);
  const endLineRef = useRef<HTMLParagraphElement>(null);
  // Track whether the first-mount initialisation has already run.
  const isMountedRef = useRef(false);

  // -- State -----------------------------------------------------------------
  // activeIdx:  scroll-driven via IntersectionObserver
  // hoverIdx:   pointer-driven
  // displayIdx: resolved index that drives the sticky image panel
  const [activeIdx, setActiveIdx] = useState(0);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const displayIdx = hoverIdx ?? activeIdx;

  // -- Data ------------------------------------------------------------------
  const cases = useMemo<Case[]>(
    () => {
      const raw = t('work.cases', { returnObjects: true }) as RawCase[];
      return raw.map((c) => ({ ...c, thumb: THUMBS[c.index] }));
    },
    // Re-build only when the locale changes, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  // -- Entry animations ------------------------------------------------------
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (!headingRef.current || !eyebrowRef.current) return;

      // 1. Eyebrow fade-up on scroll
      gsap.from(eyebrowRef.current, {
        y: 20,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: eyebrowRef.current,
          start: 'top 88%',
          once: true,
        },
      });

      // 2. Heading char stagger
      const chars = splitText(headingRef.current);
      gsap.from(chars, {
        y: 28,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
        stagger: 0.018,
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 85%',
          once: true,
        },
      });

      // 3. Project rows stagger up (desktop rows only)
      const rows = rowsRef.current.filter(Boolean) as HTMLElement[];
      if (rows.length > 0) {
        gsap.from(rows, {
          y: 36,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: {
            trigger: rows[0],
            start: 'top 82%',
            once: true,
          },
        });
      }

      // 4. End callout -- scrubbed word reveal
      if (endLineRef.current) {
        revealWordsOnScroll(endLineRef.current, { scrub: 0.8 });
      }
    },
    { scope: sectionRef, dependencies: [i18n.language] },
  );

  // -- Image-panel crossfade -------------------------------------------------
  // On first mount: fades panel 0 in from its initial opacity:0.
  // On subsequent changes: fromTo with scale settle on the entering panel.
  useEffect(() => {
    const panels = imagePanelRefs.current;
    const isMount = !isMountedRef.current;
    isMountedRef.current = true;

    if (prefersReducedMotion()) {
      panels.forEach((panel, i) => {
        if (panel) {
          gsap.set(panel, {
            opacity: i === displayIdx ? 1 : 0,
            zIndex: i === displayIdx ? 2 : 1,
          });
        }
      });
      return;
    }

    if (isMount) {
      // Initial reveal: fade first panel in gently
      if (panels[0]) gsap.to(panels[0], { opacity: 1, duration: 0.8, ease: 'power2.out' });
      return;
    }

    panels.forEach((panel, i) => {
      if (!panel) return;
      gsap.killTweensOf(panel);

      if (i === displayIdx) {
        gsap.set(panel, { zIndex: 2 });
        gsap.fromTo(
          panel,
          { opacity: 0, scale: 1.03 },
          { opacity: 1, scale: 1, duration: 0.65, ease: 'expo.out' },
        );
      } else {
        gsap.set(panel, { zIndex: 1 });
        gsap.to(panel, { opacity: 0, scale: 1, duration: 0.35, ease: 'power2.in' });
      }
    });

    // Counter flip -- slide up from below
    if (counterRef.current) {
      gsap.fromTo(
        counterRef.current,
        { yPercent: 55, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.3, ease: 'power3.out' },
      );
    }
  }, [displayIdx]);

  // -- IntersectionObserver: scroll-driven active state ----------------------
  // When a desktop project row crosses the viewport centre it becomes active.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = rowsRef.current.findIndex((r) => r === entry.target);
          if (idx >= 0) setActiveIdx(idx);
        });
      },
      { threshold: 0.5, rootMargin: '-25% 0px -30% 0px' },
    );

    const rows = rowsRef.current.filter(Boolean) as HTMLLIElement[];
    rows.forEach((row) => io.observe(row));

    return () => io.disconnect();
  }, [cases]);

  // -- Row interaction callbacks ---------------------------------------------
  const onRowEnter = useCallback((e: React.MouseEvent<HTMLLIElement>) => {
    const idx = Number(e.currentTarget.dataset.idx);
    if (!isNaN(idx)) setHoverIdx(idx);
  }, []);
  const onRowLeave = useCallback(() => setHoverIdx(null), []);

  // --------------------------------------------------------------------------
  return (
    <section
      ref={sectionRef}
      id="work"
      aria-labelledby="work-title"
      className="relative"
    >
      {/* -- Section header -------------------------------------------------- */}
      <div className="px-6 pb-14 pt-16 md:px-10 lg:pb-16">
        <div className="mx-auto max-w-400">
          {/* Eyebrow */}
          <div ref={eyebrowRef} className="mb-6 inline-flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-block h-px w-8 rounded-full bg-plasma-lime glow-lime"
            />
            <span className="tag">{t('work.eyebrow')}</span>
          </div>

          {/* Heading + intro */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
            <h2
              id="work-title"
              ref={headingRef}
              lang={i18n.language}
              className="font-display text-display-lg [hyphens:auto]"
            >
              {t('work.title')}
            </h2>
            <p className="lead hidden max-w-xs shrink-0 text-right md:block">
              {t('work.intro')}
            </p>
          </div>

          {/* Plasma gradient divider */}
          <div
            aria-hidden="true"
            className="mt-10 h-px rounded-full"
            style={{
              background:
                'linear-gradient(90deg,var(--color-plasma-lime),var(--color-plasma-cyan) 45%,var(--color-plasma-indigo) 80%,transparent)',
            }}
          />
        </div>
      </div>

      {/* -- Main content ---------------------------------------------------- */}
      <div className="px-6 md:px-10">
        <div className="mx-auto max-w-400">

          {/* Desktop two-column layout --------------------------------------- */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-x-12">

            {/* Left: project list */}
            <div className="lg:col-span-5">
              <ol aria-label={t('work.title')}>
                {cases.map((c, i) => {
                  const isActive = displayIdx === i;
                  return (
                    <li
                      key={c.index}
                      ref={(el) => { rowsRef.current[i] = el; }}
                      data-idx={String(i)}
                      aria-current={isActive ? 'true' : undefined}
                      onMouseEnter={onRowEnter}
                      onMouseLeave={onRowLeave}
                      className={`group/row relative cursor-default select-none py-10 lg:py-14 ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      {/* Left accent strip -- scaleY 0 to 1 when active */}
                      <div
                        aria-hidden="true"
                        className="absolute left-0 top-0 h-full w-0.5 origin-top rounded-full bg-plasma-lime glow-lime transition-transform duration-[400ms] ease-out"
                        style={{ transform: isActive ? 'scaleY(1)' : 'scaleY(0)' }}
                      />

                      <div className="pl-4">
                        {/* Index + year */}
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className="font-mono text-[2.5rem] font-bold leading-none tabular-nums transition-colors duration-300"
                            style={{
                              color: isActive
                                ? 'var(--color-plasma-lime)'
                                : 'rgba(255,255,255,0.1)',
                            }}
                          >
                            {c.index}
                          </span>
                          <span className="tag tabular-nums text-muted">{c.year}</span>
                        </div>

                        {/* Title */}
                        <h3
                          id={`work-item-${c.index}`}
                          className="font-display text-2xl transition-colors duration-300 lg:text-[2rem]"
                          style={{
                            color: isActive ? 'var(--color-fg)' : 'var(--color-muted-2)',
                          }}
                        >
                          {c.title}
                        </h3>

                        {/* Tag pill */}
                        <div className="mt-3">
                          <span
                            className="tag inline-block rounded-full border px-3 py-1 transition-colors duration-300"
                            style={{
                              borderColor: isActive
                                ? 'rgba(163,255,18,0.25)'
                                : 'var(--color-border-strong)',
                              color: isActive
                                ? 'rgba(163,255,18,0.85)'
                                : 'var(--color-muted)',
                            }}
                          >
                            {c.tag}
                          </span>
                        </div>

                        {/* Blurb */}
                        <p
                          className="mt-3 text-sm leading-relaxed transition-all duration-300"
                          style={{
                            color: 'var(--color-muted)',
                            opacity: isActive ? 0.9 : 0.35,
                          }}
                        >
                          {c.blurb}
                        </p>

                        {/* Case-study badge */}
                        <div
                          className="mt-4 inline-flex items-center gap-2 transition-all duration-300"
                          style={{
                            opacity: isActive ? 1 : 0,
                            transform: isActive ? 'none' : 'translateY(4px)',
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime glow-lime"
                          />
                          <span className="tag text-plasma-lime">{t('work.onRequest')}</span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Right: sticky image panel */}
            <div className="lg:col-span-7">
              <div
                className="group/panel sticky top-24 overflow-hidden rounded-2xl"
                style={{ height: 'calc(100svh - 8rem)' }}
                data-cursor="true"
                aria-hidden="true"
              >
                {/* Stacked image panels -- absolutely positioned, crossfade via GSAP */}
                {cases.map((c, i) => (
                  <div
                    key={c.index}
                    ref={(el) => { imagePanelRefs.current[i] = el; }}
                    className="absolute inset-0 opacity-0"
                  >
                    {c.thumb ? (
                      <picture>
                        {c.thumb.sources.avif && (
                          <source
                            type="image/avif"
                            srcSet={c.thumb.sources.avif}
                            sizes={THUMB_SIZES_DESKTOP}
                          />
                        )}
                        {c.thumb.sources.webp && (
                          <source
                            type="image/webp"
                            srcSet={c.thumb.sources.webp}
                            sizes={THUMB_SIZES_DESKTOP}
                          />
                        )}
                        <img
                          src={c.thumb.img.src}
                          width={c.thumb.img.w}
                          height={c.thumb.img.h}
                          alt=""
                          loading={i === 0 ? 'eager' : 'lazy'}
                          decoding="async"
                          className="h-full w-full object-cover object-top transition-transform duration-[2000ms] ease-out group-hover/panel:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/panel:scale-100"
                        />
                      </picture>
                    ) : (
                      <div className="h-full w-full bg-bg-elev-2" />
                    )}

                    {/* Rich bottom-heavy gradient for text legibility */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,7,0.94)_0%,rgba(5,5,7,0.6)_30%,rgba(5,5,7,0.15)_60%,rgba(5,5,7,0.0)_100%)]" />
                    {/* Film-grain depth layer */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
                      style={{ backgroundImage: NOISE_OVERLAY_URL }}
                    />
                  </div>
                ))}

                {/* Panel chrome -- always above images */}

                {/* Corner frame accents */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-5 top-5 z-10 h-7 w-7 border-l border-t border-white/20"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-5 right-5 z-10 h-7 w-7 border-b border-r border-white/20"
                />

                {/* Project counter -- top-right */}
                <div className="absolute right-7 top-6 z-10 flex items-baseline gap-1.5 overflow-hidden">
                  <span
                    ref={counterRef}
                    className="block font-mono text-[3.5rem] font-bold leading-none tabular-nums text-fg"
                  >
                    {String(displayIdx + 1).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-2">
                    /{String(cases.length).padStart(2, '0')}
                  </span>
                </div>

                {/* Project meta -- bottom row */}
                <div className="absolute bottom-7 left-7 right-7 z-10 flex items-end justify-between gap-4">
                  <div>
                    <div className="tag mb-2.5 text-white/55">{cases[displayIdx]?.tag}</div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5">
                      <span
                        aria-hidden="true"
                        className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime glow-lime"
                      />
                      <span className="tag text-white/65">{t('work.onRequest')}</span>
                    </div>
                  </div>
                  <span className="tag tabular-nums text-white/35">{cases[displayIdx]?.year}</span>
                </div>

                {/* Plasma bottom edge accent */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px opacity-55"
                  style={{
                    background:
                      'linear-gradient(90deg,var(--color-plasma-lime),var(--color-plasma-cyan) 60%,transparent)',
                    boxShadow: 'var(--shadow-glow-lime)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mobile stacked cards -------------------------------------------- */}
          <div className="flex flex-col gap-5 lg:hidden">
            {cases.map((c, i) => (
              <article
                key={c.index}
                aria-labelledby={`work-mobile-${c.index}`}
                className="group relative h-[72svh] overflow-hidden rounded-xl"
              >
                {c.thumb ? (
                  <picture>
                    {c.thumb.sources.avif && (
                      <source
                        type="image/avif"
                        srcSet={c.thumb.sources.avif}
                        sizes={THUMB_SIZES_MOBILE}
                      />
                    )}
                    {c.thumb.sources.webp && (
                      <source
                        type="image/webp"
                        srcSet={c.thumb.sources.webp}
                        sizes={THUMB_SIZES_MOBILE}
                      />
                    )}
                    <img
                      src={c.thumb.img.src}
                      width={c.thumb.img.w}
                      height={c.thumb.img.h}
                      alt={t('work.casePreviewAlt', { title: c.title })}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] ease-out will-change-transform group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </picture>
                ) : null}

                {/* Gradient + noise */}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,7,0.97)_0%,rgba(5,5,7,0.72)_35%,rgba(5,5,7,0.25)_65%,rgba(5,5,7,0.0)_100%)]" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
                  style={{ backgroundImage: NOISE_OVERLAY_URL }}
                />

                {/* Top: floating index + year */}
                <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                  <span
                    className="font-mono text-2xl font-bold tabular-nums"
                    style={{ color: 'rgba(163,255,18,0.7)' }}
                  >
                    {c.index}
                  </span>
                  <span className="tag tabular-nums text-white/45">{c.year}</span>
                </div>

                {/* Bottom text */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="tag mb-2 text-white/55">{c.tag}</div>
                  <h3
                    id={`work-mobile-${c.index}`}
                    className="font-display text-3xl text-white"
                  >
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{c.blurb}</p>
                  <div className="mt-3 inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime"
                    />
                    <span className="tag text-white/60">{t('work.onRequest')}</span>
                  </div>
                </div>

                {/* Plasma bottom line */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-px opacity-50"
                  style={{
                    background:
                      'linear-gradient(90deg,var(--color-plasma-lime),var(--color-plasma-cyan) 60%,transparent)',
                  }}
                />
              </article>
            ))}
          </div>

        </div>
      </div>

      {/* -- End callout ------------------------------------------------------ */}
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
