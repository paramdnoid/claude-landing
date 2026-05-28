export const SUPPORTED_LANGS = ['de', 'en'] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export function isLang(value: string | undefined | null): value is Lang {
  return value === 'de' || value === 'en';
}

/**
 * Resolve the active locale from an arbitrary BCP-47-ish string (e.g.
 * `i18n.language` or `navigator.language`). Defaults to `de`.
 */
export function resolveLang(input: string | undefined | null): Lang {
  if (!input) return 'de';
  const lower = input.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  if (lower.startsWith('de')) return 'de';
  return 'de';
}
