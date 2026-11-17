"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatCurrencyINR } from "@/lib/utils";

const monthlyRevenueData = [
  { month: "Jun", revenue: 2200 },
  { month: "Jul", revenue: 3100 },
  { month: "Aug", revenue: 4200 },
  { month: "Sep", revenue: 3800 },
  { month: "Oct", revenue: 6400 },
  { month: "Nov", revenue: 5400 },
];

export function RevenueLineChart() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-surface animate-pulse rounded-[8px]" />;
  }

  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={monthlyRevenueData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₹${value / 1000}k`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-[8px] border border-border bg-background p-2.5 shadow-none text-[12px]">
                    <p className="text-muted-foreground font-medium">{label}</p>
                    <p className="font-semibold text-foreground text-[14px] mt-0.5">
                      {formatCurrencyINR(payload[0].value as number)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="var(--foreground)"
            strokeWidth={2}
            dot={{ r: 4, fill: "var(--background)", stroke: "var(--foreground)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--foreground)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
