import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { LayoutPanelLeft, Workflow, Database, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, splitText } from '../../lib/animations';
import { useMagnet } from '../../lib/useMagnet';

gsap.registerPlugin(ScrollTrigger);

type Item = {
  tag: string;
  title: string;
  body: string;
  tags: string[];
};

const ICONS: LucideIcon[] = [LayoutPanelLeft, Workflow, Database, Zap];

export default function Capabilities() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const items = t('capabilities.items', { returnObjects: true }) as Item[];

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
              stagger: 0.014,
              scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }

      if (gridRef.current) {
        const cards = Array.from(gridRef.current.querySelectorAll<HTMLElement>('.cap-card'));
        if (prefersReducedMotion()) {
          gsap.set(cards, { y: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            cards,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              stagger: { each: 0.12, from: 'start' },
              scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true },
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
      id="capabilities"
      aria-label="Capabilities"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:pl-70 lg:py-48"
    >
      <div className="max-w-4xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('capabilities.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2rem,6vw,5rem)] leading-none tracking-[-0.04em] text-white"
        >
          {t('capabilities.title')}{' '}
          <span className="text-gradient">{t('capabilities.titleAccent')}</span>
        </h2>
      </div>

      <div
        ref={gridRef}
        className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8"
      >
        {items.map((item, i) => (
          <CapabilityCard key={item.tag} item={item} Icon={ICONS[i] ?? Zap} />
        ))}
      </div>
    </section>
  );
}

function CapabilityCard({ item, Icon }: { item: Item; Icon: LucideIcon }) {
  const magnetRef = useMagnet<HTMLDivElement>(0.12);

  return (
    <div
      ref={magnetRef}
      data-cursor="hover"
      className="cap-card group relative rounded-3xl border border-white/8 bg-bg-elev/70 p-8 backdrop-blur-xl transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/15 md:p-10"
      style={{ willChange: 'transform' }}
    >
      {/* Chromatic glow on hover — cyan + violet halo */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow:
            '0 30px 80px -30px rgba(0,229,255,0.35), 0 30px 80px -30px rgba(168,85,247,0.30)',
        }}
      />
      {/* Border gradient on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          padding: 1,
          background:
            'linear-gradient(135deg, rgba(0,229,255,0.5), rgba(168,85,247,0.5))',
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <div className="relative flex items-start justify-between gap-4">
        <span className="font-display text-[clamp(3.5rem,7vw,5.5rem)] leading-none tracking-[-0.06em] text-gradient">
          {item.tag}
        </span>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/3 text-white/80 transition-colors group-hover:border-accent-cyan/60 group-hover:text-accent-cyan">
          <Icon size={18} strokeWidth={1.6} />
        </span>
      </div>

      <h3 className="relative mt-8 font-display text-2xl tracking-[-0.02em] text-white md:text-3xl">
        {item.title}
      </h3>
      <p className="relative mt-3 max-w-md text-base leading-relaxed text-muted">
        {item.body}
      </p>

      <ul className="relative mt-6 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-white/10 bg-white/3 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted"
          >
            {tag}
          </li>
        ))}
      </ul>
    </div>
  );
}
