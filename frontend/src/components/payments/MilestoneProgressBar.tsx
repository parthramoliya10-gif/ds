import * as React from "react";
import { Check, Lock, Hourglass } from "lucide-react";
import { formatCurrencyINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface MilestoneProgressBarProps {
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  advancePaid: boolean;
  balancePaid: boolean;
  className?: string;
}

export function MilestoneProgressBar({
  totalAmount,
  advanceAmount,
  remainingAmount,
  advancePaid,
  balancePaid,
  className,
}: MilestoneProgressBarProps) {
  return (
    <div className={cn("rounded-[8px] border border-border bg-background p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            50-50 Escrow Milestones
          </span>
          <h4 className="text-[18px] font-semibold text-foreground tracking-tight">
            Total {formatCurrencyINR(totalAmount)}
          </h4>
        </div>
        <div className="text-right">
          <span className="text-[12px] text-muted-foreground">Payment Status</span>
          <p className="text-[14px] font-semibold text-foreground">
            {balancePaid
              ? "100% Paid • Fully Unlocked"
              : advancePaid
              ? "50% Advance Paid • In Progress"
              : "0% Paid • Pending Advance"}
          </p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="relative mb-6">
        <div className="h-1.5 w-full bg-surface border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground transition-all duration-500"
            style={{
              width: balancePaid ? "100%" : advancePaid ? "50%" : "0%",
            }}
          />
        </div>
      </div>

      {/* 2 Milestone Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Milestone 1: 50% Advance */}
        <div
          className={cn(
            "p-3.5 rounded-[8px] border transition-colors",
            advancePaid ? "border-foreground bg-surface" : "border-border bg-background"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">
              Milestone 1: 50% Advance
            </span>
            {advancePaid ? (
              <span className="inline-flex items-center text-[11px] font-semibold text-foreground">
                <Check className="h-3.5 w-3.5 mr-1 stroke-[2.5]" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] text-muted-foreground">
                <Hourglass className="h-3 w-3 mr-1" /> Pending
              </span>
            )}
          </div>
          <p className="text-[18px] font-semibold text-foreground">
            {formatCurrencyINR(advanceAmount)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Required for admin specialist to begin drafting assignment.
          </p>
        </div>

        {/* Milestone 2: 50% Remaining */}
        <div
          className={cn(
            "p-3.5 rounded-[8px] border transition-colors",
            balancePaid
              ? "border-foreground bg-surface"
              : "border-dashed border-border bg-background"
          )}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] font-medium text-muted-foreground">
              Milestone 2: 50% Balance
            </span>
            {balancePaid ? (
              <span className="inline-flex items-center text-[11px] font-semibold text-foreground">
                <Check className="h-3.5 w-3.5 mr-1 stroke-[2.5]" /> Paid
              </span>
            ) : (
              <span className="inline-flex items-center text-[11px] font-medium text-foreground">
                <Lock className="h-3 w-3 mr-1" /> Locks Download
              </span>
            )}
          </div>
          <p className="text-[18px] font-semibold text-foreground">
            {formatCurrencyINR(remainingAmount)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Paid upon document completion to permanently unlock download link.
          </p>
        </div>
      </div>
    </div>
  );
}
