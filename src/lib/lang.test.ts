import { describe, it, expect } from 'vitest';
import { isLang, resolveLang, SUPPORTED_LANGS } from './lang';

describe('isLang', () => {
  it('returns true for every entry in SUPPORTED_LANGS', () => {
    for (const lng of SUPPORTED_LANGS) {
      expect(isLang(lng)).toBe(true);
    }
  });

  it.each([
    ['fr', false],
    ['', false],
    ['de-DE', false], // strict — `isLang` checks the exact 2-letter code only
    ['DE', false], // case-sensitive on purpose
    [undefined, false],
    [null, false],
  ] as const)('isLang(%j) === %s', (input, expected) => {
    expect(isLang(input)).toBe(expected);
  });
});

describe('resolveLang', () => {
  it('falls back to de for missing input', () => {
    expect(resolveLang(undefined)).toBe('de');
    expect(resolveLang(null)).toBe('de');
    expect(resolveLang('')).toBe('de');
  });

  it('matches by 2-char prefix', () => {
    expect(resolveLang('de')).toBe('de');
    expect(resolveLang('de-DE')).toBe('de');
    expect(resolveLang('de-CH')).toBe('de');
    expect(resolveLang('en')).toBe('en');
    expect(resolveLang('en-US')).toBe('en');
    expect(resolveLang('en-GB')).toBe('en');
  });

  it('is case-insensitive', () => {
    expect(resolveLang('DE')).toBe('de');
    expect(resolveLang('En-Us')).toBe('en');
  });

  it('falls back to de for unsupported prefixes', () => {
    expect(resolveLang('fr')).toBe('de');
    expect(resolveLang('es-MX')).toBe('de');
    expect(resolveLang('xx')).toBe('de');
  });
});
