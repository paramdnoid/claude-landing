import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Code2, GraduationCap, Network } from 'lucide-react';
import ShowcaseCases from './ShowcaseCases';
import AiDemo from './AiDemo';
import { prefersReducedMotion } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Service = {
  tag: string;
  title: string;
  body: string;
  features: string[];
};

const ICONS = [Code2, GraduationCap, Network];

export default function Showcase() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const services = t('showcase.services', { returnObjects: true }) as Service[];

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>('.service-card');
      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { y: 80, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            delay: i * 0.08,
            scrollTrigger: { trigger: card, start: 'top 82%' },
          },
        );
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="showcase"
      aria-label="Showcase"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-40"
    >
      <div className="mb-16 max-w-3xl">
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          {t('showcase.eyebrow')}
        </span>
        <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white">
          {t('showcase.title')}
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[var(--color-muted)]">
          {t('showcase.lede')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {services.map((svc, i) => {
          const Icon = ICONS[i] ?? Code2;
          return (
            <article
              key={svc.tag}
              className="service-card group border-gradient relative flex flex-col gap-5 rounded-2xl bg-[var(--color-bg-elev)]/60 p-7 backdrop-blur transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[var(--color-accent-cyan)] transition-colors group-hover:text-[var(--color-accent-violet)]">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
                  {svc.tag}
                </span>
              </div>
              <h3 className="font-display text-2xl leading-tight text-white">{svc.title}</h3>
              <p className="text-[var(--color-muted)]">{svc.body}</p>
              <ul className="mt-auto space-y-2 border-t border-white/5 pt-5 font-mono text-xs text-[var(--color-muted)]">
                {svc.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <ArrowUpRight size={12} className="text-[var(--color-accent-cyan)]" />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <ShowcaseCases />
      <AiDemo />
    </section>
  );
}
