import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLocale } from '../lib/useLocale';

export default function Impressum() {
  const { t } = useTranslation();
  const locale = useLocale();
  return (
    <section className="mx-auto max-w-3xl px-6 py-32 lg:px-10">
      <Link
        to={`/${locale}`}
        className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={14} /> {t('nav.home')}
      </Link>
      <h1 className="font-display text-4xl text-white md:text-5xl">{t('imprint.title')}</h1>
      <div className="mt-6 flex flex-col gap-4 text-muted">
        {t('imprint.body').split(/\n\n+/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </section>
  );
}
