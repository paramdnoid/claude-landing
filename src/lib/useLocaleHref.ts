import { useParams } from 'react-router-dom';

const SUPPORTED_LANGS = ['de', 'en'] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

function isLang(value: string | undefined): value is Lang {
  return value === 'de' || value === 'en';
}

/**
 * Returns a locale-prefixed path for the current `:lang` route param.
 *
 * - Hash-only paths (e.g. `#contact`) are passed through unchanged.
 * - Other paths are normalized to start with `/`, then prefixed with the
 *   active locale, falling back to `de` when no locale is in the URL.
 */
export function useLocaleHref(path: string): string {
  const { lang } = useParams<{ lang: string }>();
  const locale: Lang = isLang(lang) ? lang : 'de';
  if (path.startsWith('#')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized === '/' ? `/${locale}` : `/${locale}${normalized}`;
}
