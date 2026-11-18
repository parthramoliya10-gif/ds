"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface WeeklyRequestsBarChartProps {
  data?: { day: string; requests: number }[];
}

export function WeeklyRequestsBarChart({ data }: WeeklyRequestsBarChartProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-64 w-full bg-surface animate-pulse rounded-[8px]" />;
  }

  const chartData = data && data.length > 0 ? data : [
    { day: "Mon", requests: 0 },
    { day: "Tue", requests: 0 },
    { day: "Wed", requests: 0 },
    { day: "Thu", requests: 0 },
    { day: "Fri", requests: 0 },
    { day: "Sat", requests: 0 },
    { day: "Sun", requests: 0 },
  ];

  return (
    <div className="w-full h-64 pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="day"
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
            allowDecimals={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-[8px] border border-border bg-background p-2.5 shadow-none text-[12px]">
                    <p className="text-muted-foreground font-medium">{label}</p>
                    <p className="font-semibold text-foreground text-[14px] mt-0.5">
                      {payload[0].value} Tasks Submitted
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="requests"
            fill="var(--foreground)"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
