// Suggest recipes from a user's inventory using Lovable AI.
// Two modes: "general" (use as much as possible) and "rescue" (prioritize items expiring soon).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InventoryInput {
  name: string;
  category?: string;
  expiresInDays?: number;
}

interface ReqBody {
  items: InventoryInput[];
  mode?: "general" | "rescue";
  dietary?: string[];
  businessMode?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body: ReqBody = await req.json();
    const { items = [], mode = "general", dietary = [], businessMode = false } = body;

    if (items.length === 0) {
      return json({ recipes: [], message: "No items to suggest from." });
    }

    const focused = mode === "rescue"
      ? items.filter((i) => (i.expiresInDays ?? 99) <= 3)
      : items;
    const ingredientList = (focused.length ? focused : items)
      .slice(0, 30)
      .map((i) => `- ${i.name}${i.expiresInDays !== undefined ? ` (expires in ${i.expiresInDays}d)` : ""}`)
      .join("\n");

    const sys = `You are a smart kitchen assistant. Given a user's available ingredients, propose 3-5 realistic recipes they can cook NOW. Prefer recipes that USE multiple available ingredients. ${
      mode === "rescue" ? "PRIORITIZE recipes that USE the items expiring soonest to prevent waste." : ""
    } ${businessMode ? "Each recipe must take 15 minutes or less." : ""} ${
      dietary.length ? `Dietary preferences: ${dietary.join(", ")}.` : ""
    } Return concise, practical ideas.`;

    const user = `Available ingredients:\n${ingredientList}\n\nSuggest recipes.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_recipes",
              description: "Return recipe suggestions",
              parameters: {
                type: "object",
                properties: {
                  recipes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string", description: "1-sentence summary" },
                        timeMinutes: { type: "number" },
                        difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
                        usesIngredients: {
                          type: "array",
                          items: { type: "string" },
                          description: "Ingredient names from the user's inventory that this recipe uses",
                        },
                        emoji: { type: "string", description: "Single food emoji" },
                        ingredients: {
                          type: "array",
                          items: { type: "string" },
                          description: "Full ingredient list with quantities, e.g. '2 eggs', '1 cup flour'",
                        },
                        instructions: {
                          type: "array",
                          items: { type: "string" },
                          description: "Step-by-step cooking instructions, one step per array item",
                        },
                      },
                      required: ["title", "description", "timeMinutes", "difficulty", "usesIngredients", "emoji", "ingredients", "instructions"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["recipes"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_recipes" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return json({ error: "Rate limit reached. Try again in a minute." }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits exhausted. Add credits in workspace settings." }, 402);
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      return json({ error: "AI request failed" }, 500);
    }

    const data = await aiRes.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ recipes: [] });
    const args = JSON.parse(toolCall.function.arguments);
    return json({ recipes: args.recipes ?? [] });
  } catch (e) {
    console.error("suggest-recipes error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
