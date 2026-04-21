import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, ScanLine, Type, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  LOCATIONS,
  type Category,
  type Location,
} from "@/lib/inventory-data";
import { useAuth } from "@/hooks/useAuth";
import { useAddItem } from "@/hooks/useInventory";

const searchSchema = z.object({
  name: fallback(z.string(), "").default(""),
  expiry: fallback(z.string(), "").default(""),
  barcode: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  imageUrl: fallback(z.string(), "").default(""),
});

export const addItemRouteOptions = {
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Add item — Inventory Pulse" },
      { name: "description", content: "Add a new item to your kitchen inventory." },
    ],
  }),
  component: AddItemPage,
} as const;

export const Route = createFileRoute("/inventory/add")(addItemRouteOptions);

export { AddItemPage };

function parseISODate(s: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function AddItemPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const addItem = useAddItem(user?.id);

  const [name, setName] = useState(search.name);
  const [category, setCategory] = useState<Category>(
    (CATEGORIES as string[]).includes(search.category)
      ? (search.category as Category)
      : "Other",
  );
  const [location, setLocation] = useState<Location>("Fridge");
  const [quantity, setQuantity] = useState<string>("1");
  const [unit, setUnit] = useState("pcs");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(parseISODate(search.expiry));
  const [notes, setNotes] = useState(search.barcode ? `Barcode: ${search.barcode}` : "");

  // Sync if scanner pushes new prefill
  useEffect(() => {
    if (search.name) setName(search.name);
  }, [search.name]);
  useEffect(() => {
    const d = parseISODate(search.expiry);
    if (d) setExpiryDate(d);
  }, [search.expiry]);

  const canSave =
    !!user &&
    name.trim().length > 0 &&
    !!expiryDate &&
    Number(quantity) > 0 &&
    !addItem.isPending;

  const handleSave = async () => {
    if (!user) {
      toast("Sign in required", { description: "Please sign in to add items." });
      return;
    }
    if (!name.trim()) {
      toast("Name required", { description: "Enter a product name." });
      return;
    }
    if (!expiryDate) {
      toast("Expiry date required", { description: "Pick an expiry date." });
      return;
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      toast("Invalid quantity", { description: "Enter a positive number." });
      return;
    }

    try {
      await addItem.mutateAsync({
        name: name.trim(),
        category,
        quantity: qty,
        unit: unit.trim() || "pcs",
        location,
        expiresAt: expiryDate.toISOString(),
        imageUrl: search.imageUrl || undefined,
      });
      toast.success("Item added", { description: `${name.trim()} is in your inventory.` });
      navigate({
        to: "/inventory",
        search: { q: "", freshness: "all", category: "all", sort: "expiry" },
      });
    } catch (e) {
      toast.error("Could not save", {
        description: e instanceof Error ? e.message : "Try again.",
      });
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add item"
        description="Confirm details and add to your inventory"
        action={
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1"
          >
            <Link to="/inventory" search={{ q: "", freshness: "all", category: "all", sort: "expiry" }}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
        }
      />

      {/* Mode toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/30 p-1">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-md bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm"
        >
          <Type className="h-4 w-4" />
          Manual entry
        </button>
        <Link
          to="/scanner"
          className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ScanLine className="h-4 w-4" />
          Scan item
        </Link>
      </div>

      <Card className="space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="item-name">Product name *</Label>
          <Input
            id="item-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Whole Milk"
            maxLength={100}
            autoFocus={!name}
          />
        </div>

        <div className="space-y-2">
          <Label>Expiry date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !expiryDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiryDate ? format(expiryDate, "PPP") : "Pick an expiry date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={expiryDate}
                onSelect={setExpiryDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input
              id="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="pcs, g, L"
              maxLength={20}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={location} onValueChange={(v) => setLocation(v as Location)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {notes && (
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={200}
            />
          </div>
        )}

        <Button onClick={handleSave} disabled={!canSave} className="w-full">
          {addItem.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            "Add to inventory"
          )}
        </Button>
        {!user && (
          <p className="text-center text-xs text-muted-foreground">
            Sign in to save items to your inventory.
          </p>
        )}
      </Card>
    </div>
  );
}
