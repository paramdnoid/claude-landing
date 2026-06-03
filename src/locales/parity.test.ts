import { describe, it, expect } from 'vitest';
import de from './de.json';
import en from './en.json';

/**
 * Guards against silent drift between the two locale files: a key added to one
 * locale but not the other, an array whose length differs, or an interpolation
 * variable that exists in one language's string but not the other. Runs as part
 * of `npm test`, so CI fails fast instead of shipping a half-translated key.
 */

type FlatLeaves = Record<string, string>;

function flatten(value: unknown, prefix = '', out: FlatLeaves = {}): FlatLeaves {
  if (Array.isArray(value)) {
    value.forEach((entry, i) => flatten(entry, `${prefix}[${i}]`, out));
  } else if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
  } else {
    out[prefix] = typeof value === 'string' ? value : String(value);
  }
  return out;
}

const INTERPOLATION = /\{\{(\w+)\}\}/g;
function interpolationVars(source: string): string {
  return [...source.matchAll(INTERPOLATION)].map((m) => m[1]).sort().join(',');
}

const deLeaves = flatten(de);
const enLeaves = flatten(en);

describe('locale parity (de ⇄ en)', () => {
  it('exposes the identical set of key paths in both locales', () => {
    expect(Object.keys(enLeaves).sort()).toEqual(Object.keys(deLeaves).sort());
  });

  it('uses the same interpolation variables for every shared key', () => {
    const mismatches = Object.entries(deLeaves)
      .filter(([key]) => key in enLeaves)
      .filter(([key, deValue]) => interpolationVars(deValue) !== interpolationVars(enLeaves[key] ?? ''))
      .map(([key, deValue]) => `${key}: de{${interpolationVars(deValue)}} en{${interpolationVars(enLeaves[key] ?? '')}}`);
    expect(mismatches).toEqual([]);
  });
});
