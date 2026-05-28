import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';
import { getLenis } from '../../lib/smoothScroll';

type Step = { index: string; title: string; body: string };

const HEADER_OFFSET = -64;

export default function Process() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);

  const steps = t('process.steps', { returnObjects: true }) as Step[];
  const miniIndexLabel = t('process.miniIndexLabel', { defaultValue: 'Prozessschritte' });

  const [activeIndex, setActiveIndex] = useState<string>(steps[0]?.index ?? '');

  useGSAP(
    () => {
      if (!headerRef.current) return;
      const headerKids = Array.from(headerRef.current.children) as HTMLElement[];
      const articleKids = articleRefs.current
        .filter((el): el is HTMLElement => el !== null)
        .map((art) => ({ art, kids: Array.from(art.children) as HTMLElement[] }));

      if (prefersReducedMotion()) {
        gsap.set(headerKids, { opacity: 1, y: 0 });
        articleKids.forEach(({ kids }) => gsap.set(kids, { opacity: 1, y: 0 }));
        return;
      }

      gsap.fromTo(
        headerKids,
        { y: 24, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.07,
          scrollTrigger: { trigger: headerRef.current, start: 'top 85%', once: true },
        },
      );

      articleKids.forEach(({ art, kids }) => {
        gsap.fromTo(
          kids,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.06,
            scrollTrigger: { trigger: art, start: 'top 80%', once: true },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [steps.length] },
  );

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = articleRefs.current.filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const intersecting = entries.filter((e) => e.isIntersecting);
        if (intersecting.length === 0) return;
        const sorted = intersecting.slice().sort((a, b) => {
          const pos = (a.target as HTMLElement).compareDocumentPosition(b.target);
          return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
        });
        const first = sorted[0];
        if (!first) return;
        const idx = (first.target as HTMLElement).dataset.stepIndex;
        if (idx) setActiveIndex(idx);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(target, { offset: HEADER_OFFSET, duration: 1.0 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-heading"
      className="relative border-t border-[var(--color-border)] px-6 pt-16 pb-16 md:pt-0 md:px-10 md:pb-24"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-12">
        <div className="md:col-span-5 md:sticky md:top-[clamp(6rem,12vh,9rem)] md:self-start">
          <div ref={headerRef} className="flex flex-col gap-6 md:pt-24">
            <div className="tag">{t('process.eyebrow')}</div>
            <h2 id="process-heading" className="font-display text-display-lg">
              {t('process.title')}
            </h2>
            <p className="lead max-w-md">{t('process.intro')}</p>
          </div>

          <nav
            aria-label={miniIndexLabel}
            className="mt-12 hidden border-t border-[var(--color-border)] pt-8 md:block"
          >
            <ol className="flex flex-col gap-1">
              {steps.map((s) => {
                const id = `process-step-${s.index}`;
                const isActive = activeIndex === s.index;
                return (
                  <li key={s.index}>
                    <a
                      href={`#${id}`}
                      data-active={isActive}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={(e) => handleAnchorClick(e, id)}
                      className="group flex items-center gap-4 py-2 text-[var(--color-muted)] transition-colors duration-200 hover:text-[var(--color-fg)] data-[active=true]:text-[var(--color-fg)]"
                    >
                      <span
                        aria-hidden
                        className="block h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]/30 transition-all duration-200 group-hover:bg-[var(--color-muted)] group-data-[active=true]:bg-[var(--color-plasma-lime)] group-data-[active=true]:shadow-[var(--shadow-glow-lime)]"
                      />
                      <span className="font-mono text-xs tracking-widest text-[var(--color-plasma-lime)]/70 transition-colors duration-200 group-data-[active=true]:text-[var(--color-plasma-lime)]">
                        {s.index}
                      </span>
                      <span className="font-display text-base md:text-lg">{s.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="md:col-span-7 flex flex-col">
          {steps.map((s, i) => {
            const id = `process-step-${s.index}`;
            return (
              <article
                key={s.index}
                id={id}
                ref={(el) => {
                  articleRefs.current[i] = el;
                }}
                data-step-index={s.index}
                aria-labelledby={`${id}-title`}
                className={`flex scroll-mt-[clamp(6rem,12vh,9rem)] flex-col justify-start gap-6 py-12 md:gap-7 md:py-24 ${i > 0 ? 'border-t border-[var(--color-border)]' : ''}`}
              >
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-plasma-lime)]">
                  {s.index}
                </span>
                <h3 id={`${id}-title`} className="font-display text-display-md">
                  {s.title}
                </h3>
                <p className="lead max-w-[60ch]">{s.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
