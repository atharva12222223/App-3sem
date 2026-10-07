"use client";

// Language toggle placeholder framework. Wire real translations in via
// next-intl / react-i18next; today the context carries the selected locale
// and components fall back to English strings with a `hi` hint where present.
import { createContext, useContext, useState, ReactNode } from "react";

export type Locale = "en" | "hi" | "kn" | "mr" | "ta" | "bn";

export const LOCALES: { id: Locale; label: string; native: string }[] = [
  { id: "en", label: "English", native: "English" },
  { id: "hi", label: "Hindi", native: "हिन्दी" },
  { id: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { id: "mr", label: "Marathi", native: "मराठी" },
  { id: "ta", label: "Tamil", native: "தமிழ்" },
  { id: "bn", label: "Bengali", native: "বাংলা" },
];

type LanguageCtx = { locale: Locale; setLocale: (l: Locale) => void };

const Ctx = createContext<LanguageCtx>({ locale: "en", setLocale: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export const useLanguage = () => useContext(Ctx);
