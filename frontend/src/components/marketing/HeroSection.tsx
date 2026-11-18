"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  Radio,
  DollarSign,
  Lock,
} from "lucide-react";
import { FluidSmokeBackdrop } from "./FluidSmokeBackdrop";
import { TunnelSphereVisual } from "./TunnelSphereVisual";
import { RevealOnScroll } from "./RevealOnScroll";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] bg-[#070707] text-white flex flex-col justify-between py-10 sm:py-14 lg:py-6 px-4 sm:px-8 lg:px-10 overflow-hidden">
      {/* Generative fluid monochrome smoke backdrop */}
      <FluidSmokeBackdrop />

      <div className="max-w-7xl mx-auto w-full flex flex-col justify-between h-full relative z-10 gap-6 sm:gap-8">
        {/* Top Row: Beacon & System Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[12px] font-mono text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>DSMS • Two-Stage 50/50 Milestone Escrow</span>
          </div>

          {/* Glowing Orange Beacon matching editorial design */}
          <div className="flex items-center space-x-2.5 text-[12px] font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_10px_#f97316]" />
            <span className="tracking-tight">live desk : operations queue</span>
            <span className="text-zinc-600">•</span>
            <a
              href="mailto:support@dsms.college"
              className="hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              support@dsms.college
            </a>
          </div>
        </div>

        {/* Center Row: Editorial Headline + Actions + 3D Concentric Tunnel Visual */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center my-6 sm:my-8 lg:my-auto">
          {/* Left Column: Editorial Headline & Actions */}
          <RevealOnScroll className="lg:col-span-7 space-y-4" delayMs={50}>
            <h1 className="text-[28px] sm:text-[38px] lg:text-[44px] font-light tracking-tight text-white/95 leading-[1.14]">
              Academic Document Service — with{" "}
              <span className="font-normal text-white">
                real-time admin chat, custom quotations,
              </span>{" "}
              and guaranteed 50/50 milestone escrow.
            </h1>

            <p className="text-[13px] sm:text-[15px] text-zinc-400 font-light leading-relaxed max-w-xl">
              Submit college assignments, lab manuals, and project reports. Chat 1-on-1 with an admin coordinator to agree on a custom fair quotation in USD ($). Pay 50% advance to start drafting, and 50% final balance to unlock download.
            </p>

            {/* Call to Actions & Direct Access Links */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-11 px-7 text-[13px] font-semibold rounded-full bg-white text-black hover:bg-zinc-200 transition-all shadow-md"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2 stroke-[2.5]" />
                </Button>
              </Link>
              <a
                href="#simulator"
                className="text-[12px] font-mono text-zinc-400 hover:text-white transition-colors ml-2 py-2"
              >
                Explore Overview ↓
              </a>
            </div>
          </RevealOnScroll>

          {/* Right Column: 3D Concentric Tunnel Sphere Visual */}
          <RevealOnScroll className="lg:col-span-5 flex justify-center items-center" delayMs={150}>
            <div className="w-full max-w-[260px] sm:max-w-[340px] lg:max-w-[400px]">
              <TunnelSphereVisual />
            </div>
          </RevealOnScroll>
        </div>

        {/* Bottom Row: Quick Metric Bar with smooth hover animation */}
        <RevealOnScroll delayMs={200}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4 border-t border-white/10 text-left shrink-0">
            <div className="p-2.5 sm:p-3.5 rounded-[12px] bg-white/[0.03] border border-white/10 backdrop-blur-sm min-w-0 hover-lift hover:border-white/25 hover:bg-white/[0.06] transition-all">
              <div className="font-mono text-white text-[12px] sm:text-[13px] font-bold flex items-center truncate">
                <DollarSign className="h-3.5 w-3.5 mr-1 text-emerald-400 shrink-0" />
                $ 50/50 Escrow
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">Half advance, half on release</div>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-[12px] bg-white/[0.03] border border-white/10 backdrop-blur-sm min-w-0 hover-lift hover:border-white/25 hover:bg-white/[0.06] transition-all">
              <div className="font-mono text-white text-[12px] sm:text-[13px] font-bold flex items-center truncate">
                <Radio className="h-3.5 w-3.5 mr-1 text-sky-400 shrink-0" />
                Real-Time Chat
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">Request-isolated socket room</div>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-[12px] bg-white/[0.03] border border-white/10 backdrop-blur-sm min-w-0 hover-lift hover:border-white/25 hover:bg-white/[0.06] transition-all">
              <div className="font-mono text-white text-[12px] sm:text-[13px] font-bold flex items-center truncate">
                <ShieldCheck className="h-3.5 w-3.5 mr-1 text-amber-400 shrink-0" />
                Custom Quotation
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">Agreed in 1-on-1 chat in USD</div>
            </div>
            <div className="p-2.5 sm:p-3.5 rounded-[12px] bg-white/[0.03] border border-white/10 backdrop-blur-sm min-w-0 hover-lift hover:border-white/25 hover:bg-white/[0.06] transition-all">
              <div className="font-mono text-white text-[12px] sm:text-[13px] font-bold flex items-center truncate">
                <Lock className="h-3.5 w-3.5 mr-1 text-purple-400 shrink-0" />
                AES-256 Vault
              </div>
              <div className="text-[10px] sm:text-[11px] text-zinc-400 truncate">Download unlocked on settlement</div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
