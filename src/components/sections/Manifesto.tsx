import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGSAP } from '@gsap/react';
import { gsap } from '../../lib/gsap';
import { prefersReducedMotion } from '../../lib/animations';

export default function Manifesto() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  const lines: string[] = t('manifesto.lines', { returnObjects: true }) as string[];

  useGSAP(
    () => {
      const els = lineRefs.current.filter((el): el is HTMLParagraphElement => el !== null);
      if (els.length === 0) return;

      if (prefersReducedMotion()) {
        gsap.set(els, { opacity: 1, y: 0 });
        return;
      }

      els.forEach((el) => {
        gsap.fromTo(
          el,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: 'power3.out',
            duration: 0.9,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          },
        );
      });
    },
    { scope: sectionRef, dependencies: [lines.length] },
  );

  return (
    <section
      ref={sectionRef}
      id="manifesto"
      className="relative px-6 py-16 md:px-10 md:py-24"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-12">

          {/* Left: label sidebar */}
          <div className="md:col-span-3 md:border-r md:border-[var(--color-border)] md:pr-10">
            <div className="tag">{t('manifesto.eyebrow')}</div>
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
                      : 'text-[var(--color-fg)]'
                  }`}
                  style={{ opacity: 0 }}
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
