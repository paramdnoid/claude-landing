import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getConsent, setConsent, onConsentChange } from './consent';

describe('consent', () => {
  beforeEach(() => {
    window.localStorage.removeItem('zian.consent.v1');
  });

  describe('getConsent', () => {
    it('returns null when nothing is stored', () => {
      expect(getConsent()).toBeNull();
    });

    it("returns 'accepted' when stored", () => {
      window.localStorage.setItem('zian.consent.v1', 'accepted');
      expect(getConsent()).toBe('accepted');
    });

    it("returns 'rejected' when stored", () => {
      window.localStorage.setItem('zian.consent.v1', 'rejected');
      expect(getConsent()).toBe('rejected');
    });

    it('returns null for unknown values (forward-compat guard)', () => {
      window.localStorage.setItem('zian.consent.v1', 'maybe');
      expect(getConsent()).toBeNull();
    });

    it('survives localStorage throwing (e.g. Safari private mode)', () => {
      const spy = vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError');
      });
      expect(getConsent()).toBeNull();
      spy.mockRestore();
    });
  });

  describe('setConsent', () => {
    it('persists the value and dispatches a consentchange event', () => {
      const handler = vi.fn();
      window.addEventListener('consentchange', handler);
      setConsent('accepted');
      expect(window.localStorage.getItem('zian.consent.v1')).toBe('accepted');
      expect(handler).toHaveBeenCalledTimes(1);
      const evt = handler.mock.calls[0]?.[0] as CustomEvent<'accepted' | 'rejected'>;
      expect(evt.detail).toBe('accepted');
      window.removeEventListener('consentchange', handler);
    });
  });

  describe('onConsentChange', () => {
    it('invokes the callback with the detail of dispatched events', () => {
      const cb = vi.fn();
      const off = onConsentChange(cb);
      setConsent('rejected');
      expect(cb).toHaveBeenCalledWith('rejected');
      off();
    });

    it('returns an unsubscribe function that stops further invocations', () => {
      const cb = vi.fn();
      const off = onConsentChange(cb);
      off();
      setConsent('accepted');
      expect(cb).not.toHaveBeenCalled();
    });
  });
});
