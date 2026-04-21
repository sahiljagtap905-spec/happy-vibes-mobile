import { createFileRoute } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { AddItemPage, addItemSearchSchema } from "./inventory.add";

// Dedicated alias route for manual entry — fully decoupled from /scanner.
export const Route = createFileRoute("/add-item")({
  validateSearch: zodValidator(addItemSearchSchema),
  head: () => ({
    meta: [
      { title: "Add item — Inventory Pulse" },
      { name: "description", content: "Add a new item to your kitchen inventory." },
    ],
  }),
  component: AddItemPage,
});
