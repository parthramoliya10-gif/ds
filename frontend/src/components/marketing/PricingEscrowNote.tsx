"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Check, DollarSign, Calculator, ArrowRight, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PricingEscrowNote() {
  const [taskType, setTaskType] = React.useState<"assignment" | "lab_manual" | "practical_file" | "project_report">("lab_manual");
  const [pages, setPages] = React.useState(30);

  const rates: Record<string, { name: string; ratePerPage: number; defaultPages: number }> = {
    assignment: { name: "Subject Assignment", ratePerPage: 2, defaultPages: 20 },
    lab_manual: { name: "Lab Manual (Code + Outputs)", ratePerPage: 2.5, defaultPages: 30 },
    practical_file: { name: "Practical File", ratePerPage: 1.8, defaultPages: 35 },
    project_report: { name: "Project / Thesis Report", ratePerPage: 3, defaultPages: 50 },
  };

  const totalEstimate = Math.round(pages * rates[taskType].ratePerPage);
  const advanceMilestone = Math.round(totalEstimate / 2);
  const balanceMilestone = totalEstimate - advanceMilestone;

  return (
    <section id="pricing" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-border">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-surface text-[12px] font-mono text-muted-foreground">
          <DollarSign className="h-3.5 w-3.5 text-foreground" />
          <span>Transparent 50/50 Milestone Escrow (USD $)</span>
        </div>
        <h2 className="text-[30px] sm:text-[40px] font-bold tracking-tight text-foreground">
          Why Students Never Pay 100% Upfront
        </h2>
        <p className="text-[15px] sm:text-[16px] text-muted-foreground leading-relaxed">
          Unlike generic writing sites that demand full payment before you see a single line of work,
          DSMS splits every quotation into two equal milestones held securely in escrow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Escrow Model Details (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-[10px] border border-border bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center text-[15px]">
                  <Check className="h-4 w-4 mr-1.5 text-foreground" />
                  Milestone 1: 50% Advance
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Starts Work
                </Badge>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Initiates work immediately. Academic specialist begins researching, compiling code, creating simulation diagrams, and drafting clean sheets.
              </p>
            </div>

            <div className="p-5 rounded-[10px] border border-border bg-background space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center text-[15px]">
                  <Lock className="h-4 w-4 mr-1.5 text-foreground" />
                  Milestone 2: 50% Balance
                </span>
                <Badge variant="outline" className="font-mono text-[10px]">
                  Unlocks File
                </Badge>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                Paid strictly after the document is finalized and you inspect the watermarked preview. Decryption token is released instantly.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-[10px] border border-border bg-surface/50 space-y-3 text-[13px]">
            <span className="font-semibold text-foreground flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-foreground" />
              Complete Peace-of-Mind Guarantee
            </span>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start space-x-2">
                <span className="text-foreground">•</span>
                <span>All source codes verified in genuine Linux/Windows terminal environments</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-foreground">•</span>
                <span>Strict on-time commitment: Missed agreed deadline triggers full advance refund</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-foreground">•</span>
                <span>Two complimentary revision rounds included within 7 days of final delivery</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side: Interactive Milestone Calculator (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="rounded-[10px] border border-border bg-background shadow-none p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-foreground" />
                <h3 className="text-[15px] font-bold text-foreground">Interactive Escrow Calculator</h3>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                USD ($)
              </Badge>
            </div>

            {/* Select Task Type */}
            <div className="space-y-2">
              <label className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Select Task Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(rates).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setTaskType(key as any);
                      setPages(val.defaultPages);
                    }}
                    className={`p-2.5 rounded-[6px] border text-left text-[12px] transition-colors ${
                      taskType === key
                        ? "border-foreground bg-surface font-semibold text-foreground"
                        : "border-border text-muted-foreground hover:bg-surface/50"
                    }`}
                  >
                    {val.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Pages Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[12px]">
                <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                  Document Scope
                </span>
                <span className="font-mono font-bold text-foreground">{pages} Pages</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={pages}
                onChange={(e) => setPages(Number(e.target.value))}
                className="w-full accent-foreground cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>5 pgs</span>
                <span>30 pgs</span>
                <span>60 pgs</span>
                <span>100 pgs</span>
              </div>
            </div>

            {/* Milestone Calculation Result Box */}
            <div className="p-4 rounded-[8px] bg-surface border border-border space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-[12px] text-muted-foreground">Estimated Total:</span>
                <span className="text-[28px] font-bold font-mono text-foreground">
                  {formatCurrency(totalEstimate)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[12px]">
                <div className="p-2.5 rounded bg-background border border-border space-y-0.5">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">50% Advance</span>
                  <span className="font-bold text-foreground font-mono text-[15px]">
                    {formatCurrency(advanceMilestone)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">To initiate work</span>
                </div>
                <div className="p-2.5 rounded bg-background border border-border space-y-0.5">
                  <span className="text-muted-foreground text-[10px] uppercase font-semibold block">50% Balance</span>
                  <span className="font-bold text-foreground font-mono text-[15px]">
                    {formatCurrency(balanceMilestone)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">To unlock download</span>
                </div>
              </div>
            </div>

            <Link href="/user/requests/new" className="block w-full">
              <Button className="w-full h-10 text-[13px] font-semibold">
                Submit Task for Exact Quotation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </section>
  );
}
