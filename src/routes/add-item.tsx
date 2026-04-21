import { createFileRoute } from "@tanstack/react-router";
import { Route as AddItemRoute } from "./inventory.add";

export const Route = createFileRoute("/add-item")({
  validateSearch: AddItemRoute.options.validateSearch,
  head: AddItemRoute.options.head,
  component: AddItemRoute.options.component,
});
