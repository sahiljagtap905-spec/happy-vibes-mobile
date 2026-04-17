import { cn } from "@/lib/utils";

interface FreshnessGaugeProps {
  fresh: number;
  warning: number;
  urgent: number;
  size?: number;
  className?: string;
}

export function FreshnessGauge({
  fresh,
  warning,
  urgent,
  size = 200,
  className,
}: FreshnessGaugeProps) {
  const total = fresh + warning + urgent;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeTotal = total || 1;
  const freshLen = (fresh / safeTotal) * circumference;
  const warningLen = (warning / safeTotal) * circumference;
  const urgentLen = (urgent / safeTotal) * circumference;

  const cx = size / 2;
  const cy = size / 2;

  const freshPct = total === 0 ? 0 : Math.round((fresh / total) * 100);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        {total > 0 && (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--color-fresh)"
              strokeWidth={stroke}
              strokeDasharray={`${freshLen} ${circumference - freshLen}`}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--color-warning)"
              strokeWidth={stroke}
              strokeDasharray={`${warningLen} ${circumference - warningLen}`}
              strokeDashoffset={-freshLen}
              strokeLinecap="round"
            />
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="var(--color-urgent)"
              strokeWidth={stroke}
              strokeDasharray={`${urgentLen} ${circumference - urgentLen}`}
              strokeDashoffset={-(freshLen + warningLen)}
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{freshPct}%</span>
        <span className="text-xs font-medium text-muted-foreground">Fresh</span>
        <span className="mt-1 text-xs text-muted-foreground">{total} items</span>
      </div>
    </div>
  );
}
