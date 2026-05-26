import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, Layers, Hammer, GraduationCap, Handshake, Compass, FlaskConical, Plug, Users } from 'lucide-react';
import { prefersReducedMotion } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Step = { label: string; title: string; body: string };

const ICONS_STANDARD = [Search, Layers, Hammer, GraduationCap, Handshake];
const ICONS_AI = [Compass, Search, FlaskConical, Plug, Users];

export default function Process() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const railProgressRef = useRef<HTMLDivElement>(null);
  const [variant, setVariant] = useState<'standard' | 'ai'>('standard');

  const steps = t(`process.${variant}.steps`, { returnObjects: true }) as Step[];
  const icons = variant === 'standard' ? ICONS_STANDARD : ICONS_AI;

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.process-item');
      items.forEach((item) => {
        const dot = item.querySelector('.process-dot');
        const icon = item.querySelector('.process-icon');
        gsap.fromTo(
          item,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 80%' },
          },
        );
        if (dot) {
          gsap.to(dot, {
            backgroundColor: '#ffffff',
            boxShadow: '0 0 0 6px rgba(168,85,247,0.12), 0 0 24px rgba(0,229,255,0.55)',
            duration: 0.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 62%', toggleActions: 'play none none reverse' },
          });
        }
        if (icon) {
          gsap.from(icon, {
            scale: 0.6,
            rotate: -10,
            opacity: 0,
            duration: 0.8,
            ease: 'back.out(2)',
            scrollTrigger: { trigger: item, start: 'top 75%' },
          });
        }
      });

      if (railProgressRef.current) {
        gsap.to(railProgressRef.current, {
          height: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
            end: 'bottom 70%',
            scrub: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language, variant]);

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-label="Process"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-40"
    >
      <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            {t('process.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white">
            {t('process.title')}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
            {t('process.lede')}
          </p>
        </div>
        <div
          role="tablist"
          aria-label={t('process.variantLabel')}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1 font-mono text-[10px] uppercase tracking-[0.2em] backdrop-blur"
        >
          {(['standard', 'ai'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={variant === v}
              onClick={() => setVariant(v)}
              className={`rounded-full px-3.5 py-1.5 transition-colors ${
                variant === v
                  ? 'bg-white text-[var(--color-bg)]'
                  : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              {t(`process.${v}.label`)}
            </button>
          ))}
        </div>
      </div>

      <div className="relative grid gap-10 pl-10 sm:pl-14">
        <div className="absolute bottom-0 left-3 top-2 w-px bg-white/8" aria-hidden="true">
          <div
            ref={railProgressRef}
            className="w-px bg-gradient-to-b from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)]"
            style={{ height: '0%' }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = icons[idx] ?? Search;
          return (
            <article key={`${variant}-${step.label}`} className="process-item relative">
              <span
                aria-hidden="true"
                className="process-dot absolute -left-[34px] top-2 h-2.5 w-2.5 rounded-full border border-white/30 bg-[var(--color-bg)] sm:-left-[42px]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <span className="process-icon inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[var(--color-accent-cyan)]">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
                  Step {String(idx + 1).padStart(2, '0')} · {step.label}
                </span>
              </div>
              <h3 className="mt-3 font-display text-2xl text-white md:text-3xl">{step.title}</h3>
              <p className="mt-2 max-w-2xl text-base text-[var(--color-muted)]">{step.body}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
