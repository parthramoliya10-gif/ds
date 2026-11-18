"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Radio,
  ArrowRight,
  DollarSign,
  HeartHandshake,
} from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function ChatQuotationEscrow() {
  const [chatAccepted, setChatAccepted] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<"lab" | "assignment" | "project">("lab");

  const taskScenarios = {
    lab: {
      name: "Operating Systems Lab Manual",
      brief: "35 pages with thread synchronization graphs and Wireshark captures. Needed in 24 hours.",
      adminQuote: "$70.00",
      adv: "$35.00",
      bal: "$35.00",
      specialist: "Systems & Networks Specialist",
    },
    assignment: {
      name: "Electromagnetics Assignment",
      brief: "15 handwritten pages on ruled sheets with boundary condition proofs. Due tomorrow.",
      adminQuote: "$35.00",
      adv: "$17.50",
      bal: "$17.50",
      specialist: "Applied Physics Specialist",
    },
    project: {
      name: "Cloud Architecture Report",
      brief: "60 pages IEEE 2-column format with UML sequence and ER schemas. 4-day delivery.",
      adminQuote: "$110.00",
      adv: "$55.00",
      bal: "$55.00",
      specialist: "Senior Enterprise Specialist",
    },
  };

  const current = taskScenarios[selectedTask];

  return (
    <section
      id="escrow"
      className="relative w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-between py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800"
    >
      <div id="pricing" className="absolute -top-24 pointer-events-none" />

      {/* Section Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10 lg:mb-auto shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Chat Quotation &amp; Escrow
            </div>
            <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              Price Decided in Direct Chat — Not Rigid Per-Page Rates
            </h2>
          </div>
          <p className="text-[12px] sm:text-[13px] font-mono text-zinc-500 max-w-md text-left sm:text-right">
            Upload instructions and chat 1-on-1 with admin to agree on a custom quotation in USD ($).
          </p>
        </div>
      </RevealOnScroll>

      {/* Main Grid: Chat Simulator on Left, Value Proposition on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center my-6 sm:my-8 lg:my-auto">
        {/* Left Column: Interactive Chat Box (col-span-7) */}
        <RevealOnScroll className="lg:col-span-7" delayMs={100}>
          <div className="rounded-[16px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4 sm:p-5 shadow-sm flex flex-col space-y-3">
            {/* Scenario Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
            <span className="text-[11px] font-mono uppercase text-zinc-500">
              Interactive Chat Simulator:
            </span>
            <div className="flex space-x-1 overflow-x-auto no-scrollbar max-w-full">
              {(["lab", "assignment", "project"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTask(key);
                    setChatAccepted(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors whitespace-nowrap ${
                    selectedTask === key
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  }`}
                >
                  {key === "lab" ? "Lab Manual" : key === "assignment" ? "Assignment" : "Project"}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="space-y-2.5 text-[12px]">
            {/* Student Message */}
            <div className="flex flex-col items-end">
              <div className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-[14px] rounded-br-[3px] p-2.5 max-w-[90%] shadow-sm">
                <p className="font-light">{current.brief}</p>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-600 block mt-1 text-right font-mono">
                  You (Student) • 10:14 AM
                </span>
              </div>
            </div>

            {/* Admin Response & Quotation Card */}
            <div className="flex flex-col items-start">
              <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[14px] rounded-bl-[3px] p-3 max-w-[95%] space-y-2 shadow-sm">
                <div className="flex items-center space-x-2 pb-1.5 border-b border-zinc-100 dark:border-zinc-900">
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold text-[9px]">
                    AD
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-[11px]">
                      {current.specialist}
                    </span>
                    <span className="text-[9px] font-mono text-zinc-400 ml-1.5">• 10:15 AM</span>
                  </div>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 leading-snug text-[11px]">
                  Reviewed your guidelines! Our specialist can deliver verified documentation within your timeframe. Here is your agreed 50/50 quotation:
                </p>

                {/* The Quotation Card */}
                <div className="p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-zinc-500 text-[11px]">Custom Agreed Price:</span>
                    <span className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                      {current.adminQuote} USD
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Advance (50%): {current.adv}
                      <span className="block text-[9px] text-zinc-500 font-normal">To start drafting</span>
                    </div>
                    <div className="text-zinc-500">
                      Balance (50%): {current.bal}
                      <span className="block text-[9px] text-zinc-500 font-normal">Held in escrow</span>
                    </div>
                  </div>
                </div>

                {/* Accept Button */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {chatAccepted ? "Advance Escrow Verified ✓" : "Zero financial risk • 100% refund guarantee"}
                  </span>
                  {!chatAccepted ? (
                    <Button
                      size="sm"
                      onClick={() => setChatAccepted(true)}
                      className="h-7 px-3 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                    >
                      Accept Quote &amp; Pay {current.adv}
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
                      DRAFTING IN PROGRESS
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </RevealOnScroll>

        {/* Right Column: Why Chat Quotation Wins (col-span-5) */}
        <RevealOnScroll className="lg:col-span-5 space-y-4" delayMs={150}>
          <div className="p-4 sm:p-5 rounded-[14px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-sm hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <HeartHandshake className="h-4 w-4 mr-2 text-emerald-600" />
              No Algorithmic Overcharging
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
              Generic sites charge fixed high rates per page regardless of difficulty. In DSMS, our admin reviews your exact guidelines in chat to propose an honest, student-friendly price based on actual effort.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-[14px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5 shadow-sm hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-sky-600" />
              Half Now, Half On Satisfaction
            </div>
            <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
              50% advance secures your specialist and starts drafting. The remaining 50% is only released after you inspect the watermarked preview. If deadlines or rubrics are missed, advance is refunded 100%.
            </p>
          </div>

          <Link href="/user/requests/new" className="block pt-1">
            <Button
              size="sm"
              className="w-full h-9 text-[12px] font-semibold rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 transition-all shadow-sm"
            >
              Start Chat with Admin Specialist
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </RevealOnScroll>
      </div>

      {/* Bottom Footer Strip */}
      <RevealOnScroll delayMs={200}>
        <div className="flex flex-wrap items-center justify-between mt-8 sm:mt-10 lg:mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[12px] font-mono text-zinc-500 gap-2 shrink-0">
          <span>No rigid per-page rates • 1-on-1 human negotiation in USD ($)</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            100% Money-Back Guarantee
          </span>
        </div>
      </RevealOnScroll>
    </section>
  );
}
