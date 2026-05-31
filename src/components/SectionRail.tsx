import { useEffect, useState } from 'react';
import { SECTION_IDS, type SectionId } from '../lib/sections';

/**
 * Fixed right-edge section rail -- a persistent piece of art-direction that
 * doubles as a scroll-position through-line. Purely decorative (aria-hidden,
 * pointer-events-none) so it never intercepts clicks over the content beneath;
 * the header nav remains the real, accessible navigation. The active section's
 * tick lights up plasma-lime; the rest are quiet hairlines in the page gutter.
 *
 * Section ids come from the shared {@link SECTION_IDS} list so the rail and the
 * header nav stay in lockstep.
 */
export default function SectionRail() {
  const [active, setActive] = useState<SectionId | ''>('');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );

    // Dev-only signal: a missing element means its tick can never activate
    // (e.g. a section was renamed/removed without updating SECTION_IDS).
    if (import.meta.env.DEV && els.length !== SECTION_IDS.length) {
      const missing = SECTION_IDS.filter((id) => !document.getElementById(id));
      console.warn(
        `[SectionRail] No element found for section id(s): ${missing.join(', ')}. ` +
          'Those rail ticks will never activate -- check that SECTION_IDS matches ' +
          'the rendered section anchors.',
      );
    }

    if (els.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // Pick the first section (in document order) currently in the band.
        let next: SectionId | '' = '';
        for (const id of SECTION_IDS) {
          if (visible.has(id)) {
            next = id;
            break;
          }
        }
        setActive((prev) => (prev === next ? prev : next));
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <aside
      aria-hidden="true"
      data-testid="section-rail"
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex"
    >
      {SECTION_IDS.map((id) => {
        const isActive = active === id;
        return (
          <span
            key={id}
            data-rail-tick={id}
            data-active={isActive}
            className={`block h-px rounded-full transition-all duration-500 ${
              isActive
                ? 'w-8 bg-plasma-lime shadow-[var(--shadow-glow-lime)]'
                : 'w-4 bg-muted/40'
            }`}
          />
        );
      })}
    </aside>
  );
}
