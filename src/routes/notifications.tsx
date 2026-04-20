import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertTriangle, ShoppingBag, ChefHat, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Inventory Pulse" }] }),
  component: NotificationsPage,
});

interface NotifRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: string;
}

const typeMeta: Record<string, { icon: typeof Bell; tone: string }> = {
  expiry: { icon: AlertTriangle, tone: "bg-urgent/15 text-urgent" },
  restock: { icon: ShoppingBag, tone: "bg-warning/20 text-warning-foreground" },
  recipe: { icon: ChefHat, tone: "bg-primary/15 text-primary" },
};

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: alerts = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NotifRow[];
    },
  });

  const [prefs, setPrefs] = useState({ expiry_alerts: true, restock_alerts: true, recipe_alerts: true });

  useEffect(() => {
    if (!user) return;
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ expiry_alerts: data.expiry_alerts, restock_alerts: data.restock_alerts, recipe_alerts: data.recipe_alerts });
    });
  }, [user]);

  const unread = alerts.filter((a) => !a.read).length;

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
  };

  const updatePref = async (key: keyof typeof prefs, value: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    const { error } = await supabase.from("notification_preferences").update({ [key]: value } as Record<string, boolean>).eq("user_id", user.id);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "All caught up"}
        action={unread > 0 ? (
          <Button size="sm" variant="ghost" onClick={markAll}><CheckCheck className="h-4 w-4" />Mark all read</Button>
        ) : undefined}
      />

      {alerts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</Card>
      ) : (
        <Card className="divide-y divide-border p-0">
          {alerts.map((a) => {
            const meta = typeMeta[a.type] ?? typeMeta.recipe;
            const Icon = meta.icon;
            return (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", meta.tone)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{a.title}</p>
                    {!a.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  {a.body && <p className="truncate text-xs text-muted-foreground">{a.body}</p>}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Preferences</h2>
        <Card className="divide-y divide-border p-0">
          <PrefRow id="pref-expiry" label="Expiry alerts" description="Notify when items are near their date" checked={prefs.expiry_alerts} onChange={(v) => updatePref("expiry_alerts", v)} />
          <PrefRow id="pref-restock" label="Restock reminders" description="Suggest items running low" checked={prefs.restock_alerts} onChange={(v) => updatePref("restock_alerts", v)} />
          <PrefRow id="pref-recipes" label="Recipe suggestions" description="New ideas using your inventory" checked={prefs.recipe_alerts} onChange={(v) => updatePref("recipe_alerts", v)} />
        </Card>
      </section>
    </div>
  );
}

function PrefRow({ id, label, description, checked, onChange }: { id: string; label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
