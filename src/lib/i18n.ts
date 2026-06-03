import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import de from '../locales/de.json';
import en from '../locales/en.json';
import { SUPPORTED_LANGS, DEFAULT_LANG } from './lang';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: DEFAULT_LANG,
    supportedLngs: SUPPORTED_LANGS,
    // Strip BCP-47 region suffixes (e.g. de-DE → de) before lookup so a detected
    // regional locale resolves directly instead of cycling through fallback.
    load: 'languageOnly',
    returnNull: false,
    // Resources are bundled and init is synchronous, so translations are ready
    // on first render. Declaring this explicitly keeps first paint safe if an
    // async backend is ever added without a Suspense boundary.
    react: { useSuspense: false },
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'zian.lang',
      caches: ['localStorage'],
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
