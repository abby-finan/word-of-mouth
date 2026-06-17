"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    if (
      hashParams.get("type") === "recovery" &&
      hashParams.has("access_token")
    ) {
      window.location.replace(`/reset-password${window.location.hash}`);
      return;
    }

    const isRecoveryQuery =
      searchParams.has("code") ||
      searchParams.has("token_hash") ||
      searchParams.get("type") === "recovery";

    if (isRecoveryQuery) {
      const url = new URL("/auth/confirm", window.location.origin);
      url.searchParams.set("next", "/reset-password");
      searchParams.forEach((value, key) => {
        if (key !== "next") url.searchParams.set(key, value);
      });
      window.location.replace(url.toString());
      return;
    }

    router.replace("/home");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="animate-pulse text-warm-gray-light">Loading...</div>
    </div>
  );
}
