import { useEffect, useState, type RefObject } from 'react';

type ActiveSectionOpts = {
  /** `dataset` key whose value identifies each tracked section. */
  dataKey: string;
  /** Initial value before any intersection update fires. */
  initial?: string;
  /** Vertical "active band" — see {@link IntersectionObserver} rootMargin. */
  rootMargin?: string;
};

/**
 * Track which section in `refs` is currently in the configured viewport band
 * and expose the matching `dataset[dataKey]` value.
 *
 * Replaces the duplicated IntersectionObserver setups previously living in
 * `Capabilities` and `Process`. The first intersecting element in DOM order
 * wins, so behaviour matches the legacy `compareDocumentPosition` sort.
 */
export function useActiveSection(
  refs: RefObject<(HTMLElement | null)[]>,
  opts: ActiveSectionOpts,
): string {
  const { dataKey, initial = '', rootMargin = '-45% 0px -45% 0px' } = opts;
  const [active, setActive] = useState<string>(initial);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = refs.current?.filter((el): el is HTMLElement => el !== null) ?? [];
    if (targets.length === 0) return;

    const visible = new Set<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.add(el);
          else visible.delete(el);
        }
        // Pick the first visible element in DOM order via the original
        // `targets` array; cheaper and more deterministic than re-sorting.
        let next: string | null = null;
        for (const t of targets) {
          if (visible.has(t)) {
            const value = t.dataset[dataKey];
            if (value) {
              next = value;
              break;
            }
          }
        }
        if (next !== null) {
          setActive((prev) => (prev === next ? prev : (next as string)));
        }
      },
      { rootMargin, threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // `refs.current` is the same RefObject across renders; targets are
    // recomputed inside the effect so we don't need refs.current in deps.
  }, [refs, dataKey, rootMargin]);

  return active;
}
