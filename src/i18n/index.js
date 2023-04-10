import { createI18n } from "vue-i18n";
import ar from "./locales/ar.json";
import en from "./locales/en.json";
import vi from "./locales/vi.json";

export default createI18n({
  locale: "ar",
  fallbackLocale: "ar",
  legacy: false,
  messages: { ar, en, vi },
  globalInjection: true,
});
