import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InventoryItem } from "@/lib/inventory-data";
import { cacheInventory, readCachedInventory } from "@/lib/inventory-cache";

interface DbItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  expires_at: string;
  added_at: string;
  image_url: string | null;
}

function toItem(r: DbItem): InventoryItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category as InventoryItem["category"],
    quantity: Number(r.quantity),
    unit: r.unit,
    location: r.location as InventoryItem["location"],
    expiresAt: r.expires_at,
    addedAt: r.added_at,
    imageUrl: r.image_url ?? undefined,
  };
}

export function useInventory(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["inventory", userId],
    enabled: !!userId,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("inventory_items")
          .select("*")
          .order("expires_at", { ascending: true });
        if (error) throw error;
        const items = (data as DbItem[]).map(toItem);
        cacheInventory(items);
        return items;
      } catch (err) {
        const cached = await readCachedInventory<InventoryItem>();
        if (cached) return cached;
        throw err;
      }
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inventory_items", filter: `user_id=eq.${userId}` },
        () => qc.invalidateQueries({ queryKey: ["inventory", userId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId, qc]);

  return query;
}

export function useDeleteItem(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", userId] }),
  });
}

export function useUpdateItem(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { id: string; name?: string; quantity?: number; expiresAt?: string }) => {
      const update: { name?: string; quantity?: number; expires_at?: string } = {};
      if (patch.name !== undefined) update.name = patch.name;
      if (patch.quantity !== undefined) update.quantity = patch.quantity;
      if (patch.expiresAt !== undefined) update.expires_at = patch.expiresAt;
      const { error } = await supabase.from("inventory_items").update(update).eq("id", patch.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", userId] }),
  });
}

export function useAddItem(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<InventoryItem, "id" | "addedAt">) => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase.from("inventory_items").insert({
        user_id: userId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        location: item.location,
        expires_at: item.expiresAt,
        image_url: item.imageUrl ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", userId] }),
  });
}
