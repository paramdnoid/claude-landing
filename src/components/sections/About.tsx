import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Milestone = {
  label: string;
  title: string;
  body: string;
};

export default function About() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const railProgressRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const milestones = t('about.milestones', { returnObjects: true }) as Milestone[];

  useEffect(() => {
    if (!sectionRef.current) return;
    if (prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>('.about-item');

      items.forEach((item) => {
        const dot = item.querySelector('.about-dot');
        gsap.fromTo(
          item,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: item, start: 'top 78%' },
          },
        );
        if (dot) {
          gsap.to(dot, {
            boxShadow: '0 0 0 6px rgba(0,229,255,0.12), 0 0 24px rgba(168,85,247,0.55)',
            backgroundColor: '#ffffff',
            duration: 0.4,
            ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 60%', toggleActions: 'play none none reverse' },
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

      if (avatarRef.current) {
        gsap.to(avatarRef.current, {
          rotate: 6,
          y: -30,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-label="About"
      className="relative mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-40"
    >
      <div className="mb-16 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:items-end">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            {t('about.eyebrow')}
          </span>
          <h2 className="mt-4 font-display text-[clamp(2rem,5vw,4rem)] leading-[1.05] text-white">
            {t('about.title')}
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
            {t('about.lede')}
          </p>
        </div>
        <div
          ref={avatarRef}
          className="relative mx-auto aspect-square w-40 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--color-bg-elev)] sm:w-56 lg:w-full"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 25%, rgba(0,229,255,0.35), transparent 55%), radial-gradient(circle at 75% 80%, rgba(168,85,247,0.45), transparent 55%)',
            }}
          />
          <div className="absolute inset-0 flex items-end justify-end p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
              André Z.
            </span>
          </div>
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

        {milestones.map((m, idx) => (
          <article key={m.label} className="about-item relative">
            <span
              aria-hidden="true"
              className="about-dot absolute -left-[34px] top-2 h-2.5 w-2.5 rounded-full border border-white/30 bg-[var(--color-bg)] sm:-left-[42px]"
            />
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
                {String(idx + 1).padStart(2, '0')} · {m.label}
              </span>
            </div>
            <h3 className="mt-2 font-display text-2xl text-white md:text-3xl">{m.title}</h3>
            <p className="mt-2 max-w-2xl text-base text-[var(--color-muted)]">{m.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
