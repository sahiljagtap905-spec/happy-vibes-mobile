import { CATEGORIES, type FreshnessFilter } from "@/lib/inventory-data";
import { cn } from "@/lib/utils";

const FRESHNESS_OPTIONS: { value: FreshnessFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fresh", label: "Fresh" },
  { value: "warning", label: "Near expiry" },
  { value: "urgent", label: "Urgent" },
  { value: "expired", label: "Expired" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent",
      )}
    >
      {children}
    </button>
  );
}

export function InventoryFilters({
  freshness,
  category,
  onFreshnessChange,
  onCategoryChange,
}: {
  freshness: FreshnessFilter;
  category: string;
  onFreshnessChange: (value: FreshnessFilter) => void;
  onCategoryChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FRESHNESS_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            active={freshness === opt.value}
            onClick={() => onFreshnessChange(opt.value)}
          >
            {opt.label}
          </Chip>
        ))}
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Chip active={category === "all"} onClick={() => onCategoryChange("all")}>
          All categories
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => onCategoryChange(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </div>
  );
}
