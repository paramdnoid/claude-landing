import { useMemo, useRef, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { revealChildrenOnScroll } from '../../lib/animations';
import { scrollToSection } from '../../lib/scrollToSection';
import { useActiveSection } from '../../lib/useActiveSection';
import StickyStoryList, { type StickyStoryItem } from './StickyStoryList';

type Capability = {
  slug: string;
  index: string;
  title: string;
  body: string;
  tags: string[];
};

type CapabilityItem = StickyStoryItem & Capability;

const CTA_CLASS =
  'group inline-flex w-fit items-center gap-3 glass glass-pill text-sm transition-shadow duration-300 hover:shadow-[var(--shadow-glow-lime)]';

export default function Capabilities() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);

  // Stabilise on locale so derived items + their dependent effects don't churn.
  const items = useMemo<CapabilityItem[]>(() => {
    const raw = t('capabilities.items', { returnObjects: true }) as Capability[];
    return raw.map((it) => ({
      ...it,
      key: it.slug,
      anchorId: `capability-${it.slug}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const miniIndexLabel = t('capabilities.miniIndexLabel');
  const itemCtaLabel = t('capabilities.itemCta.label');
  const ctaLabel = t('capabilities.cta.label');

  const activeSlug = useActiveSection(articleRefs, {
    dataKey: 'slug',
    initial: items[0]?.slug ?? '',
  });

  useGSAP(
    () => {
      if (headerRef.current) {
        revealChildrenOnScroll(headerRef.current, { y: 24, stagger: 0.07 });
      }
      articleRefs.current.forEach((art) => {
        if (art) revealChildrenOnScroll(art, { y: 28, stagger: 0.06, start: 'top 80%' });
      });
    },
    { scope: sectionRef, dependencies: [items.length] },
  );

  const handleAnchorClick = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id, { duration: 1.0 });
  };

  const cta = (
    <a
      href="#contact"
      onClick={(e) => handleAnchorClick(e, 'contact')}
      aria-label={`${ctaLabel} — ${t('nav.contact')}`}
      className={CTA_CLASS}
    >
      <span>{ctaLabel}</span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-200 ease-out group-hover:translate-x-1"
      >
        →
      </span>
    </a>
  );

  return (
    <StickyStoryList<CapabilityItem>
      sectionId="capabilities"
      headingId="capabilities-heading"
      miniIndexLabel={miniIndexLabel}
      activeKey={activeSlug}
      items={items}
      articleDataKey="slug"
      articleDataValue={(it) => it.slug}
      articlesRef={articleRefs}
      sectionRef={sectionRef}
      headerRef={headerRef}
      className="relative px-6 pt-16 md:px-10 md:pt-24"
      renderHeader={() => (
        <>
          <div className="tag">{t('capabilities.eyebrow')}</div>
          <h2 id="capabilities-heading" className="font-display text-display-lg">
            {t('capabilities.title')}
          </h2>
          <p className="lead max-w-md">{t('capabilities.intro')}</p>
        </>
      )}
      renderArticleBody={(it) => (
        <>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-plasma-lime)]">
            {it.index}
          </span>
          <h3 id={`${it.anchorId}-title`} className="font-display text-display-md">
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
        </>
      )}
      desktopCta={cta}
      mobileCta={cta}
    />
  );
}
