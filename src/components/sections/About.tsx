import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { prefersReducedMotion, revealLineOnScroll } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Stat = { value: number; suffix: string; label: string };
type Skill = { name: string; detail: string };

export default function About() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const lineARef = useRef<HTMLHeadingElement>(null);
  const lineBRef = useRef<HTMLHeadingElement>(null);
  const lineCRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLUListElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);

  const stats = t('about.stats', { returnObjects: true }) as Stat[];
  const skills = t('about.skills', { returnObjects: true }) as Skill[];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (lineARef.current) revealLineOnScroll(lineARef.current, { stagger: 0.014 });
      if (lineBRef.current) revealLineOnScroll(lineBRef.current, { stagger: 0.016 });
      if (lineCRef.current) revealLineOnScroll(lineCRef.current, { stagger: 0.018 });

      const reduced = prefersReducedMotion();

      if (bodyRef.current) {
        if (reduced) {
          gsap.set(bodyRef.current, { opacity: 1, y: 0 });
        } else {
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
      }

      // --- Stats: count-up + fade-in on scroll ---
      if (statsRef.current) {
        const cards = Array.from(statsRef.current.querySelectorAll<HTMLElement>('.stat-card'));
        if (reduced) {
          gsap.set(cards, { opacity: 1, y: 0 });
          cards.forEach((card) => {
            const numEl = card.querySelector<HTMLElement>('.stat-num');
            const target = Number(card.dataset.target ?? '0');
            if (numEl) numEl.textContent = String(target);
          });
        } else {
          gsap.fromTo(
            cards,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.08,
              scrollTrigger: { trigger: statsRef.current, start: 'top 80%', once: true },
            },
          );
          cards.forEach((card) => {
            const numEl = card.querySelector<HTMLElement>('.stat-num');
            const target = Number(card.dataset.target ?? '0');
            if (!numEl) return;
            const obj = { v: 0 };
            gsap.to(obj, {
              v: target,
              duration: 1.4,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 85%', once: true },
              onUpdate: () => {
                numEl.textContent = String(Math.round(obj.v));
              },
            });
          });
        }
      }

      // --- Skills: stagger reveal ---
      if (skillsRef.current) {
        if (reduced) {
          gsap.set(skillsRef.current.children, { opacity: 1, x: 0 });
        } else {
          gsap.fromTo(
            skillsRef.current.children,
            { x: -16, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power3.out',
              stagger: 0.06,
              scrollTrigger: { trigger: skillsRef.current, start: 'top 82%', once: true },
            },
          );
        }
      }

      if (kickerRef.current) {
        if (reduced) {
          gsap.set(kickerRef.current, { opacity: 1, y: 0 });
        } else {
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
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-label="About"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:pl-70 lg:py-48"
    >
      {/* Soft cyan + violet bloom */}
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
          {t('about.eyebrow')}
        </span>
      </div>

      <div className="space-y-0">
        <h2
          ref={lineARef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-white"
        >
          {t('about.lineA')}
        </h2>
        <h2
          ref={lineBRef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-gradient"
        >
          {t('about.lineB')}
        </h2>
        <h2
          ref={lineCRef}
          className="font-display text-[clamp(2.5rem,11vw,11rem)] leading-[0.92] tracking-tighter text-white"
        >
          {t('about.lineC')}
        </h2>
      </div>

      <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <p
          ref={bodyRef}
          className="max-w-xl text-lg leading-relaxed text-muted md:text-xl"
        >
          {t('about.body')}
        </p>

        <div className="relative pl-6">
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-px bg-linear-to-b from-accent-cyan via-accent-violet to-transparent"
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent-cyan">
            {t('about.skillsLabel')}
          </span>
          <ul ref={skillsRef} className="mt-6 space-y-1">
            {skills.map((skill) => (
              <li key={skill.name} className="group relative">
                <div
                  data-cursor="hover"
                  className="flex cursor-default items-baseline justify-between gap-4 border-b border-white/5 py-3 transition-colors duration-300 group-hover:border-accent-cyan/40"
                >
                  <span className="font-display text-lg tracking-[-0.01em] text-white/90 transition-colors duration-300 group-hover:text-white">
                    {skill.name}
                  </span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={1.5}
                    className="shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-accent-cyan"
                    aria-hidden="true"
                  />
                </div>
                <p className="max-h-0 overflow-hidden font-mono text-[10px] uppercase tracking-[0.22em] text-muted-2 transition-[max-height,padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:max-h-10 group-hover:pt-1 group-hover:pb-2">
                  {skill.detail}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Animated stat counters */}
      <div
        ref={statsRef}
        className="mt-20 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/3 lg:mt-28 lg:grid-cols-4"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            data-target={stat.value}
            className="stat-card relative bg-bg-elev/70 p-6 backdrop-blur-sm md:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/12 to-transparent"
            />
            <div className="flex items-baseline gap-1">
              <span className="stat-num font-display text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-[-0.04em] text-gradient tabular-nums">
                0
              </span>
              <span className="font-display text-2xl tracking-[-0.04em] text-gradient md:text-3xl">
                {stat.suffix}
              </span>
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <p
        ref={kickerRef}
        className="mt-16 max-w-3xl font-display text-[clamp(1.25rem,2.5vw,2rem)] leading-snug tracking-[-0.02em] text-white/85 lg:mt-24"
      >
        {t('about.kicker')}
      </p>
    </section>
  );
}
