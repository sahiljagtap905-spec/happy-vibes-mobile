import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock, Users, Sparkles, Zap, Search } from "lucide-react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_RECIPES, ALL_TAGS } from "@/lib/recipes-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "all").default("all"),
  business: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recipes — Inventory Pulse" },
      { name: "description", content: "Smart recipe ideas based on what you have at home." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: RecipesPage,
});

function RecipesPage() {
  const { q, tag, business } = Route.useSearch();
  const navigate = useNavigate({ from: "/recipes" });

  const update = (next: Partial<{ q: string; tag: string; business: boolean }>) =>
    navigate({ search: (prev) => ({ ...prev, ...next }) });

  const filtered = MOCK_RECIPES.filter((r) => {
    if (business && r.timeMinutes > 15) return false;
    if (tag !== "all" && !r.tags.includes(tag)) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recipes"
        description="Cook smart with what's in your kitchen"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              toast("AI suggestions coming soon", {
                description: "We'll generate recipes from your inventory in Phase 7.",
              })
            }
          >
            <Sparkles className="h-4 w-4" />
            AI suggest
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search recipes"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Search recipes"
          className="pl-9"
        />
      </div>

      <button
        type="button"
        onClick={() => update({ business: !business })}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
          business
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover:bg-muted/40",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              business ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
            )}
          >
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Business mode</p>
            <p className="text-xs text-muted-foreground">Show only recipes ≤ 15 min</p>
          </div>
        </div>
        <span
          className={cn(
            "h-5 w-9 rounded-full p-0.5 transition-colors",
            business ? "bg-primary" : "bg-muted-foreground/30",
          )}
        >
          <span
            className={cn(
              "block h-4 w-4 rounded-full bg-white shadow transition-transform",
              business && "translate-x-4",
            )}
          />
        </span>
      </button>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2 pb-1">
          <TagChip active={tag === "all"} onClick={() => update({ tag: "all" })}>
            All
          </TagChip>
          {ALL_TAGS.map((t) => (
            <TagChip key={t} active={tag === t} onClick={() => update({ tag: t })}>
              {t}
            </TagChip>
          ))}
        </div>
      </div>

      <p className="text-xs font-medium text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to="/recipes/$recipeId"
            params={{ recipeId: r.id }}
            className="block"
          >
            <Card className="flex h-full gap-3 p-3 transition-colors hover:bg-muted/40">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
                {r.imageEmoji}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {r.timeMinutes} min
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {r.servings}
                  </span>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {r.difficulty}
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No recipes match your filters.
        </Card>
      )}
    </div>
  );
}

function TagChip({
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
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
