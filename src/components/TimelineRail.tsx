import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Node = { id: string; label: string };

const NODES: Node[] = [
  { id: 'hero', label: '01' },
  { id: 'about', label: '02' },
  { id: 'process', label: '03' },
  { id: 'showcase', label: '04' },
  { id: 'contact', label: '05' },
];

export default function TimelineRail() {
  const { pathname } = useLocation();
  const [active, setActive] = useState<string>('hero');
  const [progress, setProgress] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname !== '/') return;

    const update = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const p = docH > 0 ? window.scrollY / docH : 0;
      setProgress(Math.min(1, Math.max(0, p)));

      let current = NODES[0].id;
      const midline = window.innerHeight * 0.45;
      for (const node of NODES) {
        const el = document.getElementById(node.id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top - midline <= 0) current = node.id;
      }
      setActive(current);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [pathname]);

  if (pathname !== '/') return null;

  return (
    <div
      ref={railRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative flex h-[60vh] w-6 flex-col items-center justify-between">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10" />
        <div
          className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-[var(--color-accent-cyan)] to-[var(--color-accent-violet)] transition-[height] duration-200 ease-out"
          style={{ height: `${progress * 100}%` }}
        />
        {NODES.map((node) => {
          const isActive = active === node.id;
          return (
            <a
              key={node.id}
              href={`#${node.id}`}
              className="pointer-events-auto group relative flex items-center"
            >
              <span
                className={`relative z-10 h-2.5 w-2.5 rounded-full border transition-all ${
                  isActive
                    ? 'border-transparent bg-white shadow-[0_0_18px_rgba(0,229,255,0.7)]'
                    : 'border-white/30 bg-[var(--color-bg)]'
                }`}
              />
              <span
                className={`absolute left-6 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.2em] transition-opacity ${
                  isActive ? 'text-white opacity-100' : 'text-[var(--color-muted-2)] opacity-0 group-hover:opacity-100'
                }`}
              >
                {node.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
