import * as React from "react";
import { CheckCircle2, Clock, School, Star } from "lucide-react";

export function TrustStats() {
  const stats = [
    {
      value: "12,400+",
      label: "Tasks Completed",
      subtext: "Assignments, manuals & files",
      icon: <CheckCircle2 className="h-4 w-4 stroke-[1.75]" />,
    },
    {
      value: "99.4%",
      label: "On-Time Delivery",
      subtext: "Strict adherence to deadlines",
      icon: <Clock className="h-4 w-4 stroke-[1.75]" />,
    },
    {
      value: "48+",
      label: "Universities Served",
      subtext: "DTU, NSUT, BITS, VIT, IITs",
      icon: <School className="h-4 w-4 stroke-[1.75]" />,
    },
    {
      value: "4.9 / 5",
      label: "Student Rating",
      subtext: "From 3,800+ verified reviews",
      icon: <Star className="h-4 w-4 stroke-[1.75]" />,
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 border-y border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-[8px] border border-border bg-background space-y-1.5"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[12px] font-semibold uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="text-foreground">{stat.icon}</span>
            </div>
            <div className="text-[28px] sm:text-[34px] font-bold tracking-tight text-foreground font-mono">
              {stat.value}
            </div>
            <p className="text-[12px] text-muted-foreground leading-normal">
              {stat.subtext}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
