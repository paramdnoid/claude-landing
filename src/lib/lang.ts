export const SUPPORTED_LANGS = ['de', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

const SUPPORTED_SET: ReadonlySet<string> = new Set(SUPPORTED_LANGS);
const DEFAULT_LANG: Lang = 'de';

/** Type guard for {@link Lang}. Add a locale once in {@link SUPPORTED_LANGS} — both
 * `isLang` and `resolveLang` track it automatically. */
export function isLang(value: string | undefined | null): value is Lang {
  return typeof value === 'string' && SUPPORTED_SET.has(value);
}

/**
 * Resolve the active locale from an arbitrary BCP-47-ish string (e.g.
 * `i18n.language` or `navigator.language`). Matches by the 2-char prefix,
 * defaults to {@link DEFAULT_LANG}.
 */
export function resolveLang(input: string | undefined | null): Lang {
  if (!input) return DEFAULT_LANG;
  const prefix = input.toLowerCase().slice(0, 2);
  return SUPPORTED_SET.has(prefix) ? (prefix as Lang) : DEFAULT_LANG;
}
