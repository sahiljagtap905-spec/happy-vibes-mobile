import { Package, SearchX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function InventoryEmptyState({
  filtered,
  onReset,
}: {
  filtered: boolean;
  onReset?: () => void;
}) {
  const Icon = filtered ? SearchX : Package;
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div>
        <p className="font-medium text-foreground">
          {filtered ? "No matching items" : "Your kitchen is empty"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered
            ? "Try adjusting your search or filters."
            : "Scan a barcode or add an item to get started."}
        </p>
      </div>
      {filtered && onReset && (
        <Button variant="outline" size="sm" onClick={onReset}>
          Clear filters
        </Button>
      )}
    </Card>
  );
}
