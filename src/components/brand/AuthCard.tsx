import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

/** Frosted glass card for auth and onboarding forms */
export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div className={cn("glass-card p-8 sm:p-10", className)}>{children}</div>
  );
}
