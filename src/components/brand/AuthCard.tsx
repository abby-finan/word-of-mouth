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
        "rounded-2xl border border-white/70 bg-white/75 p-8 backdrop-blur-xl",
        "shadow-[0_12px_40px_rgba(45,42,38,0.07)]",
        className
      )}
    >
      {children}
    </div>
  );
}
