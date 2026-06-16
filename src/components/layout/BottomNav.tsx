"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Home, Users, Bookmark, User } from "lucide-react";
import { getPendingRequestCount } from "@/lib/friends";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const count = await getPendingRequestCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [pathname, refreshPendingCount]);

  useEffect(() => {
    const handleRefresh = () => {
      refreshPendingCount();
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener("wom:friend-requests-changed", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener("wom:friend-requests-changed", handleRefresh);
    };
  }, [refreshPendingCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-charcoal/5 safe-bottom">
      <div className="mx-auto max-w-lg flex items-center justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          const showPendingBadge =
            href === "/friends" && pendingCount > 0 && !pathname.startsWith("/friends");

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors min-w-[64px]",
                isActive
                  ? "text-charcoal"
                  : "text-warm-gray-light hover:text-warm-gray"
              )}
            >
              <span className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={cn(isActive && "text-sage")}
                />
                {showPendingBadge && (
                  <span
                    aria-label={`${pendingCount} pending friend request${pendingCount === 1 ? "" : "s"}`}
                    className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-coral px-1 text-[9px] font-semibold leading-none text-white"
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-charcoal" : "text-warm-gray-light"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
