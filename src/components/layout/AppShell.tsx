import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto max-w-lg pb-24 safe-top">{children}</main>
      <BottomNav />
    </div>
  );
}
