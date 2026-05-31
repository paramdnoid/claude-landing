import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

type CursorMode = 'default' | 'interactive' | 'label';

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    document.documentElement.classList.add('has-custom-cursor');

    let firstMove = true;
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const labelX = gsap.quickTo(label, 'x', { duration: 0.45, ease: 'power3' });
    const labelY = gsap.quickTo(label, 'y', { duration: 0.45, ease: 'power3' });

    let mode: CursorMode = 'default';

    const onMove = (e: PointerEvent) => {
      if (firstMove) {
        firstMove = false;
        gsap.set([dot, ring, label], { x: e.clientX, y: e.clientY });
        gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
      labelX(e.clientX);
      labelY(e.clientY);
    };

    const applyMode = (next: CursorMode, labelText: string) => {
      if (next === mode) return;
      mode = next;

      gsap.to(ring, {
        scale: next === 'label' ? 2.6 : next === 'interactive' ? 1.8 : 1,
        borderColor:
          next === 'default' ? 'rgba(255,255,255,0.35)' : 'rgba(0,229,255,0.9)',
        duration: 0.3,
        ease: 'power3.out',
      });
      gsap.to(dot, {
        scale: next === 'default' ? 1 : 0,
        duration: 0.2,
        ease: 'power3.out',
      });

      if (next === 'label') {
        label.textContent = labelText;
        gsap.to(label, { opacity: 1, scale: 1, duration: 0.25, ease: 'power3.out' });
      } else {
        gsap.to(label, { opacity: 0, scale: 0.8, duration: 0.2, ease: 'power3.out' });
      }
    };

    const onOver = (e: Event) => {
      const t = e.target as Element | null;
      if (!t) return;
      const labelled = t.closest<HTMLElement>('[data-cursor-label]');
      if (labelled) {
        applyMode('label', labelled.dataset.cursorLabel ?? '');
        return;
      }
      const interactive = !!t.closest('a, button, input, textarea, [data-cursor]');
      applyMode(interactive ? 'interactive' : 'default', '');
    };

    const onLeave = () => {
      gsap.to([dot, ring, label], { opacity: 0, duration: 0.2 });
    };
    const onEnter = () => {
      gsap.to([dot, ring], { opacity: 1, duration: 0.2 });
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, true);
    // `pointerenter` / `pointerleave` don't bubble — bind on documentElement
    // so they fire when the cursor crosses the viewport edge.
    document.documentElement.addEventListener('pointerleave', onLeave);
    document.documentElement.addEventListener('pointerenter', onEnter);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver, true);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.documentElement.removeEventListener('pointerenter', onEnter);
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden="true"
        className="custom-cursor-ring pointer-events-none fixed left-0 top-0 z-100 hidden h-9 w-9 opacity-0 -translate-x-1/2 -translate-y-1/2 rounded-full border lg:block"
        style={{ borderColor: 'rgba(255,255,255,0.35)', mixBlendMode: 'difference' }}
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className="custom-cursor-dot pointer-events-none fixed left-0 top-0 z-100 hidden h-1.5 w-1.5 opacity-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white lg:block"
      />
      <div
        ref={labelRef}
        aria-hidden="true"
        className="custom-cursor-label font-mono pointer-events-none fixed left-0 top-0 z-100 hidden -translate-x-1/2 -translate-y-1/2 rounded-full bg-plasma-lime px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-bg opacity-0 lg:block"
        style={{ scale: 0.8 }}
      />
    </>
  );
}
