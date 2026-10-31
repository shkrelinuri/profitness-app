"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { translate, type Language, type TranslationKey } from "@/lib/translations";

const STORAGE_KEY = "lotus-language";
const languageListeners = new Set<() => void>();

function subscribeToLanguage(listener: () => void) {
  languageListeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    languageListeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function getStoredLanguage(): Language {
  return window.localStorage.getItem(STORAGE_KEY) === "sq" ? "sq" : "en";
}

function getServerLanguage(): Language {
  return "en";
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getStoredLanguage,
    getServerLanguage,
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    languageListeners.forEach((listener) => listener());
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translate(language, key),
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return value;
}

export function LocalizedText({
  id,
  as = "span",
  className,
  count,
  value,
}: {
  id: TranslationKey;
  as?: "span" | "p" | "em" | "strong" | "h2" | "h3";
  className?: string;
  count?: number;
  value?: string;
}) {
  const { t } = useLanguage();
  const Tag = as;
  let text = t(id);
  if (count !== undefined) {
    text = text.replace("{count}", String(count));
  }
  if (value !== undefined) {
    text = text.replace("{value}", value);
  }
  return <Tag className={className}>{text}</Tag>;
}

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div aria-label={t("language.label")} className={`language-switcher ${className}`}>
      <button
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
        type="button"
      >
        {t("language.english")}
      </button>
      <span aria-hidden="true">/</span>
      <button
        aria-pressed={language === "sq"}
        onClick={() => setLanguage("sq")}
        type="button"
      >
        {t("language.albanian")}
      </button>
    </div>
  );
}
