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
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:pl-70 lg:py-48"
    >
      {/* Ambient glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute left-[10%] top-[20%] h-[50vh] w-[50vh] rounded-full opacity-[0.15] blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.7), transparent 70%)' }}
        />
        <div
          className="absolute right-[15%] bottom-[10%] h-[55vh] w-[55vh] rounded-full opacity-[0.15] blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.7), transparent 70%)' }}
        />
      </div>

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
        className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8"
      >
        {groups.map((group, i) => {
          const Icon = GROUP_ICONS[i] ?? Sparkles;
          return (
            <div
              key={group.label}
              data-cursor="hover"
              className="stack-card group relative overflow-hidden rounded-3xl border border-white/8 bg-bg-elev/70 p-7 backdrop-blur-xl transition-[border-color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-white/15 md:p-9"
            >
              {/* hover glow */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  boxShadow:
                    '0 30px 80px -30px rgba(0,229,255,0.30), 0 30px 80px -30px rgba(168,85,247,0.25)',
                }}
              />
              {/* corner gradient accent */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,229,255,0.5), transparent 70%)',
                }}
              />

              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-accent-cyan">
                  {String(i + 1).padStart(2, '0')} / {String(groups.length).padStart(2, '0')}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/3 text-white/75 transition-colors group-hover:border-accent-cyan/60 group-hover:text-accent-cyan">
                  <Icon size={16} strokeWidth={1.6} aria-hidden="true" />
                </span>
              </div>

              <h3 className="relative mt-6 font-display text-2xl tracking-[-0.02em] text-white md:text-3xl">
                {group.label}
              </h3>

              <ul className="relative mt-6 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="stack-chip cursor-default rounded-full border border-white/10 bg-white/3 px-3 py-1.5 font-mono text-[11px] tracking-[0.06em] text-white/80 transition-all duration-300 hover:border-accent-cyan/50 hover:bg-accent-cyan/8 hover:text-white hover:shadow-[0_0_16px_rgba(0,229,255,0.25)]"
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
