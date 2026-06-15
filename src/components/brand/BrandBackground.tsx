import { cn } from "@/lib/utils";
import { cubao } from "@/lib/fonts/cubao";

export type BrandBackgroundVariant = "auth" | "app";

interface BrandBackgroundProps {
  /** auth = login/signup; app = main tabs (subtler) */
  variant?: BrandBackgroundVariant;
  /** fixed pins to viewport; absolute scrolls within a relative parent */
  fixed?: boolean;
  className?: string;
}

const MOBILE_ROW_COUNT = 5;

/**
 * Decorative Cubao brand typography behind page content.
 * Mobile: 5 tight WOM rows. Desktop: single oversized W · O · M.
 */
export function BrandBackground({
  variant = "app",
  fixed = true,
  className,
}: BrandBackgroundProps) {
  const variantClass =
    variant === "auth" ? "brand-bg-auth" : "brand-bg-app";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 z-0 overflow-hidden select-none",
        fixed ? "fixed" : "absolute",
        className
      )}
    >
      {/* Mobile — 5 × WOM */}
      <div
        className={cn(
          cubao.className,
          variantClass,
          "brand-bg-mobile flex h-full min-h-[100dvh] w-full flex-col items-center justify-center md:hidden"
        )}
      >
        {Array.from({ length: MOBILE_ROW_COUNT }).map((_, i) => (
          <p key={i} className="brand-bg-row brand-bg-row-mobile">
            WOM
          </p>
        ))}
      </div>

      {/* Desktop — single W · O · M spanning the viewport */}
      <div
        className={cn(
          cubao.className,
          variantClass,
          "brand-bg-desktop hidden h-full min-h-[100dvh] w-full items-center justify-center md:flex"
        )}
      >
        <div className="brand-bg-desktop-letters flex items-end leading-none">
          <span>W</span>
          <span>O</span>
          <span>M</span>
        </div>
      </div>
    </div>
  );
}
