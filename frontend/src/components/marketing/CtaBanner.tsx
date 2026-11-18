"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function CtaBanner() {
  return (
    <section className="w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-center py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800">
      <RevealOnScroll className="w-full my-6 sm:my-8 lg:my-auto">
        <div className="relative rounded-[24px] bg-[#070707] text-white p-7 sm:p-12 lg:p-14 text-center space-y-6 overflow-hidden border border-white/10 shadow-2xl hover-lift transition-all">
          {/* Ambient radial glow backdrop */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(255,255,255,0.08)_0%,transparent_65%)] pointer-events-none" />

          {/* Live Status Label */}
          <div className="flex items-center justify-center space-x-2 text-[12px] font-mono text-zinc-400 relative z-10">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
            <span>24/7 Operations Desk • Specialists Ready</span>
          </div>

          {/* Bold Headline */}
          <div className="max-w-3xl mx-auto space-y-2 relative z-10">
            <h2 className="text-[26px] sm:text-[38px] lg:text-[44px] font-light tracking-tight text-white/95 leading-[1.14]">
              Ready to Complete Your Task with Zero Financial Risk?
            </h2>
            <p className="max-w-xl mx-auto text-[13px] sm:text-[15px] text-zinc-400 font-light leading-relaxed">
              Submit your rubric in under 2 minutes. Receive a guaranteed 50/50 milestone quotation from a verified specialist and relax while we draft.
            </p>
          </div>

          {/* Dual High-Contrast Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 pt-1">
            <Link href="/user/requests/new" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-11 px-7 text-[13px] font-semibold rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-lg"
              >
                Submit Your Task Now
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/services" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-7 text-[13px] font-medium rounded-full border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white transition-all"
              >
                Browse Catalog
              </Button>
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-white/10 text-[11px] font-mono text-zinc-400 relative z-10">
            <span className="flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              50% Advance Milestone
            </span>
            <span>•</span>
            <span className="flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-sky-400" />
              Inspect Watermarked Preview First
            </span>
            <span>•</span>
            <span className="flex items-center">
              <Lock className="h-3.5 w-3.5 mr-1 text-purple-400" />
              100% Encrypted &amp; Confidential
            </span>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
