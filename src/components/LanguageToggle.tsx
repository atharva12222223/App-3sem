"use client";

import { useLanguage, LOCALES } from "./LanguageProvider";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLanguage();
  const current = LOCALES.find((l) => l.id === locale)!;

  if (compact) {
    return (
      <select
        aria-label="Select language / भाषा चुनें"
        value={locale}
        onChange={(e) => setLocale(e.target.value as typeof locale)}
        className="rounded-lg border-2 border-civic-900/20 bg-white px-3 py-2 text-sm font-bold text-civic-900"
      >
        {LOCALES.map((l) => (
          <option key={l.id} value={l.id}>
            {l.native}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-600">🌐 भाषा / Language:</span>
      {LOCALES.map((l) => (
        <button
          key={l.id}
          onClick={() => setLocale(l.id)}
          aria-pressed={l.id === locale}
          className={`rounded-full px-4 py-2 text-sm font-bold transition ${
            l.id === locale
              ? "bg-civic-600 text-white shadow"
              : "bg-white text-civic-900 border-2 border-civic-900/15 hover:border-civic-600"
          }`}
        >
          {l.native}
        </button>
      ))}
      <span className="sr-only">Current: {current.label}</span>
    </div>
  );
}
