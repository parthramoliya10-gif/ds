"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileUp,
  MessageSquare,
  CreditCard,
  Download,
  ArrowRight,
} from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function RealLifecycleSteps() {
  const lifecycleSteps = [
    {
      status: "PENDING",
      step: "01",
      icon: <FileUp className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      title: "Submit Request & Guidelines",
      description:
        "Fill out task details: subject, semester, page count, deadline, and format (typed or handwritten). Upload reference sheets to Cloudinary.",
      actionLabel: "Step 1: Brief Creation",
    },
    {
      status: "QUOTED",
      step: "02",
      icon: <MessageSquare className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      title: "Admin Chat & Quotation",
      description:
        "Open your request room to chat directly with admin. The admin evaluates your guidelines and sends an interactive 50/50 quotation card in chat.",
      actionLabel: "Step 2: Quotation Agreement",
    },
    {
      status: "IN_PROGRESS",
      step: "03",
      icon: <CreditCard className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      title: "Pay 50% Advance Milestone",
      description:
        "Accept the quotation and confirm the 50% advance milestone. The request status updates to IN_PROGRESS, and drafting begins.",
      actionLabel: "Step 3: Advance Escrow",
    },
    {
      status: "COMPLETED",
      step: "04",
      icon: <Download className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      title: "Pay Final 50% & Unlock",
      description:
        "Admin uploads the completed file. Settle the final 50% balance to clear the security lock and download your full-resolution document.",
      actionLabel: "Step 4: Decrypted Delivery",
    },
  ];

  return (
    <section
      id="workflow"
      className="w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-between py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800"
    >
      {/* Section Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10 lg:mb-auto shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Request Lifecycle
            </div>
            <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              From Brief to Decrypted Download in 4 Steps
            </h2>
          </div>
          <p className="text-[12px] sm:text-[13px] font-mono text-zinc-500 max-w-md text-left sm:text-right">
            A transparent 4-stage pipeline directly backed by our database status lifecycle.
          </p>
        </div>
      </RevealOnScroll>

      {/* 4-Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 my-6 sm:my-8 lg:my-auto">
        {lifecycleSteps.map((step, idx) => (
          <RevealOnScroll key={idx} delayMs={idx * 75}>
            <div className="p-4 sm:p-5 rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-3 relative group hover-lift hover:border-zinc-400 dark:hover:border-zinc-600 transition-all shadow-sm h-full">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                    PHASE {step.step}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {step.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2 pt-0.5">
                  <div className="h-7 w-7 rounded-[8px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0">
                    {step.icon}
                  </div>
                  <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {step.title}
                  </h3>
                </div>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-900 text-[11px] font-mono text-zinc-500">
                {step.actionLabel}
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Bottom CTA Row */}
      <RevealOnScroll delayMs={200}>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-8 sm:mt-10 lg:mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <span className="text-[12px] font-mono text-zinc-500">
            Database status lifecycle: PENDING → QUOTED → IN_PROGRESS → COMPLETED
          </span>
          <Link href="/user/requests/new">
            <Button
              size="sm"
              className="h-9 px-5 text-[12px] font-semibold rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 transition-all shadow-sm"
            >
              Submit a Document Request
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
