"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Bookmark, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-t border-charcoal/5 safe-bottom">
      <div className="mx-auto max-w-lg flex items-center justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
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
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={cn(isActive && "text-sage")}
              />
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
