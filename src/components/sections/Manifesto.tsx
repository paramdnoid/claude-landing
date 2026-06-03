import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { revealWordsOnScroll } from '../../lib/animations';

export default function Manifesto() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const lines: string[] = t('manifesto.lines', { returnObjects: true });

  useGSAP(
    () => {
      const els = lineRefs.current.filter((el): el is HTMLParagraphElement => el !== null);
      // Scrub each line's words up into place as the reader scrolls — the
      // manifesto "writes itself". revealWordsOnScroll handles reduced motion.
      els.forEach((el) => {
        revealWordsOnScroll(el, { start: 'top 82%', end: 'top 42%', scrub: 0.6 });
      });
    },
    { scope: sectionRef, dependencies: [lines.length] },
  );

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      aria-labelledby="manifesto-heading"
      className="relative py-20 md:py-32"
    >
      <div className="shell relative">
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-12">

          {/* Left: label sidebar */}
          <div className="md:col-span-3 md:border-r md:border-border md:pr-10">
            <h2 id="manifesto-heading" className="sr-only">{t('nav.manifesto')}</h2>
            <div className="tag">{t('manifesto.eyebrow')}</div>
            <div
              aria-hidden="true"
              className="mt-6 hidden h-20 w-px bg-[linear-gradient(to_bottom,var(--color-plasma-lime),transparent)] md:block"
            />
          </div>

          {/* Right: manifesto lines */}
          <div className="md:col-span-9">
            <div className="space-y-3 md:space-y-4">
              {lines.map((line, i) => (
                <p
                  key={i}
                  ref={(el) => { lineRefs.current[i] = el; }}
                  className={`font-display text-display-md ${
                    i === lines.length - 1
                      ? 'text-plasma pt-2 md:pt-3'
                      : 'text-fg'
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
