import type { MouseEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../lib/useLocale';
import { scrollToSection } from '../lib/scrollToSection';
import { getLenis } from '../lib/smoothScroll';
import { prefersReducedMotion } from '../lib/animations';
import { SOCIAL_LINKS } from '../lib/socials';
import Signet from './Signet';

const NAV_IDS = ['manifesto', 'work', 'capabilities', 'process', 'contact'] as const;

const LINK_CLASS =
  'link-underline group/link inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg';

export default function Footer() {
  const { t } = useTranslation();
  const locale = useLocale();
  const { pathname } = useLocation();
  const year = new Date().getFullYear();
  const homePath = `/${locale}`;
  const isHome = pathname === homePath || pathname === `${homePath}/`;

  const onAnchor = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id, { duration: 1.0 });
  };

  const scrollTop = () => {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.0 });
    } else {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  };

  return (
    <footer className="relative overflow-hidden bg-bg">
      {/* Plasma accent hairline — the premium divider from the section above. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,var(--color-plasma-lime)_25%,var(--color-plasma-cyan)_50%,var(--color-plasma-indigo)_75%,transparent_100%)] opacity-60"
      />

      <div className="relative mx-auto max-w-400 px-6 py-16 md:px-10 md:py-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-12 md:grid-cols-12 md:gap-8">
          {/* Brand block */}
          <div className="col-span-2 flex flex-col gap-5 md:col-span-5">
            <a
              href={isHome ? '#hero' : homePath}
              onClick={isHome ? (e) => onAnchor(e, 'hero') : undefined}
              aria-label={t('nav.brandLabel')}
              className="group inline-flex w-fit items-center gap-3"
            >
              <Signet
                animated
                className="h-10 w-10 transition-transform duration-500 group-hover:rotate-3 group-hover:scale-110"
              />
              <span className="font-mono text-[11px] uppercase leading-tight tracking-[0.22em]">
                <span className="block text-fg">ZIAN AI CONCEPTS</span>
                <span className="block text-[10px] text-muted">by Andre Zimmermann</span>
              </span>
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-muted">{t('footer.tagline')}</p>
            <div className="glass glass-pill tag inline-flex w-fit items-center gap-2.5 !text-fg/80">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-plasma-lime glow-lime" />
              {t('hero.metaLocation')}
            </div>
          </div>

          {/* Navigation */}
          <nav aria-label={t('footer.navHeading')} className="flex flex-col gap-4 md:col-span-3">
            <div className="tag !text-muted-2">{t('footer.navHeading')}</div>
            <ul className="flex flex-col gap-3">
              {NAV_IDS.map((id) => (
                <li key={id}>
                  {isHome ? (
                    <a href={`#${id}`} onClick={(e) => onAnchor(e, id)} className={LINK_CLASS}>
                      {t(`nav.${id}`)}
                    </a>
                  ) : (
                    <Link to={`${homePath}#${id}`} className={LINK_CLASS}>
                      {t(`nav.${id}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Connect — email + socials */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <div className="tag !text-muted-2">{t('footer.connectHeading')}</div>
            <ul className="flex flex-col gap-3">
              <li>
                <a href={`mailto:${t('contact.email')}`} className={LINK_CLASS}>
                  <span className="break-all">{t('contact.email')}</span>
                </a>
              </li>
              {SOCIAL_LINKS.map(({ key, url }) => (
                <li key={key}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${t(`contact.${key}`)} (${t('contact.opensInNewTab')})`}
                    className={LINK_CLASS}
                  >
                    {t(`contact.${key}`)}
                    <span
                      aria-hidden="true"
                      className="inline-block transition-transform duration-200 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
                    >
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4 md:col-span-2">
            <div className="tag !text-muted-2">{t('footer.legalHeading')}</div>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to={`/${locale}/impressum`} className={LINK_CLASS}>
                  {t('footer.imprint')}
                </Link>
              </li>
              <li>
                <Link to={`/${locale}/datenschutz`} className={LINK_CLASS}>
                  {t('footer.privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col gap-4 border-t border-border pt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-2 md:mt-16 md:flex-row md:items-center md:justify-between">
          <p>© {year} ZIAN AI CONCEPTS · {t('footer.rights')}</p>
          <button
            type="button"
            onClick={scrollTop}
            className="group inline-flex w-fit items-center gap-2 tracking-[0.18em] text-muted transition-colors duration-200 hover:text-fg"
          >
            {t('footer.backToTop')}
            <span
              aria-hidden="true"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border-strong transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-plasma-lime"
            >
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
