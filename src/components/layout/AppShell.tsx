import { BrandBackground } from "@/components/brand/BrandBackground";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-cream">
      <BrandBackground variant="app" />
      <main className="relative z-10 mx-auto max-w-lg pb-24 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
