import type { ReactNode } from "react";
import { TopHeader } from "./TopHeader";
import { BottomTabBar } from "./BottomTabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopHeader />
      <main className="mx-auto max-w-screen-sm px-4 pb-28 pt-4">{children}</main>
      <BottomTabBar />
    </div>
  );
}
