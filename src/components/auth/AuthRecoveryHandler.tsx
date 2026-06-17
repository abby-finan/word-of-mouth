"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function hasRecoveryHash(): boolean {
  if (typeof window === "undefined") return false;
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    hashParams.get("type") === "recovery" && hashParams.has("access_token")
  );
}

function hasRecoveryQuery(): boolean {
  if (typeof window === "undefined") return false;
  const searchParams = new URLSearchParams(window.location.search);
  return (
    searchParams.has("code") ||
    searchParams.has("token_hash") ||
    searchParams.get("type") === "recovery"
  );
}

/** Routes recovery links that land on the wrong page to the correct handler. */
export function AuthRecoveryHandler() {
  const pathname = usePathname();

  useEffect(() => {
    if (
      pathname === "/reset-password" ||
      pathname.startsWith("/auth/confirm") ||
      pathname.startsWith("/auth/callback")
    ) {
      return;
    }

    if (hasRecoveryHash()) {
      window.location.replace(`/reset-password${window.location.hash}`);
      return;
    }

    if (hasRecoveryQuery()) {
      const url = new URL("/auth/confirm", window.location.origin);
      url.searchParams.set("next", "/reset-password");
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.forEach((value, key) => url.searchParams.set(key, value));
      window.location.replace(url.toString());
    }
  }, [pathname]);

  return null;
}
