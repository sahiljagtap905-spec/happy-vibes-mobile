import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Database, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { seedSampleData, deleteAllInventory } from "@/lib/seed-sample-data";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Inventory Pulse" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const seed = async () => {
    if (!user) return;
    setSeeding(true);
    try {
      await seedSampleData(user.id);
      toast.success("Sample inventory loaded");
      qc.invalidateQueries({ queryKey: ["inventory", user.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  const wipe = async () => {
    if (!user) return;
    if (!confirm("Delete ALL your inventory items? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteAllInventory(user.id);
      toast.success("Inventory cleared");
      qc.invalidateQueries({ queryKey: ["inventory", user.id] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete data");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Manage your data and preferences" />

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Data</h2>
        <Card className="divide-y divide-border p-0">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Load sample data</p>
              <p className="text-xs text-muted-foreground">16 example items to explore the app</p>
            </div>
            <Button size="sm" variant="outline" onClick={seed} disabled={seeding}>
              {seeding && <Loader2 className="h-3 w-3 animate-spin" />}
              Load
            </Button>
          </div>
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">Delete all inventory</p>
              <p className="text-xs text-muted-foreground">Clears every item in your account</p>
            </div>
            <Button size="sm" variant="destructive" onClick={wipe} disabled={deleting}>
              {deleting && <Loader2 className="h-3 w-3 animate-spin" />}
              Delete
            </Button>
          </div>
        </Card>
      </section>
    </div>
  );
}
