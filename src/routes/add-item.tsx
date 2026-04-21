import { createFileRoute } from "@tanstack/react-router";
import { addItemRouteOptions } from "./inventory.add";

// Dedicated alias route for manual entry — fully decoupled from /scanner.
export const Route = createFileRoute("/add-item")(addItemRouteOptions);
