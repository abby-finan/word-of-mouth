import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

/** Elevated glass card for auth and onboarding forms */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-charcoal/[0.06] bg-white p-8",
        "shadow-[0_20px_60px_rgba(45,42,38,0.08)]",
        className
      )}
    >
      {children}
    </div>
  );
}
