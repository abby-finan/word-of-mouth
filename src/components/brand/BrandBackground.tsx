import { cn } from "@/lib/utils";

type BrandBackgroundVariant = "auth" | "subtle";

interface BrandBackgroundProps {
  /** auth = full Cubao WOM (login/signup); subtle = lighter texture for in-app screens */
  variant?: BrandBackgroundVariant;
  /** fixed pins to viewport (auth); absolute scrolls within a relative parent */
  fixed?: boolean;
  className?: string;
}

const MOBILE_WOM_ROWS = 6;

export function BrandBackground({
  variant = "auth",
  fixed = true,
  className,
}: BrandBackgroundProps) {
  const isSubtle = variant === "subtle";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 z-0 overflow-hidden select-none",
        fixed ? "fixed" : "absolute",
        className
      )}
    >
      {/* Mobile — stacked WOM rows (Cubao) */}
      <div
        className={cn(
          "flex h-full flex-col justify-center md:hidden",
          isSubtle ? "gap-0 pt-20 opacity-[0.07]" : "gap-0 opacity-100"
        )}
      >
        {Array.from({ length: isSubtle ? 3 : MOBILE_WOM_ROWS }).map((_, i) => (
          <p
            key={i}
            className={cn(
              "font-cubao text-brand-coral text-center leading-[0.78] whitespace-nowrap",
              i % 2 === 0 ? "-translate-x-[6%]" : "-translate-x-[14%]"
            )}
            style={{ fontSize: isSubtle ? "38vw" : "34vw" }}
          >
            WOM
          </p>
        ))}
      </div>

      {/* Desktop — oversized W · O · M letters centered behind the form */}
      <div
        className={cn(
          "hidden h-full w-full items-center justify-center md:flex",
          isSubtle ? "opacity-[0.07]" : "opacity-100"
        )}
      >
        <div
          className="font-cubao flex items-end leading-none text-brand-coral"
          style={{ fontSize: isSubtle ? "min(36vw, 380px)" : "min(42vw, 460px)" }}
        >
          <span className="-mr-[0.06em] translate-y-[2%]">W</span>
          <span className="-mx-[0.04em]">O</span>
          <span className="-ml-[0.06em] translate-y-[2%]">M</span>
        </div>
      </div>
    </div>
  );
}
