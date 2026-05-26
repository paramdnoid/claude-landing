import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Datenschutz() {
  const { t } = useTranslation();
  return (
    <section className="mx-auto max-w-3xl px-6 py-32 lg:px-10">
      <Link
        to="/"
        className="mb-10 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-[var(--color-muted)] transition-colors hover:text-white"
      >
        <ArrowLeft size={14} /> Home
      </Link>
      <h1 className="font-display text-4xl text-white md:text-5xl">{t('privacy.title')}</h1>
      <p className="mt-6 text-[var(--color-muted)]">{t('privacy.body')}</p>
    </section>
  );
}
