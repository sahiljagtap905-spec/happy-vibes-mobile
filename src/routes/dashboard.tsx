import { createFileRoute } from "@tanstack/react-router";
import { Package, AlertTriangle, PiggyBank, ScanLine, Plus, ChefHat } from "lucide-react";
import { FreshnessGauge } from "@/components/ui-app/FreshnessGauge";
import { StatCard } from "@/components/ui-app/StatCard";
import { QuickActionButton } from "@/components/ui-app/QuickActionButton";
import { FreshnessBadge, type FreshnessLevel } from "@/components/ui-app/FreshnessBadge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Inventory Pulse" },
      {
        name: "description",
        content: "Your kitchen at a glance: freshness, expiring items, and quick actions.",
      },
    ],
  }),
  component: DashboardPage,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const expiringSoon: Array<{ name: string; days: string; level: FreshnessLevel }> = [
  { name: "Greek yogurt", days: "Today", level: "urgent" },
  { name: "Spinach", days: "1 day", level: "urgent" },
  { name: "Sourdough bread", days: "3 days", level: "warning" },
];

function DashboardPage() {
  const fresh = 12;
  const warning = 4;
  const urgent = 2;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Here's your kitchen
        </h1>
      </div>

      <Card className="flex flex-col items-center gap-4 p-6">
        <FreshnessGauge fresh={fresh} warning={warning} urgent={urgent} size={200} />
        <div className="flex w-full justify-around text-center">
          <div>
            <p className="text-lg font-semibold text-fresh">{fresh}</p>
            <p className="text-xs text-muted-foreground">Fresh</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-warning-foreground">{warning}</p>
            <p className="text-xs text-muted-foreground">Near</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-urgent">{urgent}</p>
            <p className="text-xs text-muted-foreground">Urgent</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={fresh + warning + urgent} icon={Package} />
        <StatCard label="Expiring" value={urgent + warning} icon={AlertTriangle} tone="warning" />
        <StatCard label="Saved" value="$48" icon={PiggyBank} tone="fresh" trend="this month" />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick actions</h2>
        <div className="flex gap-3">
          <QuickActionButton to="/scanner" label="Scan" icon={ScanLine} tone="primary" />
          <QuickActionButton to="/inventory" label="Add item" icon={Plus} />
          <QuickActionButton to="/recipes" label="Recipes" icon={ChefHat} />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Expiring soon</h2>
          <span className="text-xs font-medium text-muted-foreground">
            {expiringSoon.length} items
          </span>
        </div>
        <Card className="divide-y divide-border p-0">
          {expiringSoon.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">Expires in {item.days}</p>
              </div>
              <FreshnessBadge level={item.level} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
