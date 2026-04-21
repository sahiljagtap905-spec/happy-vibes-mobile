import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Zap, Search } from "lucide-react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AISuggestionsPanel } from "@/components/ui-app/AISuggestionsPanel";
import { RecipeDetailModal } from "@/components/ui-app/RecipeDetailModal";
import { useAuth } from "@/hooks/useAuth";
import { useInventory } from "@/hooks/useInventory";
import { useSuggestRecipes, type AISuggestedRecipe } from "@/hooks/useAISuggestions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  business: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recipes — Inventory Pulse" },
      { name: "description", content: "Smart AI recipe ideas based on what you have at home." },
    ],
  }),
  validateSearch: zodValidator(searchSchema),
  component: RecipesPage,
});

function RecipesPage() {
  const { q, business } = Route.useSearch();
  const navigate = useNavigate({ from: "/recipes" });
  const { user } = useAuth();
  const { data: items = [] } = useInventory(user?.id);
  const suggest = useSuggestRecipes();
  const [showAI, setShowAI] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<AISuggestedRecipe | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  const runSuggest = () => {
    if (items.length === 0) {
      toast("Add inventory first", { description: "We need ingredients to suggest recipes." });
      return;
    }
    setShowAI(true);
    suggest.mutate({ items, mode: "general", businessMode: business });
  };

  const update = (next: Partial<{ q: string; business: boolean }>) =>
    navigate({ search: (prev: { q: string; business: boolean }) => ({ ...prev, ...next }) });

  const aiRecipes = suggest.data ?? [];
  const filtered = aiRecipes.filter((r) => {
    if (business && r.timeMinutes > 15) return false;
    if (q && !r.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Recipes"
        description="Cook smart with what's in your kitchen"
        action={
          <Button size="sm" variant="outline" onClick={runSuggest} disabled={suggest.isPending}>
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
          placeholder="Search AI recipes"
          className="pl-9"
        />
      </div>

      <button
        type="button"
        onClick={() => update({ business: !business })}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
          business ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-muted/40",
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

      {showAI ? (
        <AISuggestionsPanel
          recipes={filtered}
          isLoading={suggest.isPending}
          error={suggest.error ? (suggest.error as Error).message : null}
          onRetry={runSuggest}
          onDismiss={() => setShowAI(false)}
          onRecipeClick={(r) => {
            setSelectedRecipe(r);
            setIsRecipeModalOpen(true);
          }}
          title="Recipes from your kitchen"
          emptyHint="No recipes found based on your inventory"
        />
      ) : (
        <Card className="space-y-3 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Get AI recipe ideas</p>
            <p className="text-xs text-muted-foreground">
              Tap “AI suggest” to generate recipes from your current inventory.
            </p>
          </div>
          <Button size="sm" onClick={runSuggest} disabled={suggest.isPending}>
            <Sparkles className="h-4 w-4" />
            Suggest recipes
          </Button>
        </Card>
      )}

      <RecipeDetailModal
        recipe={selectedRecipe}
        open={isRecipeModalOpen}
        onOpenChange={setIsRecipeModalOpen}
      />
    </div>
  );
}
