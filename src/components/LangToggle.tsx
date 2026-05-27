import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const LANGS = ['de', 'en'] as const;
type Lang = (typeof LANGS)[number];

export default function LangToggle() {
  const { i18n, t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const current: Lang = i18n.language.startsWith('en') ? 'en' : 'de';

  const switchTo = (next: Lang) => {
    if (next === current && lang === next) return;
    void i18n.changeLanguage(next);

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0 && (segments[0] === 'de' || segments[0] === 'en')) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    const newPath = `/${segments.join('/')}`;
    navigate(`${newPath}${search}${hash}`, { replace: true });
  };

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1 py-1 font-mono text-xs uppercase tracking-widest backdrop-blur"
    >
      {LANGS.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => switchTo(lng)}
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
