const KEY = 'zian.consent.v1';

export type Consent = 'accepted' | 'rejected';

export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'accepted' || v === 'rejected' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Consent) {
  try {
    window.localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent('consentchange', { detail: v }));
  } catch {
    /* ignore */
  }
}

export function onConsentChange(cb: (v: Consent) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<Consent>).detail);
  window.addEventListener('consentchange', handler);
  return () => window.removeEventListener('consentchange', handler);
}
