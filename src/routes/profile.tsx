import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, signOut } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Inventory Pulse" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [kitchenName, setKitchenName] = useState("");
  const [household, setHousehold] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, kitchen_name, household_size")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setKitchenName(data.kitchen_name ?? "");
          setHousehold(data.household_size ?? 1);
        }
        setLoading(false);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        kitchen_name: kitchenName.trim() || null,
        household_size: household,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profile" description={user?.email ?? ""} />
      <Card className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="display">Display name</Label>
          <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="kitchen">Kitchen name</Label>
          <Input id="kitchen" value={kitchenName} onChange={(e) => setKitchenName(e.target.value)} maxLength={80} placeholder="e.g. Home, Office" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hh">Household size</Label>
          <Input id="hh" type="number" min={1} max={20} value={household} onChange={(e) => setHousehold(Math.max(1, Number(e.target.value) || 1))} />
        </div>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save profile
        </Button>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}
