"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
        {
          "bg-charcoal text-white hover:bg-charcoal/90 shadow-sm": variant === "primary",
          "bg-cream-dark text-charcoal hover:bg-cream-dark/80 border border-charcoal/10":
            variant === "secondary",
          "text-warm-gray hover:bg-cream-dark hover:text-charcoal": variant === "ghost",
          "bg-red-50 text-red-600 hover:bg-red-100": variant === "danger",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-5 py-3 text-base": size === "md",
          "px-6 py-4 text-lg": size === "lg",
        },
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
