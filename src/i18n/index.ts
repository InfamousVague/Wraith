/**
 * i18n Configuration
 *
 * Internationalization setup using react-i18next.
 * Supports English and Korean with localStorage persistence.
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en";
import ko from "./locales/ko";

const STORAGE_KEY = "wraith-language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en,
      ko,
    },
    fallbackLng: "en",
    defaultNS: "common",
    ns: [
      "common",
      "navigation",
      "auth",
      "settings",
      "dashboard",
      "assetDetail",
      "components",
    ],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    react: {
      useSuspense: false, // Synchronous rendering
    },
  });

export default i18n;
export { STORAGE_KEY };
