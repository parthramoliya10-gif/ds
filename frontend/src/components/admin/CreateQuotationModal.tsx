"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Quotation } from "@/types";
import api from "@/lib/api/client";
import { adaptQuotationToFrontend } from "@/lib/api/adapters";
import { formatCurrencyINR } from "@/lib/utils";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface CreateQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string;
  requestTitle: string;
  defaultAmount?: number;
  onSubmitQuotation: (quotation: Quotation) => void;
}

export function CreateQuotationModal({
  isOpen,
  onClose,
  requestId,
  requestTitle,
  defaultAmount = 1400,
  onSubmitQuotation,
}: CreateQuotationModalProps) {
  const [amount, setAmount] = React.useState<number>(defaultAmount);
  const [deliveryDate, setDeliveryDate] = React.useState("Within 24 Hours");
  const [notes, setNotes] = React.useState(
    "Includes full source code implementation, verified screenshots, and organization-standard formatting."
  );
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (defaultAmount) setAmount(defaultAmount);
  }, [defaultAmount]);

  // Auto 50/50 calculation
  const advanceAmount = Math.round(amount / 2);
  const remainingAmount = amount - advanceAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 100) {
      toast.error("Total quotation amount must be at least $100.");
      return;
    }
    if (!deliveryDate.trim()) {
      toast.error("Estimated delivery turnaround is required.");
      return;
    }

    setSubmitting(true);
    try {
      if (requestId && !requestId.startsWith("REQ-100")) {
        const created = await api.quotations.create({
          requestId,
          totalAmount: Number(amount),
          terms: notes,
          estimatedDays: deliveryDate.includes("24") ? 1 : 2,
        });
        if (created) {
          const adapted = adaptQuotationToFrontend(created);
          onSubmitQuotation(adapted);
          setSubmitting(false);
          toast.success(`Quotation for ${formatCurrencyINR(amount)} dispatched to student.`);
          onClose();
          return;
        }
      }
    } catch (apiErr: any) {
      console.warn("Backend quotation error, using local fallback:", apiErr);
    }

    await new Promise((resolve) => setTimeout(resolve, 350));

    const newQuotation: Quotation = {
      id: "QT-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      requestId,
      amount,
      advanceAmount,
      remainingAmount,
      estimatedDelivery: deliveryDate,
      status: "pending",
      createdAt: new Date().toISOString(),
      notes,
    };

    onSubmitQuotation(newQuotation);
    setSubmitting(false);
    toast.success(`Quotation for ${formatCurrencyINR(amount)} dispatched to student.`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border border-border bg-background p-6 rounded-[8px] shadow-none">
        <DialogHeader className="space-y-1 pb-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-4 w-4 text-foreground" />
            <DialogTitle className="text-[18px] font-semibold text-foreground">
              Create Official Quotation
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-muted-foreground line-clamp-1">
            {requestId} • {requestTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Total Amount Input */}
          <div className="space-y-1.5">
            <Label htmlFor="quotationAmount" className="text-[13px]">
              Total Quotation Amount (USD $)
            </Label>
            <Input
              id="quotationAmount"
              type="number"
              min="100"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value) || 0)}
              placeholder="e.g. 500"
              className="text-[16px] font-semibold h-10 font-mono"
              required
            />
          </div>

          {/* Automatic 50/50 Milestone Split Preview */}
          <div className="p-3.5 rounded-[8px] border border-border bg-surface space-y-2 text-[13px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
              Auto 50-50 Escrow Split
            </span>
            <div className="flex justify-between items-center py-1 border-b border-border">
              <span className="text-foreground">Milestone 1: 50% Advance (Start Work)</span>
              <span className="font-semibold text-foreground">
                {formatCurrencyINR(advanceAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-muted-foreground">Milestone 2: 50% Balance (Unlock Download)</span>
              <span className="font-semibold text-foreground">
                {formatCurrencyINR(remainingAmount)}
              </span>
            </div>
          </div>

          {/* Delivery Turnaround */}
          <div className="space-y-1.5">
            <Label htmlFor="deliveryDate" className="text-[13px]">
              Estimated Delivery Turnaround
            </Label>
            <Input
              id="deliveryDate"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              placeholder="e.g. Within 24 Hours or 3 Days"
              className="text-[13px] h-9"
              required
            />
          </div>

          {/* Notes / Scope */}
          <div className="space-y-1.5">
            <Label htmlFor="quotationNotes" className="text-[13px]">
              Scope Notes & Deliverables Description
            </Label>
            <Textarea
              id="quotationNotes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes full handwritten assignment on ruled sheets with flowcharts and verified outputs..."
              className="text-[13px]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 text-[13px] border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || amount <= 0}
              className="h-9 text-[13px] font-semibold"
            >
              {submitting ? "Sending..." : "Dispatch Quotation"}
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
