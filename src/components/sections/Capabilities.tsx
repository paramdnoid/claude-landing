import { useEffect, useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Globe, Smartphone, BrainCircuit, GraduationCap } from 'lucide-react';
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

const ICONS: LucideIcon[] = [Globe, Smartphone, BrainCircuit, GraduationCap];

export default function Capabilities() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const items = t('capabilities.items', { returnObjects: true }) as Item[];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const reduced = prefersReducedMotion();
      if (titleRef.current) {
        const chars = splitText(titleRef.current);
        if (reduced) {
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
        if (reduced) {
          gsap.set(cards, { y: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            cards,
            { y: 60, opacity: 0, scale: 0.96 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 1,
              ease: 'power4.out',
              stagger: { each: 0.12, from: 'start' },
              scrollTrigger: { trigger: gridRef.current, start: 'top 82%', once: true },
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
      id="services"
      aria-label="Services"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-12 lg:py-48"
    >
      <div className="max-w-4xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('capabilities.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2rem,6vw,5rem)] leading-[1.02] tracking-[-0.04em] text-white"
        >
          {t('capabilities.title')}{' '}
          <span className="text-gradient">{t('capabilities.titleAccent')}</span>
        </h2>
      </div>

      <div
        ref={gridRef}
        className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-10"
      >
        {items.map((item, i) => (
          <CapabilityCard key={item.tag} item={item} Icon={ICONS[i] ?? Globe} />
        ))}
      </div>
    </section>
  );
}

function CapabilityCard({ item, Icon }: { item: Item; Icon: LucideIcon }) {
  const magnetRef = useMagnet<HTMLDivElement>(0.08);
  const cardRef = useRef<HTMLDivElement>(null);

  // Pointer-tracked spotlight glow
  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    el.style.setProperty('--mx', `${x}%`);
    el.style.setProperty('--my', `${y}%`);
  }

  return (
    <div
      ref={magnetRef}
      data-cursor="hover"
      className="cap-card relative"
      style={{ willChange: 'transform' }}
    >
      <div
        ref={cardRef}
        onPointerMove={handleMove}
        className="premium-card group relative overflow-hidden p-9 md:p-11"
        style={{ '--mx': '50%', '--my': '50%' } as React.CSSProperties}
      >
        {/* Pointer-tracked spotlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(420px circle at var(--mx) var(--my), rgba(0,229,255,0.18), transparent 45%)',
          }}
        />

        {/* Corner ambient blob — sits behind everything */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
          style={{
            background:
              'radial-gradient(circle, rgba(168,85,247,0.55), transparent 70%)',
          }}
        />

        <div className="relative flex items-start justify-between gap-4">
          <span className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-none tracking-[-0.06em] text-gradient drop-shadow-[0_0_30px_rgba(0,229,255,0.25)]">
            {item.tag}
          </span>
          <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/4 text-white/85 transition-all duration-500 group-hover:border-accent-cyan/60 group-hover:bg-accent-cyan/8 group-hover:text-accent-cyan group-hover:shadow-[0_0_24px_rgba(0,229,255,0.35)]">
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
        </div>

        <h3 className="relative mt-10 font-display text-2xl tracking-[-0.02em] text-white md:text-[1.85rem]">
          {item.title}
        </h3>
        <p className="relative mt-4 max-w-md text-base leading-relaxed text-muted">
          {item.body}
        </p>

        <ul className="relative mt-7 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-white/10 bg-white/4 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/65 transition-colors duration-300 group-hover:border-white/20 group-hover:text-white/85"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
