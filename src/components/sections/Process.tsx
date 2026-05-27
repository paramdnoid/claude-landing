import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/animations';

type Step = { index: string; title: string; body: string };

export default function Process() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = t('process.steps', { returnObjects: true }) as Step[];

  useEffect(() => {
    if (prefersReducedMotion()) {
      stepRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }

    const triggers: ScrollTrigger[] = [];

    stepRefs.current.forEach((el, i) => {
      if (el === null) return;
      const tween = gsap.fromTo(
        el,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          delay: i * 0.05,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        },
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });

    return () => triggers.forEach((tr) => tr.kill());
  }, [steps.length]);

  return (
    <section ref={sectionRef} id="process" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-20 md:mb-28">
          <div className="tag mb-4">{t('process.eyebrow')}</div>
          <h2 className="font-display text-display-lg max-w-3xl">{t('process.title')}</h2>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {steps.map((s, i) => (
            <div
              key={s.index}
              ref={(el) => { stepRefs.current[i] = el; }}
              className="grid grid-cols-12 items-start gap-x-6 gap-y-4 py-16 md:py-20"
            >
              <div className="col-span-2 md:col-span-1 pt-1">
                <span className="font-mono text-xs tracking-widest text-[var(--color-plasma-lime)]">
                  {s.index}
                </span>
              </div>

              <div className="col-span-10 md:col-span-5">
                <h3 className="font-display text-display-md">{s.title}</h3>
              </div>

              <div className="col-span-12 md:col-span-6 md:col-start-7">
                <p className="lead">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
