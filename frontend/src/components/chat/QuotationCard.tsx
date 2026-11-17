import * as React from "react";
import { Quotation } from "@/types";
import { formatCurrencyINR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QuotationCardProps {
  quotation: Quotation;
  onAcceptAndPay?: (quotation: Quotation) => void;
  onRequestChange?: (quotation: Quotation) => void;
  className?: string;
  isAdmin?: boolean;
}

export function QuotationCard({
  quotation,
  onAcceptAndPay,
  onRequestChange,
  className,
  isAdmin = false,
}: QuotationCardProps) {
  const isPending = quotation.status === "pending";
  const isAccepted = quotation.status === "accepted";

  return (
    <div
      className={cn(
        "rounded-[8px] border border-border bg-background p-4 sm:p-5 max-w-md w-full shadow-none my-3 text-foreground",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-4 w-4 text-foreground" />
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            Milestone Quotation
          </span>
        </div>
        <div>
          {isAccepted ? (
            <Badge variant="default" className="text-[11px] font-semibold bg-foreground text-background">
              Accepted
            </Badge>
          ) : isPending ? (
            <Badge variant="boldBorder" className="text-[11px]">
              Pending Approval
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[11px] text-muted-foreground">
              {quotation.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Total & Delivery Time */}
      <div className="py-3 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-muted-foreground block">Total Amount</span>
          <span className="text-[26px] font-bold tracking-tight text-foreground">
            {formatCurrencyINR(quotation.amount)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-muted-foreground block">Delivery Time</span>
          <span className="inline-flex items-center text-[13px] font-medium text-foreground">
            <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
            {quotation.estimatedDelivery}
          </span>
        </div>
      </div>

      {/* 50-50 Milestone Split Breakdown */}
      <div className="space-y-2 py-3 border-y border-border text-[13px]">
        <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface border border-border">
          <span className="font-medium text-foreground">
            Milestone 1: 50% Advance
          </span>
          <span className="font-semibold text-foreground">
            {formatCurrencyINR(quotation.advanceAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 rounded-[6px] border border-dashed border-border text-muted-foreground">
          <span>Milestone 2: 50% Remaining (Unlocks Download)</span>
          <span className="font-semibold text-foreground">
            {formatCurrencyINR(quotation.remainingAmount)}
          </span>
        </div>
      </div>

      {quotation.notes && (
        <p className="text-[12px] text-muted-foreground py-3 leading-relaxed">
          <strong className="text-foreground">Scope:</strong> {quotation.notes}
        </p>
      )}

      {/* Action Buttons or Status Confirmation */}
      <div className="pt-2">
        {isAdmin ? (
          <div className="flex items-center justify-between p-2.5 rounded-[6px] bg-surface border border-border text-[12px]">
            <span className="text-muted-foreground">
              Status: <strong className="text-foreground capitalize">{quotation.status}</strong>
            </span>
            {isPending && (
              <span className="text-muted-foreground font-medium">Awaiting Student Payment</span>
            )}
            {isAccepted && (
              <span className="text-foreground font-semibold flex items-center">
                <Check className="h-3.5 w-3.5 mr-1 stroke-[2.5]" /> Advance Received (50%)
              </span>
            )}
          </div>
        ) : isPending ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              className="flex-1 h-9 text-[13px] font-medium"
              onClick={() => onAcceptAndPay?.(quotation)}
            >
              Accept & Pay Advance ({formatCurrencyINR(quotation.advanceAmount)})
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 text-[13px] border-border"
              onClick={() => onRequestChange?.(quotation)}
            >
              Request Change
            </Button>
          </div>
        ) : isAccepted ? (
          <div className="flex items-center justify-center p-2 rounded-[6px] bg-surface border border-border text-[12px] text-foreground font-medium">
            <Check className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Advance paid ({formatCurrencyINR(quotation.advanceAmount)}). Work is in progress.
          </div>
        ) : (
          <div className="text-center text-[12px] text-muted-foreground">
            This quotation is {quotation.status}.
          </div>
        )}
      </div>
    </div>
  );
}
