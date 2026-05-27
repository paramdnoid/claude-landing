import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/animations';

export default function Manifesto() {
  const { t } = useTranslation();
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      lineRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }
    const triggers: ScrollTrigger[] = [];
    lineRefs.current.forEach((el) => {
      if (!el) return;
      const tween = gsap.fromTo(
        el,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: 'power3.out',
          duration: 0.9,
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        },
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });
    return () => triggers.forEach((tr) => tr.kill());
  }, []);

  const lines: string[] = t('manifesto.lines', { returnObjects: true }) as string[];

  return (
    <section id="manifesto" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-[1400px]">
        <div className="tag mb-12">{t('manifesto.eyebrow')}</div>
        <div className="space-y-4 md:space-y-6">
          {lines.map((line, i) => (
            <p
              key={i}
              ref={(el) => { lineRefs.current[i] = el; }}
              className={`font-display text-display-md ${i % 2 === 1 ? 'text-plasma' : 'text-[var(--color-fg)]'}`}
              style={{ opacity: 0 }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
