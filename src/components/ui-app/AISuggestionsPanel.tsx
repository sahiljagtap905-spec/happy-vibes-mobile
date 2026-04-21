import { Sparkles, Clock, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AISuggestedRecipe } from "@/hooks/useAISuggestions";

interface Props {
  recipes: AISuggestedRecipe[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  onRecipeClick?: (recipe: AISuggestedRecipe) => void;
  title?: string;
  emptyHint?: string;
}

export function AISuggestionsPanel({
  recipes,
  isLoading,
  error,
  onRetry,
  onDismiss,
  onRecipeClick,
  title = "AI suggestions",
  emptyHint,
}: Props) {
  return (
    <Card className="space-y-3 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onRetry} disabled={isLoading} aria-label="Regenerate">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss} aria-label="Dismiss">
            ×
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cooking up ideas…
        </div>
      )}

      {error && !isLoading && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && recipes.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          {emptyHint ?? "No suggestions yet."}
        </p>
      )}

      {!isLoading && recipes.length > 0 && (
        <ul className="space-y-2">
          {recipes.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onRecipeClick?.(r)}
                className="flex w-full cursor-pointer gap-3 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`View recipe: ${r.title}`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-2xl">
                  {r.emoji || "🍽️"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{r.title}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{r.difficulty}</Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" /> {r.timeMinutes}m
                    </span>
                    {r.usesIngredients.slice(0, 4).map((ing) => (
                      <span key={ing} className="rounded-full bg-fresh/10 px-2 py-0.5 text-fresh">{ing}</span>
                    ))}
                  </div>
                  <p className="mt-1.5 text-[10px] font-medium text-primary">Click to view recipe →</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
