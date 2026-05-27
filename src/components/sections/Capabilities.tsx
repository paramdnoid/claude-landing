import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../../lib/animations';

type Capability = { index: string; title: string; body: string };

export default function Capabilities() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const items = t('capabilities.items', { returnObjects: true }) as Capability[];

  useEffect(() => {
    if (!sectionRef.current) return;
    if (prefersReducedMotion()) {
      itemRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }
    const triggers: ScrollTrigger[] = [];
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const tween = gsap.fromTo(
        el,
        { opacity: 0, y: 80 },
        {
          opacity: 1,
          y: 0,
          ease: 'power3.out',
          duration: 1,
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'top 55%', scrub: 0.6 },
        },
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    });
    return () => triggers.forEach((tr) => tr.kill());
  }, []);

  return (
    <section ref={sectionRef} id="capabilities" className="relative px-6 py-32 md:px-10 md:py-48">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-20 flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="tag mb-4">{t('capabilities.eyebrow')}</div>
            <h2 className="font-display text-display-lg max-w-3xl">{t('capabilities.title')}</h2>
          </div>
          <p className="lead max-w-sm">{t('capabilities.intro')}</p>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {items.map((it, i) => (
            <div
              key={it.index}
              ref={(el) => { itemRefs.current[i] = el; }}
              className="grid grid-cols-12 items-start gap-6 py-12 md:py-16"
            >
              <div className="col-span-12 md:col-span-2"><span className="tag">{it.index}</span></div>
              <div className="col-span-12 md:col-span-5"><h3 className="font-display text-3xl md:text-5xl">{it.title}</h3></div>
              <div className="col-span-12 md:col-span-5"><p className="lead">{it.body}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
