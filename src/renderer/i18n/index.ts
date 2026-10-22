import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import zhHans from './zh-Hans.json';
import ko from './ko.json';
import ja from './ja.json';
import es from './es.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      'zh-Hans': { translation: zhHans },
      zh: { translation: zhHans },
      ko: { translation: ko },
      ja: { translation: ja },
      es: { translation: es },
    },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sw_language',
      caches: ['localStorage'],
    },
  });

export default i18n;
