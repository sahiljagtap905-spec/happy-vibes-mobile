import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

const ONBOARDED_KEY = "inventory-pulse:onboarded";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const onboarded =
      typeof window !== "undefined" && window.localStorage.getItem(ONBOARDED_KEY) === "true";
    navigate({ to: onboarded ? "/dashboard" : "/welcome", replace: true });
  }, [navigate]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}
