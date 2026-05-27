import { useTranslation } from 'react-i18next';

const LANGS = ['de', 'en'] as const;

export default function LangToggle() {
  const { i18n, t } = useTranslation();
  const current = i18n.language.startsWith('en') ? 'en' : 'de';

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/3 px-1 py-1 font-mono text-xs uppercase tracking-widest backdrop-blur"
    >
      {LANGS.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => void i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              active
                ? 'bg-white text-[var(--color-bg)]'
                : 'text-muted hover:text-white'
            }`}
          >
            {lng}
          </button>
        );
      })}
    </div>
  );
}
