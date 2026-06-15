import { BackgroundTypography } from "@/components/brand/BackgroundTypography";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-cream">
      <BackgroundTypography variant="app" />
      <main className="relative z-10 mx-auto max-w-lg pb-24 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
