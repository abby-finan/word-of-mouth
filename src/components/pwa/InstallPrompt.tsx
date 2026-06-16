"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "wom-pwa-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
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
    if (isInstalled()) return;

    if (localStorage.getItem(DISMISS_KEY) === "true") {
      localStorage.removeItem(DISMISS_KEY);
    }

    if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  }

  async function install() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className={`fixed inset-x-0 ${bottomClass} z-50 px-4`}>
      <div className="mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-charcoal/10 bg-white p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-light">
          <Download size={18} className="text-sage" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-charcoal">Install Word of Mouth</p>
          <p className="mt-1 text-xs leading-relaxed text-warm-gray">
            Add WOM to your home screen for quick access, just like a native app.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-sage px-3 py-1.5 text-xs font-medium text-white"
            >
              Install
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-warm-gray"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 text-warm-gray-light"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
