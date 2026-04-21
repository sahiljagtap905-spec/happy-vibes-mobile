import { Clock, ChefHat } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AISuggestedRecipe } from "@/hooks/useAISuggestions";

interface Props {
  recipe: AISuggestedRecipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailModal({ recipe, open, onOpenChange }: Props) {
  if (!recipe) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
              {recipe.emoji || "🍽️"}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <DialogTitle className="truncate">{recipe.title}</DialogTitle>
              <DialogDescription className="line-clamp-2">
                {recipe.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {recipe.timeMinutes} min
          </span>
          <Badge variant="secondary" className="text-[10px]">{recipe.difficulty}</Badge>
        </div>

        <section className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ChefHat className="h-4 w-4 text-primary" /> Ingredients
          </h3>
          {recipe.ingredients?.length ? (
            <ul className="space-y-1.5 text-sm text-foreground">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No ingredients listed.</p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Instructions</h3>
          {recipe.instructions?.length ? (
            <ol className="space-y-2 text-sm text-foreground">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted-foreground">No instructions provided.</p>
          )}
        </section>
      </DialogContent>
    </Dialog>
  );
}
