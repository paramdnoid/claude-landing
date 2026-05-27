import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangToggle from './LangToggle';

const NAV_IDS = ['manifesto', 'work', 'capabilities', 'process', 'contact'] as const;
type NavId = (typeof NAV_IDS)[number];

export default function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<NavId | null>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      if (pathname !== '/') return;
      const midline = window.innerHeight * 0.35;
      let current: NavId | null = null;
      for (const id of NAV_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - midline <= 0) current = id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  const navLink = (id: NavId, label: string) => {
    const isActive = active === id;
    const cls = `relative transition-colors duration-300 ${
      isActive ? 'text-[var(--color-fg)]' : 'text-[var(--color-muted)] hover:text-[var(--color-fg)]'
    }`;
    const indicator = isActive && (
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--color-plasma-lime)] glow-lime"
      />
    );
    return pathname === '/' ? (
      <a href={`#${id}`} className={cls}>
        <span className="relative">{label}{indicator}</span>
      </a>
    ) : (
      <Link to={`/#${id}`} className={cls}>
        <span className="relative">{label}{indicator}</span>
      </Link>
    );
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
        scrolled
          ? 'border-b border-[var(--color-border)] bg-[var(--color-bg)]/65 backdrop-blur-2xl backdrop-saturate-150'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link to="/" className="group flex items-center gap-3" aria-label="ZIAN — Andre Zimmermann">
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width="28"
            height="28"
            className="block h-7 w-7 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            style={{ filter: 'drop-shadow(0 0 12px rgba(163, 255, 18, 0.35))' }}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-fg)]">
            ANDRE <span className="text-[var(--color-muted)]">ZIMMERMANN</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] md:flex">
          {navLink('manifesto', t('nav.manifesto'))}
          {navLink('work', t('nav.work'))}
          {navLink('capabilities', t('nav.capabilities'))}
          {navLink('process', t('nav.process'))}
          {navLink('contact', t('nav.contact'))}
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}
