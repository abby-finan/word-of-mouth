import { cn } from "@/lib/utils";

type BrandBackgroundVariant = "auth" | "subtle";

interface BrandBackgroundProps {
  /** auth = full typography for login/signup; subtle = lighter texture for in-app screens */
  variant?: BrandBackgroundVariant;
  /** fixed pins to viewport (auth); absolute scrolls within a relative parent */
  fixed?: boolean;
  className?: string;
}

const DESKTOP_LINES = ["WORD OF MOUTH", "WORD OF MOUTH", "WORD OF MOUTH"];
const MOBILE_LINES = ["WOM", "WOM", "WOM", "WOM"];

export function BrandBackground({
  variant = "auth",
  fixed = true,
  className,
}: BrandBackgroundProps) {
  const isSubtle = variant === "subtle";
  const opacity = isSubtle ? "opacity-[0.04]" : "opacity-[0.06]";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none inset-0 z-0 overflow-hidden select-none",
        fixed ? "fixed" : "absolute",
        className
      )}
    >
      {/* Mobile — WOM × 4 (auth) or × 2 (subtle) */}
      <div
        className={cn(
          "flex h-full flex-col md:hidden",
          isSubtle
            ? "justify-start pt-24 gap-0"
            : "justify-center gap-1 py-16",
          opacity
        )}
      >
        {(isSubtle ? MOBILE_LINES.slice(0, 2) : MOBILE_LINES).map((line, i) => (
          <p
            key={i}
            className={cn(
              "font-black uppercase leading-none tracking-[-0.05em] whitespace-nowrap",
              i % 2 === 0 ? "text-blush -translate-x-[10%]" : "text-sage -translate-x-[22%]"
            )}
            style={{ fontSize: isSubtle ? "42vw" : "34vw" }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Desktop — WORD OF MOUTH × 3 (auth) or × 1 (subtle) */}
      <div
        className={cn(
          "hidden h-full flex-col md:flex",
          isSubtle
            ? "justify-start pt-28"
            : "justify-center gap-0 py-20",
          opacity
        )}
      >
        {(isSubtle ? DESKTOP_LINES.slice(0, 1) : DESKTOP_LINES).map((line, i) => (
          <p
            key={i}
            className={cn(
              "font-black uppercase leading-[0.88] tracking-[-0.03em] whitespace-nowrap",
              isSubtle
                ? "text-sage translate-x-[8%]"
                : cn(
                    i === 0 && "text-blush -translate-x-[6%]",
                    i === 1 && "text-sage -translate-x-[14%]",
                    i === 2 && "text-charcoal -translate-x-[3%]"
                  )
            )}
            style={{ fontSize: isSubtle ? "14vw" : "11.5vw" }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
