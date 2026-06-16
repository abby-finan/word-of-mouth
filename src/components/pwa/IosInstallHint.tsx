"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Share, X } from "lucide-react";

const DISMISS_KEY = "wom-ios-install-dismissed";

function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos() {
  return /iPad|iPhone|iPod/.test(window.navigator.userAgent);
}

export function IosInstallHint() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const inAppShell =
    pathname.startsWith("/home") ||
    pathname.startsWith("/friends") ||
    pathname.startsWith("/saved") ||
    pathname.startsWith("/profile");
  const bottomClass = inAppShell
    ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]"
    : "bottom-[calc(1.5rem+env(safe-area-inset-bottom))]";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isIos() || isInstalled()) return;

    // Clear legacy permanent dismiss so users see the hint again once.
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      localStorage.removeItem(DISMISS_KEY);
    }

    if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

    const timer = window.setTimeout(() => setVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={`fixed inset-x-0 ${bottomClass} z-50 px-4`}>
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-charcoal/10 bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-light">
          <Share size={18} className="text-sage" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-charcoal">Add WOM to your home screen</p>
          <p className="mt-1 text-xs leading-relaxed text-warm-gray">
            Tap the Share button in Safari, then choose &quot;Add to Home Screen&quot;.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium text-warm-gray"
          >
            Got it
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install hint"
          className="shrink-0 text-warm-gray-light"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
