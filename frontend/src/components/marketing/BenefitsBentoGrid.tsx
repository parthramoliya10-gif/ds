"use client";

import * as React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
  Terminal,
  FileCheck,
  Zap,
  ArrowRight,
  Cpu,
  FileCode,
  DollarSign,
} from "lucide-react";

export function BenefitsBentoGrid() {
  const [escrowStep, setEscrowStep] = React.useState<"advance" | "balance">("balance");

  return (
    <section id="benefits" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <Zap className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Core Student Outcomes</span>
        </div>
        <h2 className="text-[32px] sm:text-[46px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
          Engineered to Eliminate Academic Stress
        </h2>
        <p className="text-[15px] sm:text-[17px] text-zinc-500 max-w-2xl mx-auto leading-relaxed font-light">
          Built around institutional accuracy, zero financial risk, and verified execution traces so you submit with absolute confidence.
        </p>
      </div>

      {/* Bento Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
        {/* Bento 1: Large 2-column (md:col-span-8) - Zero Upfront Risk (50/50 Escrow) */}
        <div className="md:col-span-8 p-6 sm:p-8 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <DollarSign className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Financial Protection</span>
            </div>
            <h3 className="text-[22px] sm:text-[28px] font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              Zero Upfront Risk — Guaranteed 50/50 Milestone Escrow
            </h3>
            <p className="text-[14px] sm:text-[15px] text-zinc-500 leading-relaxed font-light max-w-2xl">
              Never pay in full before inspecting genuine work. 50% advance starts research and drafting; the remaining 50% balance is released strictly after you inspect the watermarked deliverable and approve the quality.
            </p>
          </div>

          {/* Interactive Escrow Meter Visual */}
          <div className="p-4 sm:p-5 rounded-[14px] bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between text-[12px] font-mono">
              <span className="text-zinc-500">Live Escrow Split Simulation ($80 Task):</span>
              <button
                onClick={() => setEscrowStep(escrowStep === "advance" ? "balance" : "advance")}
                className="px-2.5 py-1 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                Toggle Phase: {escrowStep === "advance" ? "1. Advance Held" : "2. Balance Cleared"}
              </button>
            </div>

            {/* Split Progress Meter */}
            <div className="relative w-full h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-zinc-900 dark:bg-zinc-100 w-1/2 transition-all duration-500" />
              <div
                className={`h-full transition-all duration-500 ${
                  escrowStep === "balance"
                    ? "bg-zinc-900 dark:bg-zinc-100 w-1/2"
                    : "bg-transparent w-1/2"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase">Milestone 1 (50%)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px]">$40.00 Advance</span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">Specialist initiates research</span>
              </div>
              <div className="p-2.5 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase">Milestone 2 (50%)</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[14px]">
                  {escrowStep === "balance" ? "$40.00 Released ✓" : "$40.00 In Escrow"}
                </span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">
                  {escrowStep === "balance" ? "300 DPI PDF decrypted" : "Held until you approve preview"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 2: 1-column (md:col-span-4) - Institutional Accuracy & A+ Grade Formatting */}
        <div className="md:col-span-4 p-6 sm:p-8 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Institutional Rigor</span>
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              Guaranteed A+ Academic Formatting
            </h3>
            <p className="text-[13px] sm:text-[14px] text-zinc-500 leading-relaxed font-light">
              Zero formatting or calculation errors. Every proof, observation table, and circuit diagram strictly adheres to your submitted college rubric.
            </p>
          </div>

          {/* Academic Verification Card (Zero Code!) */}
          <div className="p-4 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-zinc-500">Evaluation Rubric:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Grade A+ Match ✓
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Calculations &amp; Formulas:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">100% Accurate</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Diagrams &amp; Graphs:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">High-Res Vector</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Formatting Standard:</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">IEEE / College-Ruled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 3: 1-column (md:col-span-4) - Real-Time Specialist Sync */}
        <div className="md:col-span-4 p-6 sm:p-8 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <Radio className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Direct Collaboration</span>
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              Direct Specialist Chat
            </h3>
            <p className="text-[13px] sm:text-[14px] text-zinc-500 leading-relaxed font-light">
              Talk directly with the engineering specialist drafting your document in an isolated WebSocket channel. No middlemen, no wait times.
            </p>
          </div>

          {/* Chat Bubble Mockup */}
          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[11px]">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
              <span className="flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Specialist Connected
              </span>
              <span>Room #req-1003</span>
            </div>
            <div className="p-2 rounded-[8px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300">
              <span className="font-bold text-[10px] block text-zinc-900 dark:text-zinc-100">Dr. S. Ramanujan:</span>
              Added the Wireshark pcap traces to section 4 as per your university rubric.
            </div>
          </div>
        </div>

        {/* Bento 4: 1-column (md:col-span-4) - AES-256 Vault */}
        <div className="md:col-span-4 p-6 sm:p-8 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <Lock className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Vault Security</span>
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              AES-256 Download Gatekeeper
            </h3>
            <p className="text-[13px] sm:text-[14px] text-zinc-500 leading-relaxed font-light">
              Watermarked previews ensure verification before payment. Pre-signed cryptographic tokens release original 300 DPI files upon settlement.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between font-mono text-[11px]">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Pre-Signed URL</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 text-[10px]">
              Exp: 3600s
            </span>
          </div>
        </div>

        {/* Bento 5: 1-column (md:col-span-4) - Rubric & Anti-Plagiarism Guarantee */}
        <div className="md:col-span-4 p-6 sm:p-8 rounded-[20px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <FileCheck className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Academic Integrity</span>
            </div>
            <h3 className="text-[20px] sm:text-[24px] font-normal tracking-tight text-zinc-900 dark:text-zinc-50 leading-snug">
              Turnitin &lt; 5% &amp; Strict Rubric Match
            </h3>
            <p className="text-[13px] sm:text-[14px] text-zinc-500 leading-relaxed font-light">
              IEEE two-column, ACM template, or neat handwritten scans on college-ruled sheets. Genuine Turnitin similarity certificate included with every submission.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-500">Similarity Score:</span>
            <span className="font-bold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
              1.2% (Turnitin Report)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
