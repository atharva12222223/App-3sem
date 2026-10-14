"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check standalone mode
    const standalone =
      ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    // Check iOS
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);

    // Check dismissal in session
    if (sessionStorage.getItem("app_install_dismissed") === "true") {
      setDismissed(true);
    }

    // Capture Android beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || dismissed) return null;

  // If neither Android prompt is ready nor iOS Safari, return null unless testing
  if (!deferredPrompt && !isIos) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("app_install_dismissed", "true");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-civic-200 bg-white/95 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-md">
          <Image
            src="/apple-touch-icon.png"
            alt="Sadak Vyapar App"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900">
              Sadak Vyapar App
            </h3>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-1 py-0.5"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
          <p className="text-xs font-medium text-slate-500">
            {isIos
              ? "Install for instant live GPS & offline vendor search"
              : "Install mobile app for quick 1-tap street vendor access"}
          </p>
        </div>
      </div>

      {deferredPrompt ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 rounded-xl bg-civic-600 py-2.5 text-xs font-extrabold text-white shadow-md hover:bg-civic-700 active:scale-98 transition"
          >
            📲 Install App to Home Screen
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Later
          </button>
        </div>
      ) : isIos ? (
        <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-slate-700">
          <p className="leading-relaxed">
            Tap <span className="font-bold text-blue-600">Share</span> (
            <span className="font-mono text-blue-600">⎋</span>) in Safari, then tap{" "}
            <strong className="font-bold text-slate-900">&quot;Add to Home Screen ➕&quot;</strong>
          </p>
        </div>
      ) : null}
    </div>
  );
}
