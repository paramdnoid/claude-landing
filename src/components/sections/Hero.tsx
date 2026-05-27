import { lazy, Suspense, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, revealChars, splitText } from '../../lib/animations';

const HeroParticles = lazy(() => import('../HeroParticles'));
const HeroLogotype = lazy(() => import('../HeroLogotype'));

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const logoLayerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      const taglineChars = taglineRef.current ? splitText(taglineRef.current) : [];

      if (reduced) {
        gsap.set(
          [eyebrowRef.current, logoLayerRef.current, ledeRef.current, hintRef.current],
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' },
        );
        gsap.set(taglineChars, { yPercent: 0, opacity: 1 });
        return;
      }

      const introTl = gsap.timeline({ delay: 0.15 });
      if (eyebrowRef.current) {
        introTl.fromTo(
          eyebrowRef.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        );
      }
      if (logoLayerRef.current) {
        introTl.fromTo(
          logoLayerRef.current,
          { opacity: 0, scale: 1.08, filter: 'blur(14px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.6, ease: 'expo.out' },
          '-=0.2',
        );
      }
      if (taglineChars.length) {
        introTl.add(revealChars(taglineChars, { stagger: 0.012, duration: 0.7 }), '-=1.0');
      }
      if (ledeRef.current) {
        introTl.fromTo(
          ledeRef.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.5',
        );
      }
      if (hintRef.current) {
        introTl.fromTo(
          hintRef.current,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.3',
        );
      }

      const scrubTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          scrub: 1,
          pin: true,
          pinSpacing: true,
        },
      });

      scrubTl
        .to(logoLayerRef.current, { scale: 1.25, opacity: 0, ease: 'none' }, 0)
        .to(taglineRef.current, { yPercent: -40, opacity: 0, ease: 'none' }, 0)
        .to(ledeRef.current, { yPercent: -80, opacity: 0, ease: 'none' }, 0)
        .to(hintRef.current, { opacity: 0, ease: 'none' }, 0)
        .to(bgRef.current, { yPercent: -25, ease: 'none' }, 0);
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-labelledby="hero-title"
      className="relative h-screen w-full overflow-hidden bg-noise"
    >
      <div
        ref={bgRef}
        aria-hidden="true"
        className="bg-grid absolute inset-0 -z-20"
        style={{
          maskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      <Suspense fallback={null}>
        <HeroParticles />
      </Suspense>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[5]"
        style={{
          background:
            'radial-gradient(ellipse 55% 50% at 50% 50%, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.2) 45%, transparent 80%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-[6]"
        style={{
          background:
            'radial-gradient(circle at 75% 25%, rgba(168,85,247,0.22), transparent 55%), radial-gradient(circle at 18% 75%, rgba(0,229,255,0.20), transparent 55%)',
        }}
      />

      {/* The signature: shader-mesh ZIAN. Sits behind the foreground text. */}
      <div
        ref={logoLayerRef}
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="relative h-[80vh] w-full max-w-[1600px] px-4">
          <Suspense fallback={null}>
            <HeroLogotype />
          </Suspense>
        </div>
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-start justify-between px-6 pt-32 pb-16 lg:px-10 lg:pt-40 lg:pb-20">
        <span
          ref={eyebrowRef}
          className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]"
        >
          {t('hero.eyebrow')}
        </span>

        {/* SR-only H1 — the visible "ZIAN" is rendered by HeroLogotype. */}
        <h1 id="hero-title" className="sr-only">{t('hero.title')}</h1>

        <div className="mt-auto max-w-3xl">
          <p
            ref={taglineRef}
            className="font-display text-[clamp(1.75rem,4vw,3.25rem)] leading-[1.02] tracking-[-0.04em] text-gradient"
          >
            {t('hero.tagline')}
          </p>
          <p
            ref={ledeRef}
            className="mt-7 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] md:text-lg"
          >
            {t('hero.lede')}
          </p>
        </div>

        <div
          ref={hintRef}
          className="absolute bottom-8 left-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-muted-2)] lg:left-10"
        >
          <span className="relative inline-block h-8 w-px overflow-hidden">
            <span className="absolute inset-x-0 top-0 h-3 animate-[scrollHint_2s_ease-in-out_infinite] bg-[var(--color-accent-cyan)]" />
          </span>
          {t('hero.scrollHint')}
        </div>
      </div>

      <style>{`
        @keyframes scrollHint {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>
    </section>
  );
}
