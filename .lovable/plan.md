
# Phase 2: Inventory Management Interface (Part 1 — List, Filters, Search)

Build out the `/inventory` screen with a real, interactive list backed by mock data. CRUD forms, item details, and analytics come in subsequent slices of Phase 2.

## What we'll build in this slice

### 1. Mock data layer (`src/lib/inventory-data.ts`)
- `InventoryItem` type: `id`, `name`, `category`, `quantity`, `unit`, `expiresAt` (ISO string), `addedAt`, `imageUrl?`, `location` (Fridge / Pantry / Freezer)
- `Category` enum-like union: Produce, Dairy, Meat, Bakery, Pantry, Beverages, Frozen, Other
- `getFreshnessLevel(expiresAt)` helper → returns `"fresh" | "warning" | "urgent" | "expired"` based on days until expiry (>5 fresh, 2–5 warning, 0–1 urgent, <0 expired)
- `getDaysUntilExpiry(expiresAt)` helper
- ~16 realistic mock items spanning all categories and freshness levels

### 2. FreshnessBadge update
- Add `"expired"` level (red, "Expired") so list rows can show overdue items consistently with the rest of the design system

### 3. Inventory list components (`src/components/inventory/`)
- `InventoryItemCard.tsx` — single row: thumbnail circle (icon by category), name, quantity + unit, location, FreshnessBadge with relative expiry text ("in 3 days", "today", "2 days ago"). Tap target ≥ 64px height, full-width tappable.
- `InventoryFilters.tsx` — horizontally scrollable chip row: All, Fresh, Near expiry, Urgent, Expired, plus category chips. Single active chip highlighted with primary color.
- `InventorySearch.tsx` — search input with leading icon and clear button, controlled value.
- `InventorySortMenu.tsx` — dropdown (using existing `dropdown-menu`): Expiry (soonest), Name (A–Z), Recently added.
- `InventoryEmptyState.tsx` — shown when no items match filters; different copy for "no items at all" vs "no matches".

### 4. Inventory route (`src/routes/inventory.tsx`)
Replace the placeholder with a real screen:
- `PageHeader` with title "Inventory" and a primary "+ Add" button (links to `/scanner` for now; `/inventory/add` arrives in the next slice)
- Search input
- Filter chip row (freshness + category)
- Sort menu + result count ("12 items")
- List of `InventoryItemCard`s
- Empty state when filtered list is empty
- All filter / search / sort state stored in **URL search params** via TanStack Router + Zod adapter, so filters survive refresh and are shareable

### 5. Search-param schema
Using `zodValidator` + `fallback`:
- `q: string` (default "")
- `freshness: "all" | "fresh" | "warning" | "urgent" | "expired"` (default "all")
- `category: string` (default "all")
- `sort: "expiry" | "name" | "recent"` (default "expiry")

## Technical details

- **Routing**: stays a leaf route `/inventory`; only `validateSearch` is added. No edits to `routeTree.gen.ts`.
- **State**: filters/search/sort live in URL via `useNavigate({ from: "/inventory" })` + functional `search` updaters so existing params are preserved.
- **Filtering/sorting**: pure functions in `src/lib/inventory-data.ts` (`filterItems`, `sortItems`) — easy to unit test and replace with Supabase queries in Phase 6.
- **Performance**: list is plain `.map()` (≤16 mock items). Virtualization deferred until real data volumes justify it.
- **Icons**: category → `lucide-react` icon map (Apple, Milk, Beef, Croissant, Package, CupSoda, Snowflake, Box).
- **Accessibility**: every chip is a `<button>`; search input has a visible label via `aria-label`; cards are `<button>` elements (will become links to `/inventory/:id` in next slice).
- **Design tokens only** — uses `bg-primary`, `text-muted-foreground`, `bg-fresh/10`, etc. No hard-coded colors.

## Dependencies to install

- `@tanstack/zod-adapter` — type-safe search-param validation (zod itself is already required transitively; install both to be explicit)
- `zod`

## File diagram

```text
src/
  routes/
    inventory.tsx                 (replaced)
  components/
    inventory/
      InventoryItemCard.tsx       (new)
      InventoryFilters.tsx        (new)
      InventorySearch.tsx         (new)
      InventorySortMenu.tsx       (new)
      InventoryEmptyState.tsx     (new)
    ui-app/
      FreshnessBadge.tsx          (updated: + "expired" level)
  lib/
    inventory-data.ts             (new: types, mock data, helpers)
```

## Out of scope (next slices of Phase 2)
- Add / Edit forms (`/inventory/add`, `/inventory/edit/:id`)
- Item detail page (`/inventory/:id`) with timeline
- Image upload
- Pull-to-refresh
- Persisting changes (still mock; CRUD comes with Supabase in Phase 6)
- Dedicated analytics screen (basic stats already on dashboard)
