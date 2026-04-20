import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Users, ChefHat, Check, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface RecipeFull {
  id: string;
  title: string;
  description: string;
  image_emoji: string | null;
  time_minutes: number;
  servings: number;
  difficulty: string;
  tags: string[];
  ingredients: { name: string; amount: string }[];
  steps: string[];
}

export const Route = createFileRoute("/recipes/$recipeId")({
  head: () => ({ meta: [{ title: "Recipe — Inventory Pulse" }] }),
  notFoundComponent: () => (
    <div className="space-y-4 text-center">
      <p className="text-sm text-muted-foreground">Recipe not found.</p>
      <Link to="/recipes" className="text-sm font-medium text-primary underline">Back to recipes</Link>
    </div>
  ),
  component: RecipeDetail,
});

function RecipeDetail() {
  const { recipeId } = Route.useParams();
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*").eq("id", recipeId).maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as unknown as RecipeFull;
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (error || !recipe) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">Recipe not found.</p>
        <Link to="/recipes" className="text-sm font-medium text-primary underline">Back to recipes</Link>
      </div>
    );
  }

  const toggle = (i: number) => setChecked((c) => ({ ...c, [i]: !c[i] }));

  return (
    <div className="space-y-5">
      <Link to="/recipes" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Recipes
      </Link>

      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-5xl">{recipe.image_emoji ?? "🍽️"}</div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{recipe.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{recipe.description}</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {recipe.tags.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
        </div>
        <div className="mt-2 grid w-full grid-cols-3 gap-2 border-t border-border pt-4 text-center">
          <Stat icon={Clock} label="Time" value={`${recipe.time_minutes}m`} />
          <Stat icon={Users} label="Servings" value={String(recipe.servings)} />
          <Stat icon={ChefHat} label="Level" value={recipe.difficulty} />
        </div>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Ingredients</h2>
        <Card className="divide-y divide-border p-0">
          {recipe.ingredients.map((ing, i) => (
            <button key={i} onClick={() => toggle(i)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", checked[i] ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {checked[i] && <Check className="h-3 w-3" />}
              </span>
              <span className={cn("flex-1 text-sm", checked[i] ? "text-muted-foreground line-through" : "text-foreground")}>{ing.name}</span>
              <span className="text-xs text-muted-foreground">{ing.amount}</span>
            </button>
          ))}
        </Card>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">Steps</h2>
        <Card className="divide-y divide-border p-0">
          {recipe.steps.map((s, i) => (
            <button key={i} onClick={() => setCurrentStep(i)} className={cn("flex w-full items-start gap-3 px-4 py-3 text-left transition-colors", currentStep === i ? "bg-primary/5" : "active:bg-muted")}>
              <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold", currentStep === i ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{i + 1}</span>
              <span className="text-sm text-foreground">{s}</span>
            </button>
          ))}
        </Card>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
