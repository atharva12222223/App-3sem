"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if on iOS device and not in standalone display mode
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      ("standalone" in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;

    const dismissed = sessionStorage.getItem("ios_prompt_dismissed");

    if (isIos && !isStandalone && !dismissed) {
      setShowPrompt(true);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-4 shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
          <Image
            src="/apple-touch-icon.png"
            alt="App Icon"
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Install on your iPhone / iOS
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowPrompt(false);
                sessionStorage.setItem("ios_prompt_dismissed", "true");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Use as a full-screen app: Tap the <strong className="font-semibold text-slate-800">Share</strong> icon (
            <span className="inline-block px-1 font-mono text-blue-600 text-sm">⎋</span>) in Safari, then tap{" "}
            <strong className="font-semibold text-slate-800">&quot;Add to Home Screen&quot; ➕</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
