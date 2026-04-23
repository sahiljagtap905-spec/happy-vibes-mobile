import { Apple, Beef, Box, Croissant, CupSoda, Milk, Package, Pencil, Snowflake, Trash2 } from "lucide-react";
import type { Category, InventoryItem } from "@/lib/inventory-data";
import { getFreshnessLevel, getRelativeExpiryText } from "@/lib/inventory-data";
import { FreshnessBadge } from "@/components/ui-app/FreshnessBadge";
import { cn } from "@/lib/utils";

const categoryIcon: Record<Category, typeof Apple> = {
  Produce: Apple,
  Dairy: Milk,
  Meat: Beef,
  Bakery: Croissant,
  Pantry: Package,
  Beverages: CupSoda,
  Frozen: Snowflake,
  Other: Box,
};

const categoryAccent: Record<Category, string> = {
  Produce: "bg-fresh/10 text-fresh",
  Dairy: "bg-primary/10 text-primary",
  Meat: "bg-urgent/10 text-urgent",
  Bakery: "bg-warning/15 text-warning-foreground",
  Pantry: "bg-muted text-muted-foreground",
  Beverages: "bg-primary/10 text-primary",
  Frozen: "bg-primary/10 text-primary",
  Other: "bg-muted text-muted-foreground",
};

export function InventoryItemCard({
  item,
  onClick,
  onEdit,
  onDelete,
  className,
}: {
  item: InventoryItem;
  onClick?: (item: InventoryItem) => void;
  onEdit?: (item: InventoryItem) => void;
  onDelete?: (item: InventoryItem) => void;
  className?: string;
}) {
  const Icon = categoryIcon[item.category];
  const level = getFreshnessLevel(item.expiresAt);
  const relative = getRelativeExpiryText(item.expiresAt);
  const expiryLabel = level === "expired" ? `Expired ${relative}` : `Expires ${relative}`;

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-accent/40",
        "min-h-16",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onClick?.(item)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left focus-visible:outline-none"
      >
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            categoryAccent[item.category],
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-medium text-foreground">{item.name}</p>
            <FreshnessBadge level={level} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {item.quantity} {item.unit} · {item.location} · {expiryLabel}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(item);
          }}
          aria-label="Edit item"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(item);
          }}
          aria-label="Delete item"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
