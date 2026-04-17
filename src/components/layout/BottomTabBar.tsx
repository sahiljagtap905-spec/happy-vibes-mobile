import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ScanLine,
  ChefHat,
  Menu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  center?: boolean;
}

const tabs: Tab[] = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/scanner", label: "Scan", icon: ScanLine, center: true },
  { to: "/recipes", label: "Recipes", icon: ChefHat },
  { to: "/more", label: "More", icon: Menu },
];

export function BottomTabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-screen-sm items-stretch justify-around px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          if (tab.center) {
            return (
              <li key={tab.to} className="flex flex-1 justify-center">
                <Link
                  to={tab.to}
                  aria-label={tab.label}
                  className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
                  activeProps={{ className: "ring-4 ring-primary/20" }}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              </li>
            );
          }
          return (
            <li key={tab.to} className="flex-1">
              <Link
                to={tab.to}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors",
                )}
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
