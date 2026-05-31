import { useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '../../lib/gsap';
import { splitText, prefersReducedMotion } from '../../lib/animations';
import { scrollToSection } from '../../lib/scrollToSection';
import { useMagnet } from '../../lib/useMagnet';
import WebGLErrorBoundary from '../webgl/WebGLErrorBoundary';
import StaticGradientFallback from '../webgl/StaticGradientFallback';

const LiquidGradientMesh = lazy(() => import('../webgl/LiquidGradientMesh'));

export default function Hero() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);
  // Content block for scroll-parallax — translated upward slightly as user scrolls
  const contentRef = useRef<HTMLDivElement>(null);
  // Magnetic primary CTAs (fine-pointer + motion-safe; the hook no-ops otherwise)
  const workCtaRef = useMagnet<HTMLAnchorElement>(0.4);
  const contactCtaRef = useMagnet<HTMLAnchorElement>(0.4);

  useGSAP(() => {
    if (!headlineRef.current) return;
    const rm = prefersReducedMotion();

    // --- intro timeline (unchanged) ---
    if (!rm) {
      const chars = splitText(headlineRef.current);
      const tl = gsap.timeline();
      tl.from(eyebrowRef.current, { y: 20, opacity: 0, duration: 0.7, ease: 'power3.out' })
        .from(chars, { y: 28, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.018 }, '-=0.45')
        .from(subRef.current, { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.55')
        .from(ctaRef.current?.children ?? [], { y: 16, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08 }, '-=0.4')
        .from(metaRef.current?.children ?? [], { y: 14, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, '-=0.4');
    }

    // --- scroll-linked parallax on the content block ---
    // Translates content upward by ~60px as hero scrolls out — pure transform, no layout shift.
    if (!rm && contentRef.current && sectionRef.current) {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.2,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (contentRef.current) {
            gsap.set(contentRef.current, {
              y: self.progress * -60,
              force3D: true,
            });
          }
        },
      });
      return () => st.kill();
    }
  }, { scope: sectionRef, dependencies: [] });

  const onCta = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToSection(id);
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-svh w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <WebGLErrorBoundary fallback={<StaticGradientFallback />}>
          <Suspense fallback={<div className="absolute inset-0 bg-bg" />}>
            <LiquidGradientMesh scrollTriggerId="hero" />
          </Suspense>
        </WebGLErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_60%,rgba(5,5,7,0.25)_0%,rgba(5,5,7,0.65)_70%,rgba(5,5,7,0.92)_100%)]" />
      {/* Extra flat scrim on mobile only: text spans the full hero height where
          the WebGL gradient is brightest, so the radial alone can dip below the
          4.5:1 contrast floor on small screens. Desktop keeps the vibrant look. */}
      <div className="pointer-events-none absolute inset-0 bg-bg/35 md:hidden" />

      <div
        ref={contentRef}
        className="relative z-10 flex min-h-svh flex-col justify-between gap-10 px-6 pb-14 pt-24 md:gap-12 md:px-10 md:pb-16 md:pt-32"
      >
        <div ref={eyebrowRef} className="glass glass-pill tag inline-flex w-fit max-w-full items-start gap-2.5 leading-snug md:items-center md:gap-3">
          <span className="mt-[0.3rem] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-plasma-lime glow-lime md:mt-0" />
          <span className="text-[0.62rem] tracking-[0.12em] md:text-[0.7rem] md:tracking-[0.18em]">{t('hero.eyebrow')}</span>
        </div>

        <div className="max-w-400">
          <h1
            ref={headlineRef}
            lang={i18n.language}
            className="font-display text-display-lg md:text-display-xl text-fg [hyphens:auto]"
          >
            {t('hero.headline')}
          </h1>
          <p ref={subRef} className="lead mt-6 max-w-2xl md:mt-8">
            {t('hero.sub')}
          </p>
          <div ref={ctaRef} className="mt-8 flex flex-wrap items-center gap-3 md:mt-10 md:gap-4">
            <a
              ref={workCtaRef}
              href="#work"
              onClick={onCta('work')}
              className="group/cta inline-flex items-center gap-3 rounded-full bg-plasma-lime px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-bg transition-shadow duration-300 hover:shadow-glow-lime md:px-8 md:py-4 md:text-sm md:tracking-[0.2em]"
            >
              <span>{t('hero.ctaWork')}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5">
                <path d="M1 13L13 1M13 1H3M13 1v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </a>
            <a
              ref={contactCtaRef}
              href="#contact"
              onClick={onCta('contact')}
              className="inline-flex items-center gap-3 rounded-full border border-border-strong px-6 py-3 font-mono text-xs uppercase tracking-[0.18em] text-fg transition-colors duration-300 hover:border-plasma-lime hover:text-plasma-lime md:px-8 md:py-4 md:text-sm md:tracking-[0.2em]"
            >
              {t('hero.ctaContact')}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:gap-6">
          <div ref={metaRef} className="flex flex-wrap items-end gap-3">
            <div className="glass glass-pill tag">{t('hero.metaRole')}</div>
            <div className="glass glass-pill tag">{t('hero.metaLocation')}</div>
          </div>
          <div className="flex justify-center">
            <div className="tag inline-flex items-center gap-2 text-muted">
              <span>{t('hero.scroll')}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="animate-[scroll-float_2s_ease-in-out_infinite]">
                <path d="M7 1v12m0 0L1 7m6 6l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
