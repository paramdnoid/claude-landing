import { useEffect, useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { horizontalScroll, prefersReducedMotion } from '../../lib/animations';
import { ScrollTrigger } from '../../lib/gsap';
import { getLenis } from '../../lib/smoothScroll';
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
  palette: [string, string];
  thumb?: Picture;
};

const PALETTES: Record<string, [string, string]> = {
  '01': ['#c0392b', '#e74c3c'],
  '02': ['#1a0f06', '#c8860a'],
  '03': ['#d4c4a8', '#9b7a52'],
  '04': ['#1a2e1a', '#2d6a2d'],
  '05': ['#2d1b69', '#8b5cf6'],
};

const THUMBS: Record<string, Picture> = {
  '01': personalengelPic,
  '02': supriumPic,
  '03': fieconPic,
  '04': lastizunPic,
  '05': nanasPic,
};

// Cards render at 78svw (mobile), 58svw (tablet), 44svw (desktop). The sizes
// attribute mirrors that so the browser picks the smallest variant that fits.
const THUMB_SIZES = '(min-width: 1024px) 44vw, (min-width: 768px) 58vw, 78vw';

const FALLBACK_PALETTE: [string, string] = ['#6366f1', '#a3ff12'];

// Shared turbulence-noise overlay for case cards — defined once so the same
// data URL doesn't ship five times in the rendered HTML.
const NOISE_OVERLAY_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/filter%3E%3C/svg%3E\")";

