import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, AlertTriangle, ShoppingBag, ChefHat, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Inventory Pulse" },
      { name: "description", content: "Expiry alerts, restocks, and recipe ideas." },
    ],
  }),
  component: NotificationsPage,
});

interface Alert {
  id: string;
  title: string;
  body: string;
  time: string;
  type: "expiry" | "restock" | "recipe";
  unread: boolean;
}

const initialAlerts: Alert[] = [
  { id: "n1", title: "Spinach has expired", body: "1 bag past its date — consider tossing.", time: "2h ago", type: "expiry", unread: true },
  { id: "n2", title: "Chicken Breast expires tomorrow", body: "Try the Chicken Stir Fry recipe.", time: "5h ago", type: "recipe", unread: true },
  { id: "n3", title: "Avocados ripe today", body: "Use them now for best flavor.", time: "1d ago", type: "expiry", unread: false },
  { id: "n4", title: "Whole Milk running low", body: "Add to your shopping list?", time: "2d ago", type: "restock", unread: false },
  { id: "n5", title: "New recipes match your inventory", body: "5 ideas using items expiring soon.", time: "3d ago", type: "recipe", unread: false },
];

const typeMeta: Record<Alert["type"], { icon: typeof Bell; tone: string }> = {
  expiry: { icon: AlertTriangle, tone: "bg-urgent/15 text-urgent" },
  restock: { icon: ShoppingBag, tone: "bg-warning/20 text-warning-foreground" },
  recipe: { icon: ChefHat, tone: "bg-primary/15 text-primary" },
};

function NotificationsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [prefs, setPrefs] = useState({
    expiry: true,
    restock: true,
    recipes: true,
    daily: false,
  });

  const unread = alerts.filter((a) => a.unread).length;
  const markAll = () => setAlerts((a) => a.map((x) => ({ ...x, unread: false })));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "All caught up"}
        action={
          unread > 0 ? (
            <Button size="sm" variant="ghost" onClick={markAll}>
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Card className="divide-y divide-border p-0">
        {alerts.map((a) => {
          const meta = typeMeta[a.type];
          const Icon = meta.icon;
          return (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3">
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                  {a.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{a.body}</p>
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{a.time}</span>
            </div>
          );
        })}
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Preferences</h2>
        <Card className="divide-y divide-border p-0">
          <PrefRow
            id="pref-expiry"
            label="Expiry alerts"
            description="Notify when items are near their date"
            checked={prefs.expiry}
            onChange={(v) => setPrefs((p) => ({ ...p, expiry: v }))}
          />
          <PrefRow
            id="pref-restock"
            label="Restock reminders"
            description="Suggest items running low"
            checked={prefs.restock}
            onChange={(v) => setPrefs((p) => ({ ...p, restock: v }))}
          />
          <PrefRow
            id="pref-recipes"
            label="Recipe suggestions"
            description="New ideas using your inventory"
            checked={prefs.recipes}
            onChange={(v) => setPrefs((p) => ({ ...p, recipes: v }))}
          />
          <PrefRow
            id="pref-daily"
            label="Daily summary"
            description="One digest each morning"
            checked={prefs.daily}
            onChange={(v) => setPrefs((p) => ({ ...p, daily: v }))}
          />
        </Card>
      </section>
    </div>
  );
}

function PrefRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
