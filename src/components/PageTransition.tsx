import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const isFirst = useRef(true);

  useEffect(() => {
    if (!ref.current) return;

    if (isFirst.current) {
      isFirst.current = false;
      // Make sure no leftover transform creates a containing block for fixed children.
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(ref.current, { clearProps: 'transform,translate,rotate,scale,willChange,opacity' });
      }
      return;
    }

    // Move keyboard / SR focus to main content on route change (WCAG 2.4.3).
    document.getElementById('main')?.focus();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        clearProps: 'transform,translate,rotate,scale,willChange',
      },
    );
  }, [pathname]);

  return (
    <div ref={ref} key={pathname}>
      {children}
    </div>
  );
}
