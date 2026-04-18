import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  BarChart3,
  Settings,
  User,
  Bell,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More — Inventory Pulse" },
      { name: "description", content: "Shopping, analytics, settings and your profile." },
    ],
  }),
  component: MorePage,
});

const items: Array<{ to: string; label: string; description: string; icon: LucideIcon }> = [
  { to: "/more", label: "Shopping list", description: "Auto-generated and manual items", icon: ShoppingCart },
  { to: "/analytics", label: "Analytics", description: "Waste, savings, and trends", icon: BarChart3 },
  { to: "/notifications", label: "Notifications", description: "Manage alerts", icon: Bell },
  { to: "/more", label: "Settings", description: "Preferences and modes", icon: Settings },
  { to: "/more", label: "Profile", description: "Your account", icon: User },
];

function MorePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="More" description="Everything else" />
      <Card className="divide-y divide-border p-0">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 px-4 py-3 transition-colors active:bg-muted"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
