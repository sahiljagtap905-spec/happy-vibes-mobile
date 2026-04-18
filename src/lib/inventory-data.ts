export type Category =
  | "Produce"
  | "Dairy"
  | "Meat"
  | "Bakery"
  | "Pantry"
  | "Beverages"
  | "Frozen"
  | "Other";

export const CATEGORIES: Category[] = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Beverages",
  "Frozen",
  "Other",
];

export type Location = "Fridge" | "Pantry" | "Freezer";

export type FreshnessLevel = "fresh" | "warning" | "urgent" | "expired";

export interface InventoryItem {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: string;
  expiresAt: string; // ISO
  addedAt: string; // ISO
  imageUrl?: string;
  location: Location;
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function getDaysUntilExpiry(expiresAt: string, now: Date = new Date()): number {
  const expiry = new Date(expiresAt);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
  return Math.round((end - start) / DAY_MS);
}

export function getFreshnessLevel(expiresAt: string, now: Date = new Date()): FreshnessLevel {
  const days = getDaysUntilExpiry(expiresAt, now);
  if (days < 0) return "expired";
  if (days <= 1) return "urgent";
  if (days <= 5) return "warning";
  return "fresh";
}

export function getRelativeExpiryText(expiresAt: string, now: Date = new Date()): string {
  const days = getDaysUntilExpiry(expiresAt, now);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  if (days > 1) return `in ${days} days`;
  return `${Math.abs(days)} days ago`;
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Bananas", category: "Produce", quantity: 6, unit: "pcs", expiresAt: isoDaysFromNow(2), addedAt: isoDaysFromNow(-3), location: "Pantry" },
  { id: "2", name: "Whole Milk", category: "Dairy", quantity: 1, unit: "L", expiresAt: isoDaysFromNow(4), addedAt: isoDaysFromNow(-2), location: "Fridge" },
  { id: "3", name: "Greek Yogurt", category: "Dairy", quantity: 4, unit: "cups", expiresAt: isoDaysFromNow(7), addedAt: isoDaysFromNow(-1), location: "Fridge" },
  { id: "4", name: "Chicken Breast", category: "Meat", quantity: 500, unit: "g", expiresAt: isoDaysFromNow(1), addedAt: isoDaysFromNow(-2), location: "Fridge" },
  { id: "5", name: "Sourdough Bread", category: "Bakery", quantity: 1, unit: "loaf", expiresAt: isoDaysFromNow(3), addedAt: isoDaysFromNow(-1), location: "Pantry" },
  { id: "6", name: "Spaghetti", category: "Pantry", quantity: 2, unit: "boxes", expiresAt: isoDaysFromNow(180), addedAt: isoDaysFromNow(-30), location: "Pantry" },
  { id: "7", name: "Orange Juice", category: "Beverages", quantity: 1, unit: "L", expiresAt: isoDaysFromNow(5), addedAt: isoDaysFromNow(-2), location: "Fridge" },
  { id: "8", name: "Frozen Peas", category: "Frozen", quantity: 500, unit: "g", expiresAt: isoDaysFromNow(120), addedAt: isoDaysFromNow(-10), location: "Freezer" },
  { id: "9", name: "Avocados", category: "Produce", quantity: 3, unit: "pcs", expiresAt: isoDaysFromNow(0), addedAt: isoDaysFromNow(-4), location: "Pantry" },
  { id: "10", name: "Cheddar Cheese", category: "Dairy", quantity: 200, unit: "g", expiresAt: isoDaysFromNow(14), addedAt: isoDaysFromNow(-3), location: "Fridge" },
  { id: "11", name: "Ground Beef", category: "Meat", quantity: 400, unit: "g", expiresAt: isoDaysFromNow(-1), addedAt: isoDaysFromNow(-5), location: "Fridge" },
  { id: "12", name: "Croissants", category: "Bakery", quantity: 4, unit: "pcs", expiresAt: isoDaysFromNow(2), addedAt: isoDaysFromNow(-1), location: "Pantry" },
  { id: "13", name: "Olive Oil", category: "Pantry", quantity: 1, unit: "bottle", expiresAt: isoDaysFromNow(365), addedAt: isoDaysFromNow(-60), location: "Pantry" },
  { id: "14", name: "Sparkling Water", category: "Beverages", quantity: 6, unit: "bottles", expiresAt: isoDaysFromNow(200), addedAt: isoDaysFromNow(-7), location: "Pantry" },
  { id: "15", name: "Ice Cream", category: "Frozen", quantity: 1, unit: "tub", expiresAt: isoDaysFromNow(60), addedAt: isoDaysFromNow(-5), location: "Freezer" },
  { id: "16", name: "Spinach", category: "Produce", quantity: 1, unit: "bag", expiresAt: isoDaysFromNow(-2), addedAt: isoDaysFromNow(-6), location: "Fridge" },
];

export type FreshnessFilter = "all" | FreshnessLevel;
export type SortKey = "expiry" | "name" | "recent";

export function filterItems(
  items: InventoryItem[],
  opts: { q: string; freshness: FreshnessFilter; category: string },
): InventoryItem[] {
  const q = opts.q.trim().toLowerCase();
  return items.filter((item) => {
    if (q && !item.name.toLowerCase().includes(q)) return false;
    if (opts.category !== "all" && item.category !== opts.category) return false;
    if (opts.freshness !== "all" && getFreshnessLevel(item.expiresAt) !== opts.freshness) return false;
    return true;
  });
}

export function sortItems(items: InventoryItem[], sort: SortKey): InventoryItem[] {
  const copy = [...items];
  switch (sort) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "recent":
      return copy.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    case "expiry":
    default:
      return copy.sort(
        (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
      );
  }
}
