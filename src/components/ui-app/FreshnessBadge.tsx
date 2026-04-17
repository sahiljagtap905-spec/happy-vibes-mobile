import { cn } from "@/lib/utils";

export type FreshnessLevel = "fresh" | "warning" | "urgent";

const labels: Record<FreshnessLevel, string> = {
  fresh: "Fresh",
  warning: "Near expiry",
  urgent: "Urgent",
};

const styles: Record<FreshnessLevel, string> = {
  fresh: "bg-fresh/15 text-fresh",
  warning: "bg-warning/20 text-warning-foreground",
  urgent: "bg-urgent/15 text-urgent",
};

export function FreshnessBadge({
  level,
  label,
  className,
}: {
  level: FreshnessLevel;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        styles[level],
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          level === "fresh" && "bg-fresh",
          level === "warning" && "bg-warning",
          level === "urgent" && "bg-urgent",
        )}
      />
      {label ?? labels[level]}
    </span>
  );
}
