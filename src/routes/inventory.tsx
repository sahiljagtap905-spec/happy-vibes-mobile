import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Plus, ScanLine, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventorySortMenu } from "@/components/inventory/InventorySortMenu";
import { InventoryItemCard } from "@/components/inventory/InventoryItemCard";
import { InventoryEmptyState } from "@/components/inventory/InventoryEmptyState";
import { EditItemDialog } from "@/components/inventory/EditItemDialog";
import {
  CATEGORIES,
  filterItems,
  sortItems,
  type FreshnessFilter,
  type InventoryItem,
  type SortKey,
} from "@/lib/inventory-data";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteItem, useInventory } from "@/hooks/useInventory";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  freshness: fallback(
    z.enum(["all", "fresh", "warning", "urgent", "expired"]),
    "all",
  ).default("all"),
  category: fallback(z.enum(["all", ...CATEGORIES] as [string, ...string[]]), "all").default("all"),
  sort: fallback(z.enum(["expiry", "name", "recent"]), "expiry").default("expiry"),
});

export const Route = createFileRoute("/inventory")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Inventory — Inventory Pulse" },
      { name: "description", content: "Browse and manage every item in your kitchen." },
    ],
  }),
  component: InventoryPage,
});

function InventoryPage() {
  const { q, freshness, category, sort } = Route.useSearch();
  const navigate = useNavigate({ from: "/inventory" });
  const { user } = useAuth();
  const { data: rawItems = [], isLoading } = useInventory(user?.id);
  const deleteItem = useDeleteItem(user?.id);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<InventoryItem | null>(null);

  const items = useMemo(
    () => sortItems(filterItems(rawItems, { q, freshness, category }), sort),
    [rawItems, q, freshness, category, sort],
  );

  const isFiltered = q !== "" || freshness !== "all" || category !== "all";

  const update = (patch: Partial<{ q: string; freshness: FreshnessFilter; category: string; sort: SortKey }>) => {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }) });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="All items in your kitchen"
        action={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => navigate({ to: "/scanner" })}
            >
              <ScanLine className="h-4 w-4" />
              Scan
            </Button>
            <Button
              size="sm"
              className="gap-1"
              onClick={() =>
                navigate({
                  to: "/add-item",
                  search: { name: "", expiry: "", barcode: "", category: "", imageUrl: "" },
                })
              }
            >
              <Plus className="h-4 w-4" />
              Add manually
            </Button>
          </div>
        }
      />

      <InventorySearch value={q} onChange={(v) => update({ q: v })} />

      <InventoryFilters
        freshness={freshness}
        category={category}
        onFreshnessChange={(v) => update({ freshness: v })}
        onCategoryChange={(v) => update({ category: v })}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "item" : "items"}
        </p>
        <InventorySortMenu value={sort} onChange={(v) => update({ sort: v })} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <InventoryEmptyState
          filtered={isFiltered}
          onReset={() => update({ q: "", freshness: "all", category: "all" })}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              onEdit={(it) => {
                setEditing(it);
                setEditOpen(true);
              }}
              onDelete={(it) => setDeleting(it)}
            />
          ))}
        </div>
      )}

      <EditItemDialog item={editing} open={editOpen} onOpenChange={setEditOpen} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting ? `"${deleting.name}" will be permanently removed from your inventory.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteItem.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteItem.isPending}
              onClick={async (e) => {
                e.preventDefault();
                if (!deleting) return;
                try {
                  await deleteItem.mutateAsync(deleting.id);
                  toast.success("Item deleted");
                  setDeleting(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to delete item");
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
