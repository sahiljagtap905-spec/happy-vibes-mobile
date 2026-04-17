import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  to: string;
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "muted";
  className?: string;
}

export function QuickActionButton({
  to,
  label,
  icon: Icon,
  tone = "muted",
  className,
}: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className={cn(
        "group flex min-h-[88px] flex-1 flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-all active:scale-95",
        tone === "primary" && "border-primary/30 bg-primary/5",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          tone === "primary"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium text-foreground">{label}</span>
    </Link>
  );
}
