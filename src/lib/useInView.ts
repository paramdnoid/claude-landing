import { useEffect, useRef, useState, type RefObject } from 'react';

type Options = {
  /** Margin around the root, e.g. '200px' to pre-warm before the element enters. */
  rootMargin?: string;
  /** Initial value before the observer reports — defaults to `true` so content is
   *  never suppressed on first paint or where IntersectionObserver is unavailable. */
  initial?: boolean;
};

/**
 * Reports whether the referenced element is intersecting the viewport.
 *
 * Used to pause expensive work (e.g. a WebGL render loop) while a section is
 * scrolled out of view. SSR-safe and degrades to `initial` when
 * IntersectionObserver is unavailable.
 */
export function useInView<T extends Element>(
  opts: Options = {},
): { ref: RefObject<T | null>; inView: boolean } {
  const { rootMargin = '0px', initial = true } = opts;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState<boolean>(initial);

  useEffect(() => {
    const el = ref.current;
    if (el === null || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry?.isIntersecting ?? false),
      { rootMargin, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
