import { useRef, Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/gsap';
import { splitText, prefersReducedMotion } from '../../lib/animations';
import WebGLErrorBoundary from '../webgl/WebGLErrorBoundary';
import StaticGradientFallback from '../webgl/StaticGradientFallback';

const LiquidGradientMesh = lazy(() => import('../webgl/LiquidGradientMesh'));

export default function Hero() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headlineRef.current) return;
    const chars = splitText(headlineRef.current);
    if (prefersReducedMotion()) {
      gsap.set([eyebrowRef.current, headlineRef.current, subRef.current, metaRef.current], { opacity: 1, y: 0 });
      if (metaRef.current) gsap.set(Array.from(metaRef.current.children), { opacity: 1, y: 0 });
      gsap.set(chars, { yPercent: 0, opacity: 1 });
      return;
    }
    gsap.set(headlineRef.current, { opacity: 1 });
    const tl = gsap.timeline({ delay: 0.35 });
    tl.fromTo(eyebrowRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' })
      .fromTo(chars, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.018 }, '-=0.5')
      .fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, '-=0.6')
      .fromTo(metaRef.current?.children ?? [], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.4');
  }, { scope: sectionRef, dependencies: [] });

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[100svh] w-full overflow-hidden"
    >
      <div className="absolute inset-0">
        <WebGLErrorBoundary fallback={<StaticGradientFallback />}>
          <Suspense fallback={<div className="absolute inset-0 bg-[var(--color-bg)]" />}>
            <LiquidGradientMesh scrollTriggerId="hero" />
          </Suspense>
        </WebGLErrorBoundary>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_60%,rgba(5,5,7,0.25)_0%,rgba(5,5,7,0.65)_70%,rgba(5,5,7,0.92)_100%)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col justify-between px-6 pb-12 pt-28 md:px-10 md:pb-16 md:pt-32">
        <div ref={eyebrowRef} className="glass glass-pill tag inline-flex w-fit items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-plasma-lime)] glow-lime" />
          <span>{t('hero.eyebrow')}</span>
        </div>

        <div className="max-w-[1600px]">
          <h1 ref={headlineRef} className="font-display text-display-xl text-[var(--color-fg)]">
            {t('hero.headline')}
          </h1>
          <p ref={subRef} className="lead mt-8 max-w-2xl text-[var(--color-fg)]/85">
            {t('hero.sub')}
          </p>
        </div>

        <div ref={metaRef} className="flex flex-wrap items-end justify-between gap-3">
          <div className="glass glass-pill tag">{t('hero.metaRole')}</div>
          <div className="glass glass-pill tag">{t('hero.metaLocation')}</div>
          <div className="glass glass-pill tag inline-flex items-center gap-2">
            <span>{t('hero.scroll')}</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M7 1v12m0 0L1 7m6 6l6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
