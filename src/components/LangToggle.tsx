import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SUPPORTED_LANGS, isLang, resolveLang, type Lang } from '../lib/lang';

export default function LangToggle() {
  const { i18n, t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();
  const current: Lang = resolveLang(i18n.language);

  const switchTo = (next: Lang) => {
    if (next === current && lang === next) return;
    void i18n.changeLanguage(next);

    const segments = pathname.split('/').filter(Boolean);
    if (isLang(segments[0])) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    void navigate(`/${segments.join('/')}${search}${hash}`, { replace: true });
  };

  return (
    <div
      role="group"
      aria-label={t('nav.language')}
      className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-1 py-1 font-mono text-xs uppercase tracking-widest backdrop-blur"
    >
      {SUPPORTED_LANGS.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => switchTo(lng)}
            aria-pressed={active}
            className={`relative rounded-full px-2.5 py-1 transition-colors after:absolute after:-inset-y-2.5 after:inset-x-0 after:content-[''] ${
              active
                ? 'bg-white text-bg'
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
