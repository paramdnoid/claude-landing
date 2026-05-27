import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangToggle from './LangToggle';

const NAV_IDS = ['ask', 'about', 'services', 'process', 'techstack', 'contact'] as const;
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
        const top = el.getBoundingClientRect().top;
        if (top - midline <= 0) current = id;
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
      isActive ? 'text-white' : 'text-muted hover:text-white'
    }`;
    const indicator = isActive && (
      <span
        aria-hidden="true"
        className="absolute -bottom-1.5 left-1/2 h-px w-6 -translate-x-1/2 bg-linear-to-r from-accent-cyan to-accent-violet shadow-[0_0_10px_rgba(0,229,255,0.7)]"
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
          ? 'border-b border-white/8 bg-[var(--color-bg)]/65 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.6)]'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white transition-opacity group-hover:opacity-80">
            ZIAN <span className="text-muted">AI CONCEPTS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 font-mono text-xs uppercase tracking-[0.18em] md:flex">
          {navLink('ask', t('nav.ask'))}
          {navLink('about', t('nav.about'))}
          {navLink('services', t('nav.services'))}
          {navLink('process', t('nav.process'))}
          {navLink('techstack', t('nav.techstack'))}
          {navLink('contact', t('nav.contact'))}
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}
