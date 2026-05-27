import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { pinnedTimeline, prefersReducedMotion } from '../../lib/animations';
import { ScrollTrigger } from '../../lib/gsap';

type Step = { index: string; title: string; body: string };

export default function Process() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  const steps = t('process.steps', { returnObjects: true }) as Step[];

  useEffect(() => {
    if (!sectionRef.current || !stageRef.current) return;
    if (prefersReducedMotion()) {
      stepRefs.current.forEach((el) => el && gsap.set(el, { opacity: 1, y: 0 }));
      return;
    }
    const els = stepRefs.current.filter(Boolean) as HTMLDivElement[];
    gsap.set(els, { opacity: 0.05, y: 30, filter: 'blur(8px)' });
    if (els[0]) gsap.set(els[0], { opacity: 1, y: 0, filter: 'blur(0px)' });

    // Defer pin creation by one animation frame. SelectedWork's pin runs in the
    // same React commit and only finalizes its pin-spacer height after layout
    // reflows; measuring the Process stage in the same tick caches a stale
    // documentTop and the pin engages while the user is still in AiDemo above.
    let tl: gsap.core.Timeline | null = null;
    const raf = requestAnimationFrame(() => {
      if (!stageRef.current) return;
      tl = pinnedTimeline(stageRef.current, { end: () => `+=${steps.length * 70}%`, scrub: 1 });
      els.forEach((el, i) => {
        if (i > 0) tl!.to(el, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1 }, i);
        if (i < els.length - 1) tl!.to(el, { opacity: 0.18, y: -30, filter: 'blur(4px)', duration: 1 }, i + 0.8);
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelAnimationFrame(raf);
      tl?.scrollTrigger?.kill();
      tl?.kill();
    };
  }, [steps.length]);

  return (
    <section ref={sectionRef} id="process" className="relative">
      <div className="px-6 pt-32 md:px-10">
        <div className="mx-auto max-w-[1600px]">
          <div className="tag mb-4">{t('process.eyebrow')}</div>
          <h2 className="font-display text-display-lg max-w-3xl">{t('process.title')}</h2>
        </div>
      </div>

      <div ref={stageRef} className="relative h-[100svh] overflow-hidden">
        <div className="mx-auto flex h-full max-w-[1600px] items-center px-6 md:px-10">
          <div className="grid w-full grid-cols-12 gap-8">
            {steps.map((s, i) => (
              <div
                key={s.index}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="col-span-12 col-start-1 row-start-1 grid grid-cols-12 items-end gap-6"
              >
                <div className="col-span-12 md:col-span-2">
                  <span className="font-mono text-sm tracking-widest text-[var(--color-plasma-lime)]">{s.index}</span>
                </div>
                <div className="col-span-12 md:col-span-6">
                  <h3 className="font-display text-display-md">{s.title}</h3>
                </div>
                <div className="col-span-12 md:col-span-4">
                  <p className="lead">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
