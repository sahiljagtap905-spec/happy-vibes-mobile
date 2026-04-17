import { createFileRoute } from "@tanstack/react-router";
import { ChefHat } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/recipes")({
  head: () => ({
    meta: [
      { title: "Recipes — Inventory Pulse" },
      { name: "description", content: "AI recipe suggestions based on what you have." },
    ],
  }),
  component: RecipesPage,
});

function RecipesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Recipes" description="Cook with what you have" />
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ChefHat className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Recipe suggestions will appear here.
        </p>
      </Card>
    </div>
  );
}
