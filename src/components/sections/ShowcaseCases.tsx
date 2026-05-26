import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type CaseItem = {
  tag: string;
  title: string;
  body: string;
  stack: string[];
};

export default function ShowcaseCases() {
  const { t, i18n } = useTranslation();
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const cases = t('showcase.cases', { returnObjects: true }) as CaseItem[];

  useEffect(() => {
    if (!wrapRef.current || !trackRef.current) return;
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      mm.add('(min-width: 768px)', () => {
        const track = trackRef.current!;
        const wrap = wrapRef.current!;
        const distance = track.scrollWidth - window.innerWidth + 80;
        if (distance <= 0) return;

        gsap.to(track, {
          x: -distance,
          ease: 'none',
          scrollTrigger: {
            trigger: wrap,
            start: 'top top',
            end: () => `+=${distance}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });
      });
    }, wrapRef);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, [i18n.language, cases.length]);

  return (
    <div className="mt-32">
      <div className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-accent-violet)]">
            {t('showcase.casesTitle')}
          </span>
          <p className="mt-2 max-w-lg text-[var(--color-muted)]">{t('showcase.casesLede')}</p>
        </div>
        <div className="hidden font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)] md:block">
          ← scroll →
        </div>
      </div>

      <div ref={wrapRef} className="relative md:h-screen md:overflow-hidden">
        <div
          ref={trackRef}
          className="flex flex-col gap-6 md:h-full md:flex-row md:items-center md:gap-10 md:pl-2 md:pr-20"
        >
          {cases.map((c, idx) => (
            <article
              key={c.tag}
              className="relative flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--color-bg-elev)] md:w-[min(70vw,720px)]"
              style={{ aspectRatio: '4 / 3' }}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-90"
                style={{
                  background:
                    idx % 2 === 0
                      ? 'radial-gradient(circle at 20% 20%, rgba(0,229,255,0.25), transparent 50%), radial-gradient(circle at 80% 80%, rgba(168,85,247,0.25), transparent 50%)'
                      : 'radial-gradient(circle at 80% 20%, rgba(168,85,247,0.3), transparent 50%), radial-gradient(circle at 20% 80%, rgba(0,229,255,0.2), transparent 50%)',
                }}
              />
              <div
                aria-hidden="true"
                className="bg-grid absolute inset-0 opacity-30"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                  WebkitMaskImage:
                    'radial-gradient(ellipse at center, black 30%, transparent 75%)',
                }}
              />
              <div className="relative z-10 flex h-full flex-col justify-between p-7 md:p-10">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
                    {c.tag}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted-2)]">
                    {String(idx + 1).padStart(2, '0')} / {String(cases.length).padStart(2, '0')}
                  </span>
                </div>
                <div className="mt-auto">
                  <h3 className="font-display text-3xl leading-tight text-white md:text-4xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 max-w-md text-[var(--color-muted)]">{c.body}</p>
                  <ul className="mt-5 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
                    {c.stack.map((s) => (
                      <li
                        key={s}
                        className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-white/80"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
