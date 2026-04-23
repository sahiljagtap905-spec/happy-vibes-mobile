import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, AlertTriangle, ShoppingBag, ChefHat, CheckCheck, BellRing, Download } from "lucide-react";
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
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

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
  related_item_id: string | null;
}

const typeMeta: Record<string, { icon: typeof Bell; tone: string }> = {
  expiry: { icon: AlertTriangle, tone: "bg-urgent/15 text-urgent" },
  restock: { icon: ShoppingBag, tone: "bg-warning/20 text-warning-foreground" },
  recipe: { icon: ChefHat, tone: "bg-primary/15 text-primary" },
};

type Bucket = "This Week" | "This Month" | "Earlier";

function bucketFor(dateStr: string): Bucket {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = (now.getTime() - date.getTime()) / 86_400_000;
  if (diffDays <= 7) return "This Week";
  if (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()) return "This Month";
  return "Earlier";
}

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

  const grouped = alerts.reduce<Record<Bucket, NotifRow[]>>(
    (acc, a) => {
      acc[bucketFor(a.created_at)].push(a);
      return acc;
    },
    { "This Week": [], "This Month": [], Earlier: [] },
  );
  const sections: Bucket[] = ["This Week", "This Month", "Earlier"];

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    qc.invalidateQueries({ queryKey: ["notifications", user.id] });
    qc.invalidateQueries({ queryKey: ["notifications-unread", user.id] });
  };

  const updatePref = async (key: keyof typeof prefs, value: boolean) => {
    if (!user) return;
    setPrefs((p) => ({ ...p, [key]: value }));
    const { error } = await supabase.from("notification_preferences").update({ [key]: value } as never).eq("user_id", user.id);
    if (error) toast.error(error.message);
  };

  const push = usePushNotifications();
  const install = useInstallPrompt();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "All caught up"}
        action={alerts.length > 0 ? (
          <Button size="sm" variant="ghost" onClick={markAll} disabled={unread === 0}>
            <CheckCheck className="h-4 w-4" />Mark all as read
          </Button>
        ) : undefined}
      />

      {(install.canInstall || push.supported) && (
        <Card className="space-y-3 p-4">
          {install.canInstall && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Download className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Install Inventory Pulse</p>
                <p className="text-xs text-muted-foreground">Get a faster, app-like experience.</p>
              </div>
              <Button size="sm" onClick={install.promptInstall}>Install</Button>
            </div>
          )}
          {push.supported && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <BellRing className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">Push notifications</p>
                <p className="text-xs text-muted-foreground">
                  {push.subscribed ? "Enabled on this device" : "Get expiry alerts even when the app is closed"}
                </p>
              </div>
              <Button size="sm" variant={push.subscribed ? "outline" : "default"} disabled={push.busy}
                onClick={() => (push.subscribed ? push.unsubscribe() : push.subscribe())}>
                {push.subscribed ? "Disable" : "Enable"}
              </Button>
            </div>
          )}
        </Card>
      )}

      {alerts.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section) =>
            grouped[section].length === 0 ? null : (
              <section key={section}>
                <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section}
                </h2>
                <Card className="divide-y divide-border p-0">
                  {grouped[section].map((a) => {
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
              </section>
            ),
          )}
        </div>
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
