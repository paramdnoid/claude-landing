import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, revealLineOnScroll } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

export default function Manifesto() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const lineARef = useRef<HTMLHeadingElement>(null);
  const lineBRef = useRef<HTMLHeadingElement>(null);
  const lineCRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const sigListRef = useRef<HTMLUListElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);

  const signature = t('manifesto.signature', { returnObjects: true }) as string[];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (lineARef.current) revealLineOnScroll(lineARef.current, { stagger: 0.014 });
      if (lineBRef.current) revealLineOnScroll(lineBRef.current, { stagger: 0.016 });
      if (lineCRef.current) revealLineOnScroll(lineCRef.current, { stagger: 0.018 });

      if (prefersReducedMotion()) {
        gsap.set([bodyRef.current, kickerRef.current], { opacity: 1, y: 0 });
        if (sigListRef.current) {
          gsap.set(sigListRef.current.children, { opacity: 1, y: 0 });
        }
        return;
      }

      if (bodyRef.current) {
        gsap.fromTo(
          bodyRef.current,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: bodyRef.current, start: 'top 85%', once: true },
          },
        );
      }
      if (sigListRef.current) {
        gsap.fromTo(
          sigListRef.current.children,
          { x: 24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: sigListRef.current, start: 'top 85%', once: true },
          },
        );
      }
      if (kickerRef.current) {
        gsap.fromTo(
          kickerRef.current,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: kickerRef.current, start: 'top 88%', once: true },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      aria-label="Manifesto"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:pl-70 lg:py-48"
    >
      {/* Soft cyan + violet bloom behind the headlines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div
          className="absolute left-1/4 top-1/3 h-[60vh] w-[60vh] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.7), transparent 70%)' }}
        />
        <div
          className="absolute right-[10%] top-1/2 h-[55vh] w-[55vh] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.7), transparent 70%)' }}
        />
      </div>

      <div className="mb-10 lg:mb-16">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('manifesto.eyebrow')}
        </span>
      </div>

      <div className="space-y-0">
        <h2
          ref={lineARef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-white"
        >
          {t('manifesto.lineA')}
        </h2>
        <h2
          ref={lineBRef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-gradient"
        >
          {t('manifesto.lineB')}
        </h2>
        <h2
          ref={lineCRef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-white"
        >
          {t('manifesto.lineC')}
        </h2>
      </div>

      <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <p
          ref={bodyRef}
          className="max-w-xl text-lg leading-relaxed text-muted md:text-xl"
        >
          {t('manifesto.body')}
        </p>

        <div className="relative pl-6">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-accent-cyan via-accent-violet to-transparent"
          />
          <ul ref={sigListRef} className="space-y-3.5">
            {signature.map((line) => (
              <li
                key={line}
                className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/85"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p
        ref={kickerRef}
        className="mt-16 max-w-3xl font-display text-[clamp(1.25rem,2.5vw,2rem)] leading-snug tracking-[-0.02em] text-white/85 lg:mt-24"
      >
        {t('manifesto.kicker')}
      </p>
    </section>
  );
}
