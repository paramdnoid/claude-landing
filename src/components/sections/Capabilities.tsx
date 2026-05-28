import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';
import { getLenis } from '../../lib/smoothScroll';

type Capability = {
  slug: string;
  index: string;
  title: string;
  body: string;
  tags: string[];
};

const HEADER_OFFSET = -64;

export default function Capabilities() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);

  const items = t('capabilities.items', { returnObjects: true }) as Capability[];
  const miniIndexLabel = t('capabilities.miniIndexLabel');
  const itemCtaLabel = t('capabilities.itemCta.label');
  const ctaLabel = t('capabilities.cta.label');

  const [activeSlug, setActiveSlug] = useState<string>(items[0]?.slug ?? '');

  useGSAP(
    () => {
      if (!headerRef.current) return;
      const headerKids = Array.from(headerRef.current.children) as HTMLElement[];
      const articleKidsBySection = articleRefs.current
        .filter((el): el is HTMLElement => el !== null)
        .map((art) => ({ art, kids: Array.from(art.children) as HTMLElement[] }));

      if (prefersReducedMotion()) {
        gsap.set(headerKids, { opacity: 1, y: 0 });
        articleKidsBySection.forEach(({ kids }) => gsap.set(kids, { opacity: 1, y: 0 }));
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

      articleKidsBySection.forEach(({ art, kids }) => {
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
    { scope: sectionRef, dependencies: [items.length] },
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
        const slug = (first.target as HTMLElement).dataset.slug;
        if (slug) setActiveSlug(slug);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items.length]);

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
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="relative px-6 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-12">
        <div className="md:col-span-5 md:sticky md:top-[clamp(6rem,12vh,9rem)] md:self-start">
          <div ref={headerRef} className="flex flex-col gap-6">
            <div className="tag">{t('capabilities.eyebrow')}</div>
            <h2 id="capabilities-heading" className="font-display text-display-lg">
              {t('capabilities.title')}
            </h2>
            <p className="lead max-w-md">{t('capabilities.intro')}</p>
          </div>

          <nav
            aria-label={miniIndexLabel}
            className="mt-12 hidden border-t border-[var(--color-border)] pt-8 md:block"
          >
            <ol className="flex flex-col gap-1">
              {items.map((it) => {
                const id = `capability-${it.slug}`;
                const isActive = activeSlug === it.slug;
                return (
                  <li key={it.slug}>
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
                        {it.index}
                      </span>
                      <span className="font-display text-base md:text-lg">{it.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <a
            href="#contact"
            onClick={(e) => handleAnchorClick(e, 'contact')}
            aria-label={`${ctaLabel} — ${t('nav.contact')}`}
            className="group mt-10 hidden w-fit items-center gap-3 glass glass-pill text-sm transition-shadow duration-300 hover:shadow-[var(--shadow-glow-lime)] md:inline-flex"
          >
            <span>{ctaLabel}</span>
            <span
              aria-hidden
              className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
            >
              →
            </span>
          </a>
        </div>

        <div className="md:col-span-7 flex flex-col">
          {items.map((it, i) => {
            const id = `capability-${it.slug}`;
            return (
              <article
                key={it.slug}
                id={id}
                ref={(el) => {
                  articleRefs.current[i] = el;
                }}
                data-slug={it.slug}
                aria-labelledby={`${id}-title`}
                className={`flex scroll-mt-[clamp(6rem,12vh,9rem)] flex-col justify-start gap-6 py-12 md:gap-7 md:py-24 ${
                  i > 0 ? 'border-t border-[var(--color-border)]' : ''
                }`}
              >
                <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-plasma-lime)]">
                  {it.index}
                </span>
                <h3 id={`${id}-title`} className="font-display text-display-md">
                  {it.title}
                </h3>
                <p className="lead max-w-[60ch]">{it.body}</p>
                <ul
                  role="list"
                  className="flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-xs uppercase tracking-widest text-[var(--color-muted)]"
                >
                  {it.tags.map((tag) => (
                    <li
                      key={tag}
                      className="before:mr-2 before:text-[var(--color-muted)]/40 before:content-['·'] first:before:hidden"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  onClick={(e) => handleAnchorClick(e, 'contact')}
                  aria-label={`${itemCtaLabel} — ${it.title}`}
                  className="group mt-2 inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-widest text-[var(--color-plasma-lime)] transition-opacity duration-200 hover:opacity-80"
                >
                  <span>{itemCtaLabel}</span>
                  <span
                    aria-hidden
                    className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
                  >
                    →
                  </span>
                </a>
              </article>
            );
          })}
        </div>

        <a
          href="#contact"
          onClick={(e) => handleAnchorClick(e, 'contact')}
          aria-label={`${ctaLabel} — ${t('nav.contact')}`}
          className="group inline-flex w-fit items-center gap-3 glass glass-pill text-sm transition-shadow duration-300 hover:shadow-[var(--shadow-glow-lime)] md:hidden"
        >
          <span>{ctaLabel}</span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
          >
            →
          </span>
        </a>
      </div>
    </section>
  );
}
