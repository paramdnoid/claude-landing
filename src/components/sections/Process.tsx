import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { revealChildrenOnScroll } from '../../lib/animations';
import { useActiveSection } from '../../lib/useActiveSection';
import StickyStoryList, { type StickyStoryItem } from './StickyStoryList';

type Step = { index: string; title: string; body: string };
type StepItem = StickyStoryItem & { body: string };

export default function Process() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const articleRefs = useRef<(HTMLElement | null)[]>([]);

  const items = useMemo<StepItem[]>(() => {
    const raw = t('process.steps', { returnObjects: true }) as Step[];
    return raw.map((s) => ({
      key: s.index,
      anchorId: `process-step-${s.index}`,
      index: s.index,
      title: s.title,
      body: s.body,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const miniIndexLabel = t('process.miniIndexLabel', { defaultValue: 'Prozessschritte' });

  const activeIndex = useActiveSection(articleRefs, {
    dataKey: 'stepIndex',
    initial: items[0]?.index ?? '',
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

  return (
    <StickyStoryList<StepItem>
      sectionId="process"
      headingId="process-heading"
      miniIndexLabel={miniIndexLabel}
      activeKey={activeIndex}
      items={items}
      articleDataKey="stepIndex"
      articleDataValue={(it) => it.index}
      articlesRef={articleRefs}
      sectionRef={sectionRef}
      headerRef={headerRef}
      className="relative border-t border-border px-6 pt-16 pb-16 md:pt-0 md:px-10 md:pb-24"
      headerClassName="flex flex-col gap-6"
      renderHeader={() => (
        <>
          <div className="tag">{t('process.eyebrow')}</div>
          <h2 id="process-heading" className="font-display text-display-lg">
            {t('process.title')}
          </h2>
          <p className="lead max-w-md">{t('process.intro')}</p>
        </>
      )}
      renderArticleBody={(it) => (
        <>
          <span className="font-mono text-xs uppercase tracking-widest text-plasma-lime">
            {it.index}
          </span>
          <h3 id={`${it.anchorId}-title`} className="font-display text-display-md">
            {it.title}
          </h3>
          <p className="lead max-w-[60ch]">{it.body}</p>
        </>
      )}
    />
  );
}
