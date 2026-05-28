/**
 * Node 25 + jsdom 29 + Vitest 4 ship a plain `{}` as `window.localStorage`
 * instead of a Storage instance. Provide a Map-backed shim with the full
 * Storage interface so the consent module behaves as in a real browser.
 */
function makeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? (store.get(key) as string) : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'sessionStorage', {
    value: makeStorage(),
    writable: true,
    configurable: true,
  });
}
