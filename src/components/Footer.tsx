import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isLang } from '../lib/lang';

export default function Footer() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const locale = isLang(lang) ? lang : 'de';
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-6 py-12 md:flex-row md:items-end md:justify-between md:px-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2 w-2 rotate-45 bg-[var(--color-plasma-lime)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.22em] leading-tight">
              <span className="block">ZIAN AI CONCEPTS</span>
              <span className="block text-[var(--color-muted)] text-[10px]">by Andre Zimmermann</span>
            </span>
          </div>
          <p className="max-w-sm text-sm text-[var(--color-muted)]">{t('footer.tagline')}</p>
        </div>
        <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em]">
          <div className="flex flex-wrap gap-6">
            <Link to={`/${locale}/impressum`} className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]">
              {t('footer.imprint')}
            </Link>
            <Link to={`/${locale}/datenschutz`} className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]">
              {t('footer.privacy')}
            </Link>
          </div>
          <p className="text-[var(--color-muted-2)]">© {year} ZIAN AI CONCEPTS · {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
