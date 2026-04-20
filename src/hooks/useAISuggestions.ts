import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InventoryItem } from "@/lib/inventory-data";
import { getDaysUntilExpiry } from "@/lib/inventory-data";

export interface AISuggestedRecipe {
  title: string;
  description: string;
  timeMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  usesIngredients: string[];
  emoji: string;
}

interface SuggestArgs {
  items: InventoryItem[];
  mode?: "general" | "rescue";
  dietary?: string[];
  businessMode?: boolean;
}

export function useSuggestRecipes() {
  return useMutation({
    mutationFn: async ({ items, mode = "general", dietary = [], businessMode = false }: SuggestArgs) => {
      const payload = {
        items: items.map((i) => ({
          name: i.name,
          category: i.category,
          expiresInDays: getDaysUntilExpiry(i.expiresAt),
        })),
        mode,
        dietary,
        businessMode,
      };
      const { data, error } = await supabase.functions.invoke("suggest-recipes", { body: payload });
      if (error) throw new Error(error.message ?? "AI request failed");
      if (data?.error) throw new Error(data.error);
      return (data?.recipes ?? []) as AISuggestedRecipe[];
    },
  });
}