export default function SelectedWork() {
  const { t, i18n } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Stabilise on `i18n.language` rather than the re-allocated `rawCases`
  // reference so the horizontalScroll trigger isn't killed and recreated on
  // every parent render — only when the user actually switches locale.
  const cases = useMemo<Case[]>(
    () => {
      const raw = t('work.cases', { returnObjects: true }) as RawCase[];
      return raw.map((c) => ({
        ...c,
        palette: PALETTES[c.index] ?? FALLBACK_PALETTE,
        thumb: THUMBS[c.index],
      }));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );

  useLayoutEffect(() => {
    if (viewportRef.current === null || trackRef.current === null) return;
    const st = horizontalScroll(viewportRef.current, trackRef.current, {
      snap: true,
      // Slightly tighter than the default so a pointer drag (below) tracks the
      // finger closely instead of lagging a full second behind.
      scrub: 0.6,
      onUpdate: (p) => {
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      },
    });

    const imgs = viewportRef.current.querySelectorAll('img');
    if (imgs.length > 0) {
      const promises = Array.from(imgs).map((img) => img.decode().catch(() => {}));
      void Promise.all(promises).then(() => ScrollTrigger.refresh());
    }

    return () => {
      st?.kill();
    };
  }, [cases]);

  // Pointer drag → page scroll. The ScrollTrigger pin owns the track's `x`, so we
  // never write `x` directly; instead a horizontal drag drives the scroll position
  // (which the pin maps 1:1 back to horizontal travel). Fine pointers only — touch
  // keeps native vertical scroll, and reduced-motion opts out entirely.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (prefersReducedMotion()) return;

    let dragging = false;
    let lastX = 0;
    let velocity = 0;

    const scrollBy = (delta: number, immediate: boolean) => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(window.scrollY + delta, immediate ? { immediate: true } : { duration: 0.8 });
      } else {
        window.scrollBy({ top: delta, behavior: immediate ? 'auto' : 'smooth' });
      }
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const el = e.target as Element | null;
      if (el?.closest('a, button, input, textarea')) return;
      dragging = true;
      lastX = e.clientX;
      velocity = 0;
      vp.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      velocity = velocity * 0.8 + -dx * 0.2;
      scrollBy(-dx, true);
    };
    const endDrag = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      try {
        vp.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
      const momentum = velocity * 14;
      if (Math.abs(momentum) > 6) scrollBy(momentum, false);
    };

    vp.addEventListener('pointerdown', onDown);
    vp.addEventListener('pointermove', onMove);
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);
    return () => {
      vp.removeEventListener('pointerdown', onDown);
      vp.removeEventListener('pointermove', onMove);
      vp.removeEventListener('pointerup', endDrag);
      vp.removeEventListener('pointercancel', endDrag);
    };
  }, []);

  const onCarouselKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const step = viewport.clientHeight;
    const lenis = getLenis();
    const scrollBy = (delta: number) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(window.scrollY + delta, { duration: 0.6 });
      else window.scrollBy({ top: delta, behavior: 'smooth' });
    };
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
        scrollBy(step);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        scrollBy(-step);
        break;
      case 'Home': {
        e.preventDefault();
        const target = viewport.getBoundingClientRect().top + window.scrollY;
        if (lenis) lenis.scrollTo(target, { duration: 0.6 });
        else window.scrollTo({ top: target, behavior: 'smooth' });
        break;
      }
      case 'End': {
        e.preventDefault();
        const target = viewport.getBoundingClientRect().top + window.scrollY + step * (cases.length - 1);
        if (lenis) lenis.scrollTo(target, { duration: 0.6 });
        else window.scrollTo({ top: target, behavior: 'smooth' });
        break;
      }
    }
  };

  return (
    <section id="work" aria-labelledby="work-title" className="relative">
      <div className="px-6 pb-12 pt-16 md:px-10">
        <div className="mx-auto flex max-w-400 items-end justify-between gap-8">
          <div>
            <div className="tag mb-4">{t('work.eyebrow')}</div>
            <h2 id="work-title" className="font-display text-display-lg">{t('work.title')}</h2>
          </div>
          <p className="lead hidden max-w-sm md:block">{t('work.intro')}</p>
        </div>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('work.title')}
        tabIndex={0}
        onKeyDown={onCarouselKeyDown}
        data-cursor-label={t('work.dragLabel')}
        className="relative h-[100svh] select-none overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--color-plasma-lime)]"
      >
        <span className="sr-only">{t('work.carouselKeyboardHint')}</span>
        <div ref={trackRef} className="flex h-full items-center gap-6 px-6 will-change-transform md:gap-10 md:px-10">
          {cases.map((c, i) => {
            const cardStyle = {
              background: `linear-gradient(135deg, ${c.palette[0]} 0%, ${c.palette[1]} 100%)`,
            };

            const contentInner = (
              <>
                {c.thumb ? (
                  <picture>
                    {c.thumb.sources.avif && (
                      <source type="image/avif" srcSet={c.thumb.sources.avif} sizes={THUMB_SIZES} />
                    )}
                    {c.thumb.sources.webp && (
                      <source type="image/webp" srcSet={c.thumb.sources.webp} sizes={THUMB_SIZES} />
                    )}
                    <img
                      src={c.thumb.img.src}
                      width={c.thumb.img.w}
                      height={c.thumb.img.h}
                      alt={t('work.casePreviewAlt', { title: c.title })}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1200ms] ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                  </picture>
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,7,0.95)_0%,rgba(5,5,7,0.85)_30%,rgba(5,5,7,0.45)_60%,rgba(5,5,7,0.05)_100%)]" />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 mix-blend-overlay opacity-20"
                  style={{ backgroundImage: NOISE_OVERLAY_URL }}
                />
                <div className="relative flex h-full flex-col justify-end p-8 md:p-12">
                  <div>
                    <div className="tag !text-white/80 mb-3">{c.tag}</div>
                    <h3 id={`work-card-${c.index}`} className="font-display text-4xl text-white md:text-6xl">{c.title}</h3>
                    <p className="mt-2 text-sm text-white/90 md:text-base">{c.blurb}</p>
                    <div className="tag !text-white/60 border border-white/15 mt-3 inline-block rounded-full px-3 py-1">
                      {t("work.onRequest")}
                    </div>
                  </div>
                </div>
              </>
            );

            return (
              <article
                key={c.index}
                aria-labelledby={`work-card-${c.index}`}
                aria-roledescription="slide"
                aria-label={`${i + 1} / ${cases.length}: ${c.title}`}
                className="group flex flex-col relative h-[72svh] w-[78svw] flex-shrink-0 overflow-hidden rounded-xl md:w-[58svw] lg:w-[44svw]"
              >
                {/* Browser chrome titlebar */}
                <div className="relative z-10 flex h-10 flex-shrink-0 items-center border-b border-white/[0.08] bg-bg-elev/85 px-4 backdrop-blur-sm">
                  <div className="flex items-center gap-[6px]" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="tag !text-white/60">{c.title}</span>
                  </div>
                  <span aria-hidden="true" className="tag tabular-nums !text-white/50 ml-auto">{c.year}</span>
                </div>

                {/* Content area */}
                <div className="relative flex-1 overflow-hidden" style={cardStyle}>
                  {contentInner}
                </div>
              </article>
            );
          })}
          <div className="flex h-[72svh] w-[60svw] flex-shrink-0 flex-col justify-center pr-10">
            <div className="tag mb-3">{t('work.endTag')}</div>
            <p className="font-display text-3xl md:text-5xl">{t('work.endLine')}</p>
          </div>
        </div>

        {/* Horizontal-journey progress — scaleX driven directly from ScrollTrigger
            (no React state churn per frame). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 bottom-6 h-px bg-border-strong md:inset-x-10"
        >
          <div
            ref={progressRef}
            className="h-full origin-left bg-plasma-lime glow-lime"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </section>
  );
}
