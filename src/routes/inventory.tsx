import { createFileRoute } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory — Inventory Pulse" },
      { name: "description", content: "Browse and manage every item in your kitchen." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" description="All items in your kitchen" />
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Your inventory list will appear here.
        </p>
      </Card>
    </div>
  );
}
