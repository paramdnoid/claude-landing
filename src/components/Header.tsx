import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangToggle from './LangToggle';
import BrandMark from './BrandMark';
import { scrollToSection } from '../lib/scrollToSection';
import { useLocale } from '../lib/useLocale';

const NAV_IDS = ['manifesto', 'work', 'capabilities', 'process', 'contact'] as const;
type NavId = (typeof NAV_IDS)[number];

export default function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const locale = useLocale();
  const homePath = `/${locale}`;
  const isHome = pathname === homePath || pathname === `${homePath}/`;
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<NavId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Defensive: close the menu on any route change (brand link, mobile menu
  // anchors to other pages). Anchor clicks already close via onAnchorClick.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sections = NAV_IDS
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((s): s is { id: NavId; el: HTMLElement } => s.el !== null);
    if (sections.length === 0) return;

    const visible = new Map<NavId, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id as NavId;
          if (entry.isIntersecting) visible.set(id, entry.intersectionRatio);
          else visible.delete(id);
        }
        let topId: NavId | null = null;
        for (const { id } of sections) {
          if (visible.has(id)) { topId = id; break; }
        }
        setActive((prev) => (prev === topId ? prev : topId));
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s.el));
    return () => observer.disconnect();
  }, [isHome]);

  const onAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: NavId) => {
    e.preventDefault();
    scrollToSection(id);
    setMenuOpen(false);
  };

  const navLink = (id: NavId, label: string) => {
    const isActive = isHome && active === id;
    const cls = `relative transition-colors duration-300 ${
      isActive ? 'text-[var(--color-fg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
    }`;
    const indicator = isActive && (
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--color-plasma-lime)] glow-lime"
      />
    );
    return isHome ? (
      <a
        href={`#${id}`}
        className={cls}
        aria-current={isActive ? 'true' : undefined}
        onClick={(e) => onAnchorClick(e, id)}
      >
        <span className="relative">{label}{indicator}</span>
      </a>
    ) : (
      <Link to={`${homePath}#${id}`} className={cls} aria-current={isActive ? 'true' : undefined}>
        <span className="relative">{label}{indicator}</span>
      </Link>
    );
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/75 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link to={homePath} className="group flex items-center gap-3" aria-label={t('nav.brandLabel')}>
          <BrandMark variant="header" />
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] md:flex">
          {navLink('manifesto', t('nav.manifesto'))}
          {navLink('work', t('nav.work'))}
          {navLink('capabilities', t('nav.capabilities'))}
          {navLink('process', t('nav.process'))}
          {navLink('contact', t('nav.contact'))}
        </nav>
        <div className="flex items-center gap-2">
          <LangToggle />
          <button
            type="button"
            aria-label={t('nav.menu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--color-fg)] md:hidden"
          >
            <span aria-hidden="true" className="relative flex h-3 w-4 flex-col justify-between">
              <span className={`block h-0.5 w-full bg-current transition-transform duration-300 ${menuOpen ? 'translate-y-[5px] rotate-45' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-full bg-current transition-transform duration-300 ${menuOpen ? '-translate-y-[5px] -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        aria-label={t('nav.menu')}
        aria-hidden={!menuOpen}
        inert={!menuOpen || undefined}
        className={`md:hidden grid border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 backdrop-blur-xl transition-[grid-template-rows,opacity] duration-300 ${menuOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="flex flex-col gap-1 px-6 py-4 font-mono text-sm uppercase tracking-[0.18em]">
            {NAV_IDS.map((id) => (
              <li key={id}>
                {isHome ? (
                  <a
                    href={`#${id}`}
                    className="block py-2 text-[var(--color-fg)]"
                    onClick={(e) => onAnchorClick(e, id)}
                  >
                    {t(`nav.${id}`)}
                  </a>
                ) : (
                  <Link to={`${homePath}#${id}`} className="block py-2 text-[var(--color-fg)]">
                    {t(`nav.${id}`)}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
