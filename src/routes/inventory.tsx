import { useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Button } from "@/components/ui/button";
import { InventorySearch } from "@/components/inventory/InventorySearch";
import { InventoryFilters } from "@/components/inventory/InventoryFilters";
import { InventorySortMenu } from "@/components/inventory/InventorySortMenu";
import { InventoryItemCard } from "@/components/inventory/InventoryItemCard";
import { InventoryEmptyState } from "@/components/inventory/InventoryEmptyState";
import {
  CATEGORIES,
  MOCK_INVENTORY,
  filterItems,
  sortItems,
  type FreshnessFilter,
  type SortKey,
} from "@/lib/inventory-data";

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

  const items = useMemo(
    () => sortItems(filterItems(MOCK_INVENTORY, { q, freshness, category }), sort),
    [q, freshness, category, sort],
  );

  const isFiltered = q !== "" || freshness !== "all" || category !== "all";

  const update = (patch: Partial<{ q: string; freshness: FreshnessFilter; category: string; sort: SortKey }>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="All items in your kitchen"
        action={
          <Button
            size="sm"
            className="gap-1"
            onClick={() => navigate({ to: "/scanner" })}
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
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

      {items.length === 0 ? (
        <InventoryEmptyState
          filtered={isFiltered}
          onReset={() => update({ q: "", freshness: "all", category: "all" })}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <InventoryItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
