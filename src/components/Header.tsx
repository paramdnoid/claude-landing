import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LangToggle from './LangToggle';

export default function Header() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLink = (id: string, label: string) =>
    pathname === '/' ? (
      <a
        href={`#${id}`}
        className="text-[var(--color-muted)] transition-colors hover:text-white"
      >
        {label}
      </a>
    ) : (
      <Link to={`/#${id}`} className="text-[var(--color-muted)] transition-colors hover:text-white">
        {label}
      </Link>
    );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'border-b border-white/5 bg-[var(--color-bg)]/70 backdrop-blur-xl'
          : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src="/logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white transition-opacity group-hover:opacity-80">
            ZIAN <span className="text-[var(--color-muted)]">AI CONCEPTS</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-[0.18em] md:flex">
          {navLink('about', t('nav.about'))}
          {navLink('process', t('nav.process'))}
          {navLink('showcase', t('nav.showcase'))}
          {navLink('contact', t('nav.contact'))}
        </nav>
        <LangToggle />
      </div>
    </header>
  );
}
