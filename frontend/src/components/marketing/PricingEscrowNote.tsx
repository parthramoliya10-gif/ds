import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock, Check, HelpCircle } from "lucide-react";

export function PricingEscrowNote() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <Card className="rounded-[8px] border border-border bg-surface p-6 sm:p-8 shadow-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-[6px] bg-background border border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
              <span>The 50/50 Escrow Model</span>
            </div>

            <h3 className="text-[20px] sm:text-[24px] font-bold text-foreground tracking-tight">
              Why students never pay 100% upfront
            </h3>

            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Unlike generic assignment portals that demand full advance payment before you see a single line of work, DSMS splits every order into two equal milestones:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[13px]">
              <div className="p-3 rounded-[6px] bg-background border border-border space-y-1">
                <span className="font-semibold text-foreground flex items-center">
                  <Check className="h-3.5 w-3.5 mr-1 text-foreground" />
                  Milestone 1: 50% Advance
                </span>
                <p className="text-[12px] text-muted-foreground">
                  Starts work immediately. Specialist begins coding, compiling traces, or hand-writing sheets.
                </p>
              </div>

              <div className="p-3 rounded-[6px] bg-background border border-border space-y-1">
                <span className="font-semibold text-foreground flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1 text-foreground" />
                  Milestone 2: 50% Balance
                </span>
                <p className="text-[12px] text-muted-foreground">
                  Paid strictly after the document is finalized and you inspect the watermarked preview.
                </p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-center sm:items-start space-y-3">
            <div className="p-4 rounded-[8px] bg-background border border-border text-center sm:text-left space-y-1">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground block">
                Typical Starting Fee
              </span>
              <div className="text-[28px] font-bold font-mono text-foreground">
                ₹300 <span className="text-[13px] font-normal text-muted-foreground">/ manual</span>
              </div>
              <span className="text-[11px] text-muted-foreground block">
                No hidden charges • GST invoice included
              </span>
            </div>

            <Link href="/how-it-works" className="w-full">
              <Button variant="outline" size="sm" className="w-full text-[13px] border-border">
                Read Guarantee Terms
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </section>
  );
}
