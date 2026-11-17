import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  helperText?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  helperText,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("p-4 border border-border bg-background rounded-[8px]", className)}>
      <CardContent className="p-0 flex flex-col justify-between h-full space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {icon && (
            <div className="text-foreground h-4 w-4 shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
        </div>
        <div className="text-[26px] font-semibold tracking-tight text-foreground">
          {value}
        </div>
        {helperText && (
          <p className="text-[12px] text-muted-foreground leading-normal">
            {helperText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
