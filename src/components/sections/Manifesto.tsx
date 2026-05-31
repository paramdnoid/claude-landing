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
      className="relative overflow-hidden px-6 py-20 md:px-10 md:py-32"
    >
      {/* Plasma panel — a saturated, pervasive gradient fill (not corner glows)
          that turns the manifesto into a luminous colour chapter. Top + bottom
          strips fade back to the page black so it reads as an intentional panel
          between the dark neighbours, not a hard cut. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(125%_140%_at_22%_12%,rgba(99,102,241,0.34)_0%,rgba(30,27,75,0.26)_40%,transparent_80%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(90%_100%_at_88%_92%,rgba(6,182,212,0.20)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_58%_46%,rgba(163,255,18,0.08)_0%,transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-44 bg-[linear-gradient(to_bottom,var(--color-bg),transparent)]" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(to_top,var(--color-bg),transparent)]" />
      </div>

      <div className="relative mx-auto max-w-350">
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-12">

          {/* Left: label sidebar */}
          <div className="md:col-span-3 md:border-r md:border-border md:pr-10">
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
