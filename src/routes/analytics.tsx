import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingDown, PiggyBank, Trash2, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui-app/PageHeader";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui-app/StatCard";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Inventory Pulse" },
      { name: "description", content: "Waste, savings, and usage trends for your kitchen." },
    ],
  }),
  component: AnalyticsPage,
});

const wasteByMonth = [
  { month: "Jan", waste: 6.2, used: 28 },
  { month: "Feb", waste: 5.4, used: 30 },
  { month: "Mar", waste: 4.8, used: 32 },
  { month: "Apr", waste: 3.9, used: 35 },
  { month: "May", waste: 3.2, used: 38 },
  { month: "Jun", waste: 2.4, used: 41 },
];

const savings = [
  { month: "Jan", value: 24 },
  { month: "Feb", value: 32 },
  { month: "Mar", value: 41 },
  { month: "Apr", value: 36 },
  { month: "May", value: 48 },
  { month: "Jun", value: 58 },
];

const categoryUsage = [
  { name: "Produce", value: 38, color: "var(--color-fresh)" },
  { name: "Dairy", value: 22, color: "var(--color-chart-4)" },
  { name: "Meat", value: 14, color: "var(--color-urgent)" },
  { name: "Pantry", value: 18, color: "var(--color-warning)" },
  { name: "Other", value: 8, color: "var(--color-chart-5)" },
];

function AnalyticsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Track waste, savings, and habits over time"
      />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Waste" value="2.4 kg" icon={Trash2} tone="warning" trend="-23%" />
        <StatCard label="Saved" value="$58" icon={PiggyBank} tone="fresh" trend="+21%" />
        <StatCard label="Usage" value="92%" icon={TrendingDown} trend="this month" />
      </div>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Waste vs used (kg)</h2>
          <span className="text-[10px] text-muted-foreground">Last 6 months</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wasteByMonth} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="used" fill="var(--color-fresh)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="waste" fill="var(--color-urgent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Money saved ($)</h2>
          <span className="text-[10px] text-muted-foreground">Trend</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={savings}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--color-muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-primary)"
                strokeWidth={2.5}
                dot={{ fill: "var(--color-primary)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="text-sm font-semibold text-foreground">Usage by category</h2>
        <div className="flex items-center gap-3">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryUsage}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={2}
                >
                  {categoryUsage.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex-1 space-y-1.5">
            {categoryUsage.map((c) => (
              <li key={c.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 text-foreground">{c.name}</span>
                <span className="font-medium text-muted-foreground">{c.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="flex items-start gap-3 border-primary/30 bg-primary/5 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="text-xs text-foreground">
          <p className="font-semibold">Insight</p>
          <p className="mt-0.5 text-muted-foreground">
            You've cut waste by 23% this month — keep using up produce within 5 days of buying.
          </p>
        </div>
      </Card>
    </div>
  );
}
