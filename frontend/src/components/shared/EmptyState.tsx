import * as React from "react";
import { cn } from "@/lib/utils";
import { FolderOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-[8px] border border-dashed border-border bg-surface/30 min-h-[220px]",
        className
      )}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full border border-border bg-background mb-4 text-foreground">
        {icon || <FolderOpen className="h-6 w-6 stroke-[1.5]" />}
      </div>
      <h4 className="text-[18px] font-semibold tracking-tight text-foreground mb-1">
        {title}
      </h4>
      <p className="text-[14px] text-muted-foreground max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
