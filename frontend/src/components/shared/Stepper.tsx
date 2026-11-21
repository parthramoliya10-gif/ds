import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RequestStatus } from "@/types";

export interface StepItem {
  id: RequestStatus;
  label: string;
}

export const STEPS: StepItem[] = [
  { id: "pending", label: "Requested" },
  { id: "quoted", label: "Quoted" },
  { id: "advance_paid", label: "Advance paid" },
  { id: "in_progress", label: "In progress" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
];

export interface StepperProps {
  currentStatus: RequestStatus;
  className?: string;
}

export function Stepper({ currentStatus, className }: StepperProps) {
  const norm = (currentStatus || "").toLowerCase();
  const isCancelled = norm === "cancelled";
  const isCompleted = norm === "delivered" || norm === "completed";

  const getStepIndex = (status: string): number => {
    switch (status) {
      case "pending":
        return 0;
      case "quoted":
      case "sent":
        return 1;
      case "advance_paid":
        return 2;
      case "in_progress":
        return 3;
      case "ready":
      case "document_uploaded":
      case "payment_due":
        return 4;
      case "delivered":
      case "completed":
        return 5;
      default:
        return 0;
    }
  };

  const activeIndex = getStepIndex(norm);

  if (isCancelled) {
    return (
      <div className={cn("w-full py-2", className)}>
        <div className="flex items-center justify-center p-3 rounded-[6px] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-[13px] font-medium">
          This order has been cancelled.
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto py-2", className)}>
      <div className="min-w-[620px] px-4 flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isDone = isCompleted ? true : idx < activeIndex;
          const isCurrent = !isCompleted && idx === activeIndex;
          const isUpcoming = isCompleted ? false : idx > activeIndex;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle & Label */}
              <div className="flex flex-col items-center text-center relative z-10 flex-shrink-0 group">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all",
                    // done = filled with check
                    isDone && "bg-foreground text-background border border-foreground",
                    // current = ring
                    isCurrent && "border-2 border-foreground bg-background text-foreground ring-4 ring-border/50",
                    // upcoming = empty
                    isUpcoming && "border border-border bg-surface text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <Check className="h-4 w-4 stroke-[3]" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-[12px] whitespace-nowrap font-medium transition-colors",
                    isCurrent
                      ? "text-foreground font-semibold"
                      : isDone
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (equal connector) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-[2px] mx-2 -mt-6 transition-colors",
                    isCompleted || idx < activeIndex ? "bg-foreground" : "bg-border"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
