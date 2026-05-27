import 'i18next';
import de from '../locales/de.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof de;
    };
    returnNull: false;
  }
}
