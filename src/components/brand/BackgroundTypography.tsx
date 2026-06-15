import { cn } from "@/lib/utils";

export type BackgroundTypographyVariant = "auth" | "app";

interface BackgroundTypographyProps {
  /** auth = login/signup; app = main tabs (home, friends, saved, profile) */
  variant?: BackgroundTypographyVariant;
  /** fixed pins to viewport; absolute scrolls within a relative parent */
  fixed?: boolean;
  className?: string;
}

const ROW_COUNTS: Record<BackgroundTypographyVariant, number> = {
  auth: 6,
  app: 5,
};

/**
 * Oversized Cubao WOM typography — same treatment on desktop and mobile.
 * Decorative background layer only; never intercepts pointer events.
 */
export function BackgroundTypography({
  variant = "app",
  fixed = true,
  className,
}: BackgroundTypographyProps) {
  const rowCount = ROW_COUNTS[variant];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 z-0 overflow-hidden select-none",
        fixed ? "fixed" : "absolute",
        className
      )}
    >
      <div
        className={cn(
          "flex h-full min-h-screen w-full flex-col items-center justify-center",
          variant === "auth" ? "wom-typography-auth" : "wom-typography-app"
        )}
      >
        {Array.from({ length: rowCount }).map((_, i) => (
          <p
            key={i}
            className={cn(
              "wom-typography-row",
              i % 2 === 0 ? "-translate-x-[7%]" : "-translate-x-[14%]"
            )}
          >
            WOM
          </p>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use BackgroundTypography */
export { BackgroundTypography as BrandBackground };

export type BrandBackgroundVariant = "auth" | "app" | "subtle";
