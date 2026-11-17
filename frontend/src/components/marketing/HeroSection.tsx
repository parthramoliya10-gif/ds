import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShieldCheck, CheckCircle2, Clock, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center">
      {/* Platform Pill */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-surface text-[12px] font-medium text-foreground mb-6">
        <Sparkles className="h-3.5 w-3.5 stroke-[2]" />
        <span>India&apos;s Dedicated Academic Fulfillment Platform</span>
      </div>

      {/* Main Bold Headline */}
      <h1 className="text-[38px] sm:text-[56px] md:text-[64px] font-bold tracking-tight text-foreground leading-[1.08] mb-6">
        College tasks solved. <br />
        <span className="text-muted-foreground font-normal">
          Handwritten or typed, delivered on time.
        </span>
      </h1>

      {/* Supporting Subtext */}
      <p className="max-w-2xl mx-auto text-[16px] sm:text-[18px] text-muted-foreground mb-8 leading-relaxed">
        Submit lab manuals, subject assignments, practical files, and project reports.
        Direct chat with specialized admins, protected 50-50 milestone escrow, and verified university formatting.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10">
        <Link href="/user/requests/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-[15px] font-semibold">
            Submit your task
            <ArrowRight className="h-4 w-4 ml-2 stroke-[2.5]" />
          </Button>
        </Link>
        <Link href="/how-it-works" className="w-full sm:w-auto">
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-[15px] border-border font-medium">
            How Milestones Work
          </Button>
        </Link>
      </div>

      {/* Trust Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[12px] text-muted-foreground">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-[6px] bg-surface border border-border">
          <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
          <span>50/50 Milestone Escrow</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-[6px] bg-surface border border-border">
          <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />
          <span>Verified Code &amp; Traces</span>
        </div>
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-[6px] bg-surface border border-border">
          <Clock className="h-3.5 w-3.5 text-foreground" />
          <span>Under 24h Express Available</span>
        </div>
      </div>
    </section>
  );
}
