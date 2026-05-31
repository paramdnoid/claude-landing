import { useEffect, useState } from 'react';

const SECTIONS = ['manifesto', 'work', 'capabilities', 'process', 'contact'] as const;

/**
 * Fixed right-edge section rail — a persistent piece of art-direction that
 * doubles as a scroll-position through-line. Purely decorative (aria-hidden,
 * pointer-events-none) so it never intercepts clicks over the content beneath;
 * the header nav remains the real, accessible navigation. The active section's
 * tick lights up plasma-lime; the rest are quiet hairlines in the page gutter.
 */
export default function SectionRail() {
  const [active, setActive] = useState<string>('');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (els.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        let next = '';
        for (const id of SECTIONS) {
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
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-5 lg:flex"
    >
      {SECTIONS.map((id) => {
        const isActive = active === id;
        return (
          <span
            key={id}
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
