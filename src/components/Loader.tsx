import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../lib/animations';

export default function Loader({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDone(true);
      onDone();
      return;
    }
    const ctx = gsap.context(() => {
      const count = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          setDone(true);
          onDone();
        },
      });
      tl.to(count, {
        v: 100,
        duration: 1.6,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (counterRef.current) counterRef.current.textContent = String(Math.round(count.v)).padStart(3, '0');
          if (barRef.current) barRef.current.style.transform = `scaleX(${count.v / 100})`;
        },
      })
        .to(labelRef.current, { opacity: 0, y: -8, duration: 0.4, ease: 'power2.out' }, '>-0.1')
        .to(rootRef.current, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '+=0.15');
    }, rootRef);
    return () => ctx.revert();
  }, [onDone]);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col justify-between bg-[var(--color-bg)] p-6 md:p-10"
    >
      <div className="flex items-start justify-between">
        <div className="tag flex items-center gap-3">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-plasma-lime)] glow-lime" />
          <span ref={labelRef} className="inline-block">{t('loader.label')}</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
          v0.2 · 2026
        </span>
      </div>

      <div className="flex items-end justify-between gap-6">
        <div className="font-display text-display-xl leading-none text-[var(--color-fg)]">
          <span ref={counterRef}>000</span>
          <span className="text-[var(--color-muted-2)]">/100</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative h-px w-full bg-[var(--color-border)]">
          <div
            ref={barRef}
            className="absolute inset-y-0 left-0 origin-left scale-x-0 bg-plasma"
            style={{ height: '2px', top: '-0.5px' }}
          />
        </div>
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
          <span>{t('loader.composing')}</span>
          <span>WEBGL · GSAP · LENIS</span>
        </div>
      </div>
    </div>
  );
}
