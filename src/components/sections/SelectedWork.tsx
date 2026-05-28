import { useLayoutEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { horizontalScroll } from '../../lib/animations';
import { ScrollTrigger } from '../../lib/gsap';
import { getLenis } from '../../lib/smoothScroll';

type RawCase = {
  index: string;
  title: string;
  tag: string;
  year: string;
  blurb: string;
};

type Case = RawCase & {
  palette: [string, string];
  thumb?: string;
};

const PALETTES: Record<string, [string, string]> = {
  '01': ['#c0392b', '#e74c3c'],
  '02': ['#1a0f06', '#c8860a'],
  '03': ['#d4c4a8', '#9b7a52'],
  '04': ['#1a2e1a', '#2d6a2d'],
  '05': ['#2d1b69', '#8b5cf6'],
};

const THUMBS: Record<string, string> = {
  '01': '/work/personalengel.jpg',
  '02': '/work/suprium.png',
  '03': '/work/fiecon.png',
  '04': '/work/lastizun.jpg',
  '05': '/work/nanas.png',
};

const FALLBACK_PALETTE: [string, string] = ['#6366f1', '#a3ff12'];

// Shared turbulence-noise overlay for case cards — defined once so the same
// data URL doesn't ship five times in the rendered HTML.
const NOISE_OVERLAY_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/filter%3E%3C/svg%3E\")";

export default function SelectedWork() {
  const { t, i18n } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

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
    const st = horizontalScroll(viewportRef.current, trackRef.current, { snap: true });

    const imgs = viewportRef.current.querySelectorAll('img');
    if (imgs.length > 0) {
      const promises = Array.from(imgs).map((img) => img.decode().catch(() => {}));
      void Promise.all(promises).then(() => ScrollTrigger.refresh());
    }

    return () => {
      st?.kill();
    };
  }, [cases]);

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
        className="relative h-[100svh] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--color-plasma-lime)]"
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
                  <img
                    src={c.thumb}
                    alt={t('work.casePreviewAlt', { title: c.title })}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
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
                className="flex flex-col relative h-[72svh] w-[78svw] flex-shrink-0 overflow-hidden rounded-[28px] md:w-[58svw] lg:w-[44svw]"
              >
                {/* Browser chrome titlebar */}
                <div className="relative z-10 flex h-10 flex-shrink-0 items-center border-b border-white/[0.08] bg-[#0d0d0f]/85 px-4 backdrop-blur-sm">
                  <div className="flex items-center gap-[6px]" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="tag !text-white/60">{c.title}</span>
                  </div>
                  <span aria-hidden="true" className="tag !text-white/50 ml-auto">{c.year}</span>
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
      </div>
    </section>
  );
}
