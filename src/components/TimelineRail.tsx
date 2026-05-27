import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass,
  User,
  Layers,
  GitBranch,
  Cpu,
  Send,
  CircleDot,
} from 'lucide-react';

type Node = {
  id: string;
  index: string;
  key: 'overview' | 'about' | 'services' | 'process' | 'techstack' | 'contact';
  Icon: typeof Compass;
};

const NODES: Node[] = [
  { id: 'hero', index: '01', key: 'overview', Icon: Compass },
  { id: 'about', index: '02', key: 'about', Icon: User },
  { id: 'services', index: '03', key: 'services', Icon: Layers },
  { id: 'process', index: '04', key: 'process', Icon: GitBranch },
  { id: 'techstack', index: '05', key: 'techstack', Icon: Cpu },
  { id: 'contact', index: '06', key: 'contact', Icon: Send },
];

export default function TimelineRail() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [active, setActive] = useState<string>('hero');
  const [progress, setProgress] = useState(0);

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

  const pct = Math.round(progress * 100);

  return (
    <aside
      aria-label={t('sidebar.aria')}
      className="pointer-events-none fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 lg:block"
    >
      <div className="pointer-events-auto relative w-[232px] overflow-hidden rounded-2xl border border-white/7 bg-bg-elev/70 p-3 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),0_1px_0_0_rgba(255,255,255,0.04)_inset] backdrop-blur-xl">
        {/* soft inner glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
          style={{
            background:
              'radial-gradient(220px 140px at 10% 0%, rgba(0,229,255,0.10), transparent 70%), radial-gradient(220px 180px at 90% 100%, rgba(168,85,247,0.10), transparent 70%)',
          }}
        />

        {/* Header / brand-row */}
        <div className="relative flex items-center justify-between px-2 pb-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
              {t('sidebar.availability')}
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
            v1
          </span>
        </div>

        {/* Section label */}
        <div className="relative flex items-center gap-2 px-2 pb-2">
          <span className="h-px flex-1 bg-white/[0.06]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-white/30">
            {t('sidebar.navLabel')}
          </span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>

        {/* Nav */}
        <nav className="relative flex flex-col gap-0.5">
          {NODES.map((node) => {
            const isActive = active === node.id;
            const Icon = node.Icon;
            return (
              <a
                key={node.id}
                href={`#${node.id}`}
                aria-current={isActive ? 'true' : undefined}
                className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-muted hover:text-white'
                }`}
              >
                {/* Active background glow */}
                {isActive && (
                  <>
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 rounded-lg bg-linear-to-r from-white/[0.06] to-transparent"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-linear-to-b from-accent-cyan to-accent-violet shadow-[0_0_10px_rgba(0,229,255,0.7)]"
                    />
                  </>
                )}

                <span
                  className={`relative grid h-7 w-7 place-items-center rounded-md border transition-colors ${
                    isActive
                      ? 'border-white/15 bg-white/4 text-white'
                      : 'border-white/6 bg-white/2 text-white/55 group-hover:border-white/15 group-hover:text-white/85'
                  }`}
                >
                  <Icon size={13} strokeWidth={1.75} aria-hidden="true" />
                </span>

                <span className="relative flex flex-1 items-baseline justify-between">
                  <span className="font-medium tracking-[-0.005em]">
                    {t(`sidebar.items.${node.key}`)}
                  </span>
                  <span
                    className={`font-mono text-[9px] uppercase tracking-[0.2em] transition-colors ${
                      isActive ? 'text-accent-cyan' : 'text-white/25'
                    }`}
                  >
                    {node.index}
                  </span>
                </span>
              </a>
            );
          })}
        </nav>

        {/* Progress block */}
        <div className="relative mt-3 rounded-lg border border-white/6 bg-black/30 p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/40">
              {t('sidebar.progress')}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-white/80">
              {String(pct).padStart(2, '0')}%
            </span>
          </div>
          <div className="relative mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-linear-to-r from-accent-cyan to-accent-violet shadow-[0_0_10px_rgba(0,229,255,0.6)]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Status footer */}
        <div className="relative mt-2 flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/1.5 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md border border-white/10 bg-white/4">
              <CircleDot size={11} strokeWidth={1.75} className="text-accent-cyan" aria-hidden="true" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-white/85">Andre Z.</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                {t('sidebar.role')}
              </span>
            </div>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-emerald-300/80">
            {t('sidebar.online')}
          </span>
        </div>
      </div>
    </aside>
  );
}
