import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap } from 'gsap';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  // Track the pathname we last ran the transition for. Initialised to null so the
  // very first mount never counts as a route change. This is also StrictMode-safe:
  // the dev double-invocation re-runs this effect with the *same* pathname, which
  // still reads as "not a route change", so we never steal focus to #main on the
  // initial load -- keeping the skip link the first element reachable via Tab.
  const lastPathname = useRef<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const isRouteChange = lastPathname.current !== null && lastPathname.current !== pathname;
    lastPathname.current = pathname;

    if (!isRouteChange) {
      // Initial load: clear any leftover transform so it does not create a
      // containing block for fixed children. Do NOT move focus here.
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
