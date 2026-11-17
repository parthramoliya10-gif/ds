import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { RequestStatus } from "@/types";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface StatusBadgeProps {
  status: RequestStatus | "payment_due" | "urgent";
  className?: string;
  label?: string;
}

export function StatusBadge({ status, className, label }: StatusBadgeProps) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-border text-foreground font-normal bg-transparent px-2.5 py-0.5",
            className
          )}
        >
          {label || "Pending"}
        </Badge>
      );

    case "in_progress":
    case "advance_paid":
      return (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-border text-[12px] font-medium text-foreground bg-surface",
            className
          )}
        >
          {/* Half-filled dot icon */}
          <svg
            className="h-2.5 w-2.5 shrink-0"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
            <path d="M8 1v14A7 7 0 0 0 8 1z" />
          </svg>
          <span>{label || (status === "advance_paid" ? "Advance Paid" : "In Progress")}</span>
        </div>
      );

    case "ready":
    case "payment_due":
      // Payment due = bold black-border badge
      return (
        <Badge
          variant="boldBorder"
          className={cn(
            "border-2 border-foreground bg-transparent text-foreground px-2.5 py-0.5 font-semibold",
            className
          )}
        >
          {label || (status === "ready" ? "Payment Due" : "Payment Due")}
        </Badge>
      );

    case "completed":
    case "delivered":
      // Completed = solid black badge (in dark mode: solid white badge)
      return (
        <Badge
          variant="default"
          className={cn(
            "bg-foreground text-background font-semibold px-2.5 py-0.5",
            className
          )}
        >
          {label || (status === "delivered" ? "Delivered" : "Completed")}
        </Badge>
      );

    case "urgent":
      // Urgent (under 24h to deadline) = outline badge
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-foreground text-foreground font-semibold bg-transparent gap-1 px-2 py-0.5",
            className
          )}
        >
          <AlertCircle className="h-3 w-3 stroke-[2.5]" />
          {label || "Urgent (<24h)"}
        </Badge>
      );

    case "quoted":
      return (
        <Badge
          variant="outline"
          className={cn(
            "border-border text-foreground bg-surface px-2.5 py-0.5",
            className
          )}
        >
          {label || "Quoted"}
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className={className}>
          {label || status}
        </Badge>
      );
  }
}
