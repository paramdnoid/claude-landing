import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../lib/useLocale';
import BrandMark from './BrandMark';

export default function Footer() {
  const { t } = useTranslation();
  const locale = useLocale();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border">
      <div className="mx-auto flex max-w-400 flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <BrandMark variant="footer" />
          </div>
          <p className="max-w-sm text-sm text-muted">{t('footer.tagline')}</p>
        </div>
        <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em]">
          <div className="flex flex-wrap gap-6">
            <Link to={`/${locale}/impressum`} className="text-muted transition-colors hover:text-fg">
              {t('footer.imprint')}
            </Link>
            <Link to={`/${locale}/datenschutz`} className="text-muted transition-colors hover:text-fg">
              {t('footer.privacy')}
            </Link>
          </div>
          <p className="text-muted-2">© {year} ZIAN AI CONCEPTS · {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
