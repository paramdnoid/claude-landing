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
  thumb?: Picture;
};

const THUMBS: Record<string, Picture> = {
  '01': personalengelPic,
  '02': supriumPic,
  '03': fieconPic,
  '04': lastizunPic,
  '05': nanasPic,
};

// On desktop the screenshot frame occupies ~58% of a 64svw card (≈37vw); on
// tablet the card is 58vw wide; on mobile 78vw. The sizes attribute mirrors that
// so the browser picks the smallest variant that fits.
const THUMB_SIZES = '(min-width: 1024px) 30vw, (min-width: 768px) 56vw, 80vw';

// Decorative browser-chrome domain pill, derived from the case title. Purely
// cosmetic (and aria-hidden), so it carries no locale-sensitive copy and needs
// no i18n key.
const domainFor = (title: string): string =>
  `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

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
      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={t('work.title')}
        tabIndex={0}
        onKeyDown={onCarouselKeyDown}
        className="relative flex h-[100svh] flex-col select-none overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--color-plasma-lime)]"
      >
        {/* Section header — lives inside the pinned viewport so it stays visible
            for the whole horizontal scroll instead of scrolling away above it. */}
        <div className="flex-shrink-0 px-6 pb-6 pt-16 md:px-10 md:pt-20">
          <div className="mx-auto max-w-400">
            <div className="tag mb-3">{t('work.eyebrow')}</div>
            <h2 id="work-title" className="font-display text-display-md lg:text-display-lg">{t('work.title')}</h2>
            <p className="lead mt-4 hidden max-w-xl md:block">{t('work.intro')}</p>
          </div>
        </div>

        <span className="sr-only">{t('work.carouselKeyboardHint')}</span>
        <div ref={trackRef} className="flex flex-1 items-center gap-6 px-6 will-change-transform md:gap-10 md:px-10">
          {cases.map((c, i) => (
            <article
              key={c.index}
              aria-labelledby={`work-card-${c.index}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${cases.length}: ${c.title}`}
              className="group relative flex w-[80svw] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-bg-elev shadow-[var(--shadow-e4)] md:w-[56svw] lg:h-[50svh] lg:w-[52svw] lg:flex-row xl:w-[44svw]"
            >
              {/* Faint plasma radial — static, CSS-only, identical per card. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px opacity-60 [background:radial-gradient(120%_80%_at_30%_0%,rgba(163,255,18,0.10),transparent_55%)]"
              />

              {/* Left — bright browser frame with the screenshot fully visible.
                  On lg the frame stretches to the full card height so there is
                  no dead band below it. */}
              <div className="relative z-10 flex-shrink-0 p-4 md:p-5 lg:flex lg:basis-[58%] lg:p-6">
                <div className="flex w-full flex-col overflow-hidden rounded-md border border-border-strong bg-bg-elev-2 shadow-[var(--shadow-e3)]">
                  {/* Refined chrome bar — no traffic-light dots. */}
                  <div className="flex h-9 items-center gap-2 border-b border-border bg-bg-elev/80 px-3 backdrop-blur-sm">
                    <span aria-hidden="true" className="font-mono text-[0.6rem] text-muted-2">▸</span>
                    <span
                      aria-hidden="true"
                      className="rounded-full border border-border bg-white/[0.03] px-2 py-0.5 font-mono text-[0.65rem] tracking-tight text-muted-2"
                    >
                      {domainFor(c.title)}
                    </span>
                    <span aria-hidden="true" className="tag tabular-nums !text-muted-2 ml-auto">{c.year}</span>
                  </div>

                  <div className="relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:flex-1">
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
                          className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                      </picture>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right — editorial metadata on the dark canvas. */}
              <div className="relative z-10 flex flex-1 flex-col justify-center gap-3 px-6 pb-7 lg:basis-[42%] lg:px-7 lg:py-8">
                <span
                  aria-hidden="true"
                  className="font-display text-display-lg leading-none tabular-nums text-white/[0.07]"
                >
                  {c.index}
                </span>
                <h3
                  id={`work-card-${c.index}`}
                  className="font-display text-3xl text-fg md:text-4xl lg:text-display-md"
                >
                  {c.title}
                </h3>
                <div className="tag !text-plasma-lime">{c.tag}</div>
                <p className="lead max-w-sm !text-base text-muted">{c.blurb}</p>
                <a
                  href="#contact"
                  className="tag mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-border-strong px-3 py-1.5 text-muted-2 transition-colors duration-[var(--dur-base)] hover:border-plasma-lime hover:!text-plasma-lime focus-visible:!text-plasma-lime"
                >
                  {t('work.onRequest')} <span aria-hidden="true">→</span>
                </a>
              </div>
            </article>
          ))}

          <div className="flex w-[60svw] flex-shrink-0 flex-col justify-center gap-4 pr-10 lg:h-[50svh] lg:w-[36svw]">
            <div className="tag !text-plasma-lime">{t('work.endTag')}</div>
            <p className="font-display text-display-md text-fg">{t('work.endLine')}</p>
            <a
              href="#contact"
              className="tag inline-flex w-fit items-center gap-2 rounded-full border border-border-strong px-3 py-1.5 text-muted-2 transition-colors duration-[var(--dur-base)] hover:border-plasma-lime hover:!text-plasma-lime focus-visible:!text-plasma-lime"
            >
              {t('work.onRequest')} <span aria-hidden="true">→</span>
            </a>
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
