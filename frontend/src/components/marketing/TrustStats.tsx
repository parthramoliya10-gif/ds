"use client";

import * as React from "react";
import { CheckCircle2, Clock, School, Star, TrendingUp } from "lucide-react";

export function TrustStats() {
  const stats = [
    {
      value: "12,400+",
      label: "Tasks Completed",
      subtext: "Assignments, manuals & files",
      icon: <CheckCircle2 className="h-4 w-4 stroke-[1.75]" />,
      visual: (
        <div className="flex items-end space-x-1 h-3 pt-1">
          <div className="bg-foreground/30 h-1.5 w-1.5 rounded-sm" />
          <div className="bg-foreground/40 h-2 w-1.5 rounded-sm" />
          <div className="bg-foreground/60 h-2.5 w-1.5 rounded-sm" />
          <div className="bg-foreground/80 h-3 w-1.5 rounded-sm" />
          <div className="bg-foreground h-3.5 w-1.5 rounded-sm" />
        </div>
      ),
    },
    {
      value: "99.4%",
      label: "On-Time Delivery",
      subtext: "Strict deadline adherence",
      icon: <Clock className="h-4 w-4 stroke-[1.75]" />,
      visual: (
        <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden border border-border mt-1">
          <div className="bg-foreground h-full w-[99.4%]" />
        </div>
      ),
    },
    {
      value: "48+",
      label: "Universities Served",
      subtext: "Engineering & Computing colleges",
      icon: <School className="h-4 w-4 stroke-[1.75]" />,
      visual: (
        <div className="flex items-center space-x-1 text-[9px] font-mono text-muted-foreground mt-1">
          <span className="px-1 rounded bg-surface border border-border">DTU</span>
          <span className="px-1 rounded bg-surface border border-border">BITS</span>
          <span className="px-1 rounded bg-surface border border-border">VIT</span>
          <span className="px-1 rounded bg-surface border border-border">+45</span>
        </div>
      ),
    },
    {
      value: "4.9 / 5",
      label: "Student Rating",
      subtext: "From 3,800+ verified submissions",
      icon: <Star className="h-4 w-4 stroke-[1.75]" />,
      visual: (
        <div className="flex text-foreground mt-1 space-x-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-3 w-3 fill-foreground stroke-none" />
          ))}
        </div>
      ),
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10 border-y border-border">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-[10px] border border-border bg-background space-y-2 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {stat.label}
              </span>
              <span className="text-foreground">{stat.icon}</span>
            </div>
            <div>
              <div className="text-[26px] sm:text-[32px] font-bold tracking-tight text-foreground font-mono">
                {stat.value}
              </div>
              <p className="text-[11px] text-muted-foreground leading-normal">
                {stat.subtext}
              </p>
            </div>
            {stat.visual}
          </div>
        ))}
      </div>
    </section>
  );
}
