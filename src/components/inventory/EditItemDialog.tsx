import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InventoryItem } from "@/lib/inventory-data";
import { useUpdateItem } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";

export function EditItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const update = useUpdateItem(user?.id);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiry, setExpiry] = useState("");

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(String(item.quantity));
      setExpiry(item.expiresAt.slice(0, 10));
    }
  }, [item]);

  if (!item) return null;

  const handleSave = async () => {
    const qty = Number(quantity);
    if (!name.trim() || !expiry || Number.isNaN(qty) || qty <= 0) {
      toast.error("Please enter a valid name, quantity, and expiry date");
      return;
    }
    try {
      await update.mutateAsync({
        id: item.id,
        name: name.trim(),
        quantity: qty,
        expiresAt: new Date(expiry).toISOString(),
      });
      toast.success("Item updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-qty">Quantity ({item.unit})</Label>
            <Input
              id="edit-qty"
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-expiry">Expiry date</Label>
            <Input
              id="edit-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={update.isPending}>
            {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
