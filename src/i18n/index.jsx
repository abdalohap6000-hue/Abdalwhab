import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "./translations";

const STORAGE_KEY = "qalami_ui_lang";
const I18nContext = createContext(null);

function detectLang() {
  if (typeof window === "undefined") return "ar";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ar" || saved === "en") return saved;
  return (navigator.language || "ar").toLowerCase().startsWith("en") ? "en" : "ar";
}

const AR_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(detectLang);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ar" ? "en" : "ar");
  }, [lang, setLang]);

  const t = useCallback(
    (key, vars) => {
      const dict = translations[lang] || translations.ar;
      let str = dict[key] ?? translations.ar[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [lang]
  );

  // تنسيق الأرقام: أرقام عربية في الواجهة العربية، لاتينية في الإنجليزية
  const fmt = useCallback(
    (value) => {
      const s = String(value ?? "");
      if (lang !== "ar") return s;
      return s.replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t, fmt, dir, isRTL: dir === "rtl" }),
    [lang, setLang, toggleLang, t, fmt, dir]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <LanguageProvider>");
  return ctx;
}
