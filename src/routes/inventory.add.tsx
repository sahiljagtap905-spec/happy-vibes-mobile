import { createFileRoute } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { AddItemForm } from "@/components/inventory/AddItemForm";

const searchSchema = z.object({
  name: fallback(z.string(), "").default(""),
  expiry: fallback(z.string(), "").default(""),
  barcode: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  imageUrl: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/inventory/add")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Add item — Inventory Pulse" },
      { name: "description", content: "Add a new item to your kitchen inventory." },
    ],
  }),
  component: AddItemRoute,
});

function AddItemRoute() {
  const search = Route.useSearch() as z.infer<typeof searchSchema>;
  return <AddItemForm prefill={search} />;
}
