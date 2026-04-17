import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: string;
  tone?: "default" | "fresh" | "warning" | "urgent";
  className?: string;
}) {
  const toneStyles = {
    default: "bg-muted text-foreground",
    fresh: "bg-fresh/15 text-fresh",
    warning: "bg-warning/20 text-warning-foreground",
    urgent: "bg-urgent/15 text-urgent",
  } as const;

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {trend && (
            <p className="mt-1 text-xs text-muted-foreground">{trend}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              toneStyles[tone],
            )}
          >
            <Icon className="h-4.5 w-4.5" size={18} />
          </div>
        )}
      </div>
    </Card>
  );
}
