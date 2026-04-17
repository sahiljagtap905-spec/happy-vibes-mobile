
# Phase 1: Core UI Foundation & Navigation

Establishing the foundation for Inventory Pulse: design system, navigation shell, onboarding, and dashboard layout.

## What we'll build

### 1. Design system (src/styles.css)
Replace the default slate theme with the Inventory Pulse palette using OKLCH:
- **Primary (Fresh Green)**: #10B981
- **Warning (Near Expiry)**: #F59E0B
- **Destructive (Urgent)**: #EF4444
- Clean white/gray neutrals
- Add semantic tokens: `--fresh`, `--warning`, `--urgent` (plus foregrounds) so freshness indicators are reusable across the app
- Inter font for headings (loaded via Google Fonts in `__root.tsx`), system fonts for body
- Mobile-first sizing, larger default touch targets

### 2. Routing structure (file-based, TanStack Router)
Create route files in `src/routes/`:
- `index.tsx` → redirect to `/dashboard` (or `/welcome` if not onboarded)
- `welcome.tsx` → onboarding carousel
- `dashboard.tsx` → main home
- `inventory.tsx` → placeholder list
- `scanner.tsx` → placeholder
- `recipes.tsx` → placeholder
- `more.tsx` → hub for Shopping, Analytics, Settings, Profile

Later phases add `inventory.add.tsx`, `inventory.$id.tsx`, `recipes.$id.tsx`, `auth.tsx`, etc.

### 3. App shell with bottom tab navigation
- New `src/components/layout/AppShell.tsx` wrapping `<Outlet />` with:
  - Top header (page title + notification bell)
  - Bottom tab bar fixed at viewport bottom (Dashboard, Inventory, Scanner, Recipes, More)
  - Scanner tab visually elevated (center FAB style)
  - Active tab uses primary green; uses `<Link activeProps>` from `@tanstack/react-router`
- Mounted inside `__root.tsx` so it wraps all routes except `/welcome` and (future) `/auth`
- Hidden on `/welcome` via a small route-aware check

### 4. Reusable UI primitives (src/components/ui-app/)
Built on top of existing shadcn components:
- `FreshnessBadge` — pill showing Fresh/Near/Urgent with semantic color
- `FreshnessGauge` — circular SVG progress gauge for the dashboard
- `StatCard` — number + label + trend
- `QuickActionButton` — large icon button for dashboard CTAs
- `PageHeader` — consistent page title + optional action

### 5. Onboarding (`/welcome`)
- 3-slide carousel (using existing `components/ui/carousel.tsx`):
  1. Track inventory effortlessly
  2. Get smart expiry alerts
  3. AI recipes from what you have
- Dot progress indicators, swipe gestures (Embla built-in), Skip + Next/Get Started CTA
- On completion, set `localStorage.inventory-pulse:onboarded = true` and navigate to `/dashboard`
- `index.tsx` checks this flag and redirects accordingly

### 6. Dashboard layout (`/dashboard`)
Placeholder structure ready for later phases:
- Greeting header ("Good morning")
- Large `FreshnessGauge` (mock data: 12 fresh, 4 near, 2 urgent)
- 3 `StatCard`s (Total items, Expiring soon, Saved this month)
- Quick actions row: Scan, Add Manually, View Recipes
- "Expiring soon" preview list (mock 3 items)
- Notifications bell in header

## Technical details

- **Routing**: TanStack Start file-based routing; flat dot-separated naming. No edits to `routeTree.gen.ts`.
- **Navigation**: All `<Link>` from `@tanstack/react-router`, no `react-router-dom`.
- **Active state**: `activeProps={{ className: "text-primary" }}` on tab links.
- **Conditional shell**: Use `useRouterState({ select: s => s.location.pathname })` in `__root.tsx` to skip the shell on `/welcome`.
- **Onboarding gate**: client-only check inside `index.tsx` component (using `useEffect` + `useNavigate`) since localStorage isn't SSR-safe.
- **Per-route metadata**: Each new route defines its own `head()` with title + description + og tags.
- **Fonts**: Add `<link>` to Inter via `links` array in root route's `head()`.
- **No backend yet**: All data is mock/local. Auth and Supabase come in Phase 5/6.
- **No PWA manifest/service worker yet**: kept for Phase 8 to avoid caching half-built UI during development.

## File diagram

```text
src/
  routes/
    __root.tsx           (updated: fonts, conditional AppShell)
    index.tsx            (replaced: onboarding gate redirect)
    welcome.tsx          (new)
    dashboard.tsx        (new)
    inventory.tsx        (new, placeholder)
    scanner.tsx          (new, placeholder)
    recipes.tsx          (new, placeholder)
    more.tsx             (new, placeholder)
  components/
    layout/
      AppShell.tsx       (new)
      BottomTabBar.tsx   (new)
      TopHeader.tsx      (new)
    ui-app/
      FreshnessBadge.tsx
      FreshnessGauge.tsx
      StatCard.tsx
      QuickActionButton.tsx
      PageHeader.tsx
  styles.css             (updated: brand palette + semantic tokens)
```

## Out of scope (later phases)
- Real inventory CRUD, scanner camera, recipes, auth, Supabase, AI, PWA service worker.
