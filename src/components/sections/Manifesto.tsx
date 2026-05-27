import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { revealWordsOnScroll } from '../../lib/animations';

export default function Manifesto() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      revealWordsOnScroll(el, {
        trigger: sectionRef.current ?? el,
        start: `top+=${i * 30}% 70%`,
        end: `top+=${i * 30 + 35}% 35%`,
        scrub: 0.8,
      });
    });
  }, []);

  const lines: string[] = t('manifesto.lines', { returnObjects: true }) as string[];

  return (
    <section ref={sectionRef} id="manifesto" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <div className="tag mb-12">{t('manifesto.eyebrow')}</div>
        <div className="space-y-4 md:space-y-6">
          {lines.map((line, i) => (
            <p
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`font-display text-display-md ${i % 2 === 1 ? 'text-plasma' : 'text-[var(--color-fg)]'}`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
