import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { EASE, DUR } from './animations';

export function useMagnet<T extends HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Promote once up front so the first pointer move doesn't trigger a
    // layer-creation hitch mid-animation.
    gsap.set(el, { willChange: 'transform' });

    const xTo = gsap.quickTo(el, 'x', { duration: DUR.slow, ease: EASE.out });
    const yTo = gsap.quickTo(el, 'y', { duration: DUR.slow, ease: EASE.out });

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      xTo(dx * strength);
      yTo(dy * strength);
    };

    const onLeave = () => {
      xTo(0);
      yTo(0);
    };

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      // Reset the magnet offset and drop the layer hint so a remount starts clean.
      gsap.set(el, { x: 0, y: 0, clearProps: 'willChange' });
    };
  }, [strength]);

  return ref;
}
