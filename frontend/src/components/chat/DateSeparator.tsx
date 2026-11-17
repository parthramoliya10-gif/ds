import * as React from "react";
import { cn } from "@/lib/utils";

export function DateSeparator({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center my-4", className)}>
      <div className="border-t border-border flex-1" />
      <span className="mx-3 px-3 py-1 rounded-full border border-border bg-background text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <div className="border-t border-border flex-1" />
    </div>
  );
}
