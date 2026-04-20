import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Package, AlertTriangle, PiggyBank, ScanLine, Plus, ChefHat, Sparkles } from "lucide-react";
import { FreshnessGauge } from "@/components/ui-app/FreshnessGauge";
import { StatCard } from "@/components/ui-app/StatCard";
import { QuickActionButton } from "@/components/ui-app/QuickActionButton";
import { FreshnessBadge } from "@/components/ui-app/FreshnessBadge";
import { AISuggestionsPanel } from "@/components/ui-app/AISuggestionsPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useSuggestRecipes } from "@/hooks/useAISuggestions";
import { supabase } from "@/integrations/supabase/client";
import { getFreshnessLevel, getRelativeExpiryText, getDaysUntilExpiry } from "@/lib/inventory-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Inventory Pulse" },
      { name: "description", content: "Your kitchen at a glance: freshness, expiring items, and quick actions." },
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

function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items = [] } = useInventory(user?.id);
  const rescue = useSuggestRecipes();
  const [showRescue, setShowRescue] = useState(false);

  const runRescue = () => {
    setShowRescue(true);
    rescue.mutate({ items, mode: "rescue" });
  };

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      qc.setQueryData(["profile-name"], data?.display_name);
    });
  }, [user, qc]);

  const { fresh, warning, urgent, expiringSoon } = useMemo(() => {
    let f = 0, w = 0, u = 0;
    items.forEach((i) => {
      const lvl = getFreshnessLevel(i.expiresAt);
      if (lvl === "fresh") f++;
      else if (lvl === "warning") w++;
      else if (lvl === "urgent" || lvl === "expired") u++;
    });
    const soon = [...items]
      .filter((i) => {
        const lvl = getFreshnessLevel(i.expiresAt);
        return lvl === "urgent" || lvl === "warning" || lvl === "expired";
      })
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())
      .slice(0, 5);
    return { fresh: f, warning: w, urgent: u, expiringSoon: soon };
  }, [items]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()}</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Here's your kitchen</h1>
      </div>

      <Card className="flex flex-col items-center gap-4 p-6">
        <FreshnessGauge fresh={fresh} warning={warning} urgent={urgent} size={200} />
        <div className="flex w-full justify-around text-center">
          <div><p className="text-lg font-semibold text-fresh">{fresh}</p><p className="text-xs text-muted-foreground">Fresh</p></div>
          <div><p className="text-lg font-semibold text-warning-foreground">{warning}</p><p className="text-xs text-muted-foreground">Near</p></div>
          <div><p className="text-lg font-semibold text-urgent">{urgent}</p><p className="text-xs text-muted-foreground">Urgent</p></div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total" value={items.length} icon={Package} />
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
          <span className="text-xs font-medium text-muted-foreground">{expiringSoon.length} items</span>
        </div>
        {expiringSoon.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nothing expiring soon. Add items from the Inventory tab or Settings → Load sample data.
          </Card>
        ) : (
          <Card className="divide-y divide-border p-0">
            {expiringSoon.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Expires {getRelativeExpiryText(item.expiresAt)}</p>
                </div>
                <FreshnessBadge level={getFreshnessLevel(item.expiresAt)} />
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
