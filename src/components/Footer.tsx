import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-accent-cyan/40 to-transparent"
      />
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:justify-between lg:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" className="h-7 w-7" aria-hidden="true" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]">
              ZIAN <span className="text-muted">AI CONCEPTS</span>
            </span>
          </div>
          <p className="max-w-sm text-sm text-muted">{t('footer.tagline')}</p>
        </div>
        <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em]">
          <div className="flex flex-wrap gap-6">
            <Link to="/impressum" className="text-muted transition-colors hover:text-white">
              {t('footer.imprint')}
            </Link>
            <Link to="/datenschutz" className="text-muted transition-colors hover:text-white">
              {t('footer.privacy')}
            </Link>
          </div>
          <p className="text-muted-2">
            © {year} ZIAN AI CONCEPTS · {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
