"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FileUp,
  CreditCard,
  Download,
  Check,
  ShieldCheck,
  Radio,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";

export function HowItWorksSteps() {
  const steps = [
    {
      step: "01",
      title: "Upload Task & Rubric",
      subtext: "Submit your problem statement, professor guidelines, and syllabus rubric. Get an instant itemized 50/50 quotation.",
      visual: (
        <div className="rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 h-36 flex flex-col justify-between">
          <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-[8px] p-2.5 text-center bg-white/50 dark:bg-zinc-950/50">
            <FileUp className="h-4 w-4 mx-auto text-zinc-900 dark:text-zinc-100 mb-1" />
            <span className="text-[11px] font-mono font-medium text-zinc-900 dark:text-zinc-100 block">
              Drop problem sheet / PDF
            </span>
            <span className="text-[9px] text-zinc-500">Up to 25MB • Ruled / Plain / LaTeX</span>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono p-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
              assignment_rubric.pdf
            </span>
            <span className="text-green-600 dark:text-green-400 font-semibold">1.4 MB ✓</span>
          </div>
        </div>
      ),
    },
    {
      step: "02",
      title: "Agree Price in Chat & Pay 50%",
      subtext: "Chat directly with an admin coordinator to agree on a custom fair quotation. Pay 50% advance into escrow to begin live work.",
      visual: (
        <div className="rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 h-36 flex flex-col justify-between">
          <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
                <CreditCard className="h-3 w-3 mr-1" /> Agreed 50% Advance
              </span>
              <span className="font-mono text-[11px] font-bold text-zinc-900 dark:text-zinc-100">$35.00 Paid</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-zinc-900 dark:bg-zinc-100 w-1/2" />
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono px-2 py-1.5 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
            <span className="text-zinc-500 flex items-center">
              <Radio className="h-3 w-3 mr-1 text-zinc-900 dark:text-zinc-100 animate-pulse" /> Admin Chat
            </span>
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">50% Escrow Active</span>
          </div>
        </div>
      ),
    },
    {
      step: "03",
      title: "Inspect Preview & Unlock",
      subtext: "Review the watermarked document. When 100% satisfied, clear the remaining 50% to decrypt and download the 300 DPI original.",
      visual: (
        <div className="rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-2 h-36 flex flex-col justify-between">
          <div className="p-2 rounded bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px]">
            <span className="text-zinc-500">Watermarked Inspection:</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-zinc-900 dark:text-zinc-100 font-bold">
              Verified ✓
            </span>
          </div>
          <div className="p-2.5 rounded-[8px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-between text-[11px] font-mono font-semibold">
            <div className="flex items-center space-x-1.5">
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>Full Decrypted PDF</span>
            </div>
            <Download className="h-3.5 w-3.5" />
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28 border-t border-zinc-200 dark:border-zinc-800">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Fulfillment Pipeline</span>
        </div>
        <h2 className="text-[32px] sm:text-[46px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
          How It Works in 3 Simple Steps
        </h2>
        <p className="text-[15px] sm:text-[17px] text-zinc-500 font-light">
          From task upload to cryptographically signed deliverable download.
        </p>
      </div>

      {/* 3 Step Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((item, idx) => (
          <div
            key={idx}
            className="p-6 rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
          >
            {/* Step Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <span className="font-mono text-[28px] font-bold text-zinc-900 dark:text-zinc-100">
                {item.step}
              </span>
              <span className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded">
                Step {idx + 1} of 3
              </span>
            </div>

            {/* Visual Box */}
            {item.visual}

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-[17px] font-bold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed font-light">
                {item.subtext}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link href="/user/requests/new">
          <Button size="lg" className="h-12 px-8 rounded-full text-[14px] font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
            Start Your Request Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
