import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles, Layers, Database, Cloud } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { prefersReducedMotion, splitText } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Group = { label: string; items: string[] };

const GROUP_ICONS: LucideIcon[] = [Sparkles, Layers, Database, Cloud];

export default function TechStack() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const groups = t('techstack.groups', { returnObjects: true }) as Group[];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (titleRef.current) {
        const chars = splitText(titleRef.current);
        if (prefersReducedMotion()) {
          gsap.set(chars, { y: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            chars,
            { yPercent: 110, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.015,
              scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }
      if (ledeRef.current) {
        if (prefersReducedMotion()) {
          gsap.set(ledeRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            ledeRef.current,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: ledeRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }
      if (gridRef.current) {
        const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.stack-card'));
        const chips = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.stack-chip'));
        if (prefersReducedMotion()) {
          gsap.set([...cards, ...chips], { opacity: 1, y: 0, scale: 1 });
        } else {
          gsap.fromTo(
            cards,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              stagger: 0.1,
              scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true },
            },
          );
          gsap.fromTo(
            chips,
            { scale: 0.85, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.5,
              ease: 'back.out(1.4)',
              stagger: { each: 0.025, from: 'random' },
              scrollTrigger: { trigger: gridRef.current, start: 'top 78%', once: true },
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
      id="techstack"
      aria-label="Tech stack"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-12 lg:py-48"
    >

      <div className="max-w-4xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('techstack.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2rem,6vw,5rem)] leading-none tracking-[-0.04em] text-white"
        >
          {t('techstack.title')}{' '}
          <span className="text-gradient">{t('techstack.titleAccent')}</span>
        </h2>
        <p
          ref={ledeRef}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          {t('techstack.lede')}
        </p>
      </div>

      <div
        ref={gridRef}
        className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10"
      >
        {groups.map((group, i) => {
          const Icon = GROUP_ICONS[i] ?? Sparkles;
          return (
            <div
              key={group.label}
              data-cursor="hover"
              className="stack-card premium-card group relative overflow-hidden p-8 md:p-10"
            >
              {/* corner gradient blob */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
                style={{
                  background:
                    i % 2 === 0
                      ? 'radial-gradient(circle, rgba(0,229,255,0.55), transparent 70%)'
                      : 'radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)',
                }}
              />

              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-cyan">
                  {String(i + 1).padStart(2, '0')} / {String(groups.length).padStart(2, '0')}
                </span>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-white/85 transition-all duration-500 group-hover:border-accent-cyan/60 group-hover:bg-accent-cyan/8 group-hover:text-accent-cyan group-hover:shadow-[0_0_22px_rgba(0,229,255,0.35)]">
                  <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                </span>
              </div>

              <h3 className="relative mt-7 font-display text-2xl tracking-[-0.02em] text-white md:text-3xl">
                {group.label}
              </h3>

              <ul className="relative mt-6 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="stack-chip cursor-default rounded-full border border-white/10 bg-white/4 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-white/80 transition-all duration-300 hover:border-accent-cyan/60 hover:bg-accent-cyan/10 hover:text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.35)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
