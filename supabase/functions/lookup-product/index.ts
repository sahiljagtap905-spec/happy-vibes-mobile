// Lookup a barcode against Open Food Facts and return a normalized product.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATEGORY_MAP: { match: RegExp; category: string }[] = [
  { match: /dairy|milk|cheese|yogurt|butter|cream/i, category: "Dairy" },
  { match: /meat|beef|pork|chicken|poultry|sausage|bacon/i, category: "Meat" },
  { match: /fish|seafood|salmon|tuna|shrimp/i, category: "Seafood" },
  { match: /vegetable|salad|tomato|onion|carrot|potato/i, category: "Vegetables" },
  { match: /fruit|apple|banana|berry|orange|grape/i, category: "Fruits" },
  { match: /bread|bakery|pastry|loaf/i, category: "Bakery" },
  { match: /beverage|drink|juice|soda|water|coffee|tea/i, category: "Beverages" },
  { match: /snack|chip|cracker|cookie|chocolate|candy/i, category: "Snacks" },
  { match: /pasta|rice|grain|cereal|flour/i, category: "Pantry" },
  { match: /frozen/i, category: "Frozen" },
  { match: /sauce|condiment|ketchup|mayo|mustard/i, category: "Condiments" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { barcode } = await req.json();
    if (!barcode || typeof barcode !== "string") {
      return json({ error: "barcode required" }, 400);
    }

    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,categories,image_front_small_url,quantity`;
    const r = await fetch(url, { headers: { "User-Agent": "InventoryPulse/1.0" } });
    if (!r.ok) return json({ found: false, error: `OFF ${r.status}` });
    const data = await r.json();
    if (data.status !== 1 || !data.product) {
      return json({ found: false });
    }

    const p = data.product;
    const cats = (p.categories ?? "") as string;
    const matched = CATEGORY_MAP.find((c) => c.match.test(cats));
    return json({
      found: true,
      product: {
        name: p.product_name ?? null,
        brand: p.brands ?? null,
        category: matched?.category ?? "Other",
        imageUrl: p.image_front_small_url ?? null,
        quantity: p.quantity ?? null,
      },
    });
  } catch (e) {
    console.error("lookup-product error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
