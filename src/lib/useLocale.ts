import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isLang, resolveLang, type Lang } from './lang';

/**
 * Resolve the active locale from the `:lang` URL segment when present and
 * valid, otherwise fall back to the i18next language. Centralises the
 * `useParams<{ lang: string }>()` + `isLang(...)` boilerplate that previously
 * lived in Header, Footer, LangToggle, CookieBanner, Impressum, Datenschutz,
 * Seo and Connect.
 */
export function useLocale(): Lang {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  if (isLang(lang)) return lang;
  return resolveLang(i18n.language);
}
