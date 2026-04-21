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

// Dedicated alias route for manual entry — fully decoupled from /scanner.
export const Route = createFileRoute("/add-item")({
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
  const search = Route.useSearch();
  return <AddItemForm prefill={search} />;
}
