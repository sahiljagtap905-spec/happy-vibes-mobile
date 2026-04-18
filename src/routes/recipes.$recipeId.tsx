import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Users, ChefHat, ShoppingBag, Check } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecipeById, type Recipe } from "@/lib/recipes-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/recipes/$recipeId")({
  loader: ({ params }): { recipe: Recipe } => {
    const recipe = getRecipeById(params.recipeId);
    if (!recipe) throw notFound();
    return { recipe };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.recipe.title ?? "Recipe"} — Inventory Pulse` },
      { name: "description", content: loaderData?.recipe.description ?? "" },
    ],
  }),
  notFoundComponent: () => (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">Recipe not found.</p>
      <Link to="/recipes" className="text-sm font-medium text-primary underline">
        Back to recipes
      </Link>
    </div>
  ),
  component: RecipeDetail,
});

function RecipeDetail() {
  const data = Route.useLoaderData();
  const recipe = data.recipe;
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const toggle = (i: number) => setChecked((c) => ({ ...c, [i]: !c[i] }));

  return (
    <div className="space-y-5">
      <Link
        to="/recipes"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Recipes
      </Link>

      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-5xl">
          {recipe.imageEmoji}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{recipe.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipe.description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {recipe.tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-[10px]">
              {t}
            </Badge>
          ))}
        </div>
        <div className="mt-2 grid w-full grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <Stat icon={Clock} label="Time" value={`${recipe.timeMinutes}m`} />
          <Stat icon={Users} label="Servings" value={String(recipe.servings)} />
          <Stat icon={ChefHat} label="Level" value={recipe.difficulty} />
        </div>
      </Card>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Ingredients</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              toast("Added to shopping list", {
                description: `${recipe.ingredients.length} items queued.`,
              })
            }
          >
            <ShoppingBag className="h-4 w-4" />
            Add all
          </Button>
        </div>
        <Card className="divide-y divide-border p-0">
          {recipe.ingredients.map((ing, i) => (
            <button
              key={i}
              onClick={() => toggle(i)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  checked[i]
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border",
                )}
              >
                {checked[i] && <Check className="h-3 w-3" />}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  checked[i] ? "text-muted-foreground line-through" : "text-foreground",
                )}
              >
                {ing.name}
              </span>
              <span className="text-xs text-muted-foreground">{ing.amount}</span>
            </button>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Steps</h2>
        <Card className="divide-y divide-border p-0">
          {recipe.steps.map((s, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                currentStep === i ? "bg-primary/5" : "active:bg-muted",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  currentStep === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground",
                )}
              >
                {i + 1}
              </span>
              <span className="text-sm text-foreground">{s}</span>
            </button>
          ))}
        </Card>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
