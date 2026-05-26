import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, revealChars, splitText } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !titleRef.current) return;

    const ctx = gsap.context(() => {
      const titleChars = splitText(titleRef.current!);
      const taglineChars = taglineRef.current ? splitText(taglineRef.current) : [];

      const introTl = gsap.timeline({ delay: 0.2 });
      introTl.add(revealChars(titleChars, { stagger: 0.025, duration: 1 }));
      if (taglineChars.length) {
        introTl.add(revealChars(taglineChars, { stagger: 0.012, duration: 0.7 }), '-=0.6');
      }
      if (ledeRef.current) {
        introTl.fromTo(
          ledeRef.current,
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
          '-=0.4',
        );
      }
      if (hintRef.current) {
        introTl.fromTo(
          hintRef.current,
          { y: 8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.2',
        );
      }

      if (prefersReducedMotion()) return;

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
        .to(
          titleRef.current,
          { yPercent: -20, scale: 1.15, letterSpacing: '-0.06em', ease: 'none' },
          0,
        )
        .to(taglineRef.current, { yPercent: -40, opacity: 0, ease: 'none' }, 0)
        .to(ledeRef.current, { yPercent: -80, opacity: 0, ease: 'none' }, 0)
        .to(hintRef.current, { opacity: 0, ease: 'none' }, 0)
        .to(bgRef.current, { yPercent: -25, ease: 'none' }, 0)
        .to(titleRef.current, { opacity: 0, filter: 'blur(8px)', ease: 'none' }, 0.6);
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label="Hero"
      className="relative h-screen w-full overflow-hidden bg-noise"
    >
      <div
        ref={bgRef}
        aria-hidden="true"
        className="bg-grid absolute inset-0 -z-10"
        style={{
          maskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at 50% 40%, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, rgba(168,85,247,0.22), transparent 55%), radial-gradient(circle at 20% 70%, rgba(0,229,255,0.18), transparent 55%)',
        }}
      />

      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-start justify-center px-6 lg:px-10">
        <span className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          {t('hero.eyebrow')}
        </span>
        <h1
          ref={titleRef}
          className="font-display text-[clamp(2.75rem,9vw,8rem)] leading-[0.95] text-white"
        >
          {t('hero.title')}
        </h1>
        <p
          ref={taglineRef}
          className="mt-6 font-display text-[clamp(1.25rem,2.6vw,2rem)] leading-tight text-gradient"
        >
          {t('hero.tagline')}
        </p>
        <p
          ref={ledeRef}
          className="mt-8 max-w-2xl text-base leading-relaxed text-[var(--color-muted)] md:text-lg"
        >
          {t('hero.lede')}
        </p>

        <div
          ref={hintRef}
          className="absolute bottom-10 left-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--color-muted-2)] lg:left-10"
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
