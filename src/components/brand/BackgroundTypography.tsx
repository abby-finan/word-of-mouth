import { cn } from "@/lib/utils";
import { cubao } from "@/lib/fonts/cubao";

export type BackgroundTypographyVariant = "auth" | "app";

interface BackgroundTypographyProps {
  /** auth = login/signup; app = main tabs (home, friends, saved, profile) */
  variant?: BackgroundTypographyVariant;
  /** fixed pins to viewport; absolute scrolls within a relative parent */
  fixed?: boolean;
  className?: string;
}

/** Six decorative rows — fills viewport top to bottom without overlap */
const ROW_COUNT = 6;

const MOBILE_LABEL = "WOM";
const DESKTOP_LABEL = "WORD OF MOUTH";

/**
 * Decorative Cubao background typography.
 * Mobile: centered WOM rows. Tablet/desktop: full "WORD OF MOUTH" editorial rows.
 */
export function BackgroundTypography({
  variant = "app",
  fixed = true,
  className,
}: BackgroundTypographyProps) {
  const variantClass =
    variant === "auth" ? "wom-typography-auth" : "wom-typography-app";

  const stackClass = cn(
    cubao.className,
    "flex h-full min-h-[100dvh] w-full flex-col items-center justify-center gap-0",
    variantClass
  );

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 z-0 overflow-hidden select-none",
        fixed ? "fixed" : "absolute",
        className
      )}
    >
      {/* Mobile — WOM */}
      <div className={cn(stackClass, "wom-typography-mobile md:hidden")}>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <p key={`mobile-${i}`} className="wom-typography-row wom-typography-row-mobile">
            {MOBILE_LABEL}
          </p>
        ))}
      </div>

      {/* Tablet / desktop — WORD OF MOUTH */}
      <div className={cn(stackClass, "wom-typography-desktop hidden md:flex")}>
        {Array.from({ length: ROW_COUNT }).map((_, i) => (
          <p key={`desktop-${i}`} className="wom-typography-row wom-typography-row-desktop">
            {DESKTOP_LABEL}
          </p>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use BackgroundTypography */
export { BackgroundTypography as BrandBackground };

export type BrandBackgroundVariant = "auth" | "app" | "subtle";
