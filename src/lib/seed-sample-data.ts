import { MOCK_INVENTORY } from "@/lib/inventory-data";
import { supabase } from "@/integrations/supabase/client";

export async function seedSampleData(userId: string) {
  const rows = MOCK_INVENTORY.map((i) => ({
    user_id: userId,
    name: i.name,
    category: i.category,
    quantity: i.quantity,
    unit: i.unit,
    location: i.location,
    expires_at: i.expiresAt,
    added_at: i.addedAt,
  }));
  const { error } = await supabase.from("inventory_items").insert(rows);
  if (error) throw error;
}

export async function deleteAllInventory(userId: string) {
  const { error } = await supabase.from("inventory_items").delete().eq("user_id", userId);
  if (error) throw error;
}
