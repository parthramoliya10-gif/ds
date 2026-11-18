"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Download,
  FileText,
  Radio,
  Check,
  ArrowRight,
} from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function LiveWorkspaceSection() {
  const [unlocked, setUnlocked] = React.useState(false);
  const [activeStep, setActiveStep] = React.useState<1 | 2 | 3 | 4>(2);

  return (
    <section
      id="simulator"
      className="relative w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-between py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800"
    >
      {/* Top Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10 lg:mb-auto shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Platform Simulator
            </div>
            <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              DSMS Document Engine &amp; Live Workspace
            </h2>
          </div>
          <p className="text-[12px] sm:text-[13px] font-mono text-zinc-500">
            Click any phase below to inspect real student workflow
          </p>
        </div>
      </RevealOnScroll>

      {/* Main Center Area: 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center my-6 sm:my-8 lg:my-auto">
        {/* Left Column: 4 Real Capabilities */}
        <RevealOnScroll className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3" delayMs={100}>
          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600 stroke-[2.5]" />
              50/50 Milestone Escrow
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              50% advance to start drafting; 50% balance strictly after inspecting preview.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <Radio className="h-3.5 w-3.5 mr-1.5 text-sky-500 stroke-[2.5]" />
              Real-Time Sockets
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Isolated bi-directional room channels with your assigned specialist.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-amber-500 stroke-[2.5]" />
              Institutional Rigor
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Every derivation, observation table, and diagram follows university criteria.
            </p>
          </div>

          <div className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1 hover-lift transition-all">
            <div className="font-mono text-[12px] font-semibold text-zinc-900 dark:text-zinc-100 flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-purple-500 stroke-[2.5]" />
              AES-256 Vault Gatekeeper
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              Pre-signed download tokens released automatically upon milestone clearance.
            </p>
          </div>
        </RevealOnScroll>

        {/* Right Column: Interactive Workspace Stage */}
        <RevealOnScroll className="lg:col-span-8 rounded-[16px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-4 sm:p-6 text-left shadow-lg hover-lift transition-all" delayMs={150}>
          {/* OS Window Bar */}
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-3 gap-2">
            <div className="flex items-center space-x-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="font-mono text-[11px] text-zinc-500 ml-2 hidden sm:inline">
                portal.dsms.internal / request-workspace / #REQ-1003
              </span>
            </div>

            {/* Step Toggles */}
            <div className="flex items-center space-x-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[8px] p-0.5 text-[11px] font-mono overflow-x-auto no-scrollbar max-w-full">
              <button
                onClick={() => {
                  setActiveStep(1);
                  setUnlocked(false);
                }}
                className={`px-2 py-0.5 rounded-[6px] transition-colors ${
                  activeStep === 1
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                1. Brief
              </button>
              <button
                onClick={() => {
                  setActiveStep(2);
                  setUnlocked(false);
                }}
                className={`px-2 py-0.5 rounded-[6px] transition-colors ${
                  activeStep === 2
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                2. 50% Quotation
              </button>
              <button
                onClick={() => {
                  setActiveStep(3);
                  setUnlocked(false);
                }}
                className={`px-2 py-0.5 rounded-[6px] transition-colors ${
                  activeStep === 3
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                3. Drafting
              </button>
              <button
                onClick={() => {
                  setActiveStep(4);
                }}
                className={`px-2 py-0.5 rounded-[6px] transition-colors ${
                  activeStep === 4
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                4. Settle &amp; Unlock
              </button>
            </div>
          </div>

          {/* Active Workspace Viewport */}
          <div className="bg-white dark:bg-zinc-950 rounded-[12px] border border-zinc-200 dark:border-zinc-800 p-4 sm:p-5 min-h-[290px] flex flex-col justify-between">
            {/* Step 1: Brief & Reference Material */}
            {activeStep === 1 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h4 className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100">
                      Advanced Systems Lab File
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      35 Pages • Thread Sync Graphs &amp; Wireshark Captures
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-amber-500 border-amber-500/30">
                    PENDING REVIEW
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Subject / Department:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Computer Systems &amp; Networks</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Target Format:</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">Typed PDF + Observation Charts</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <div className="text-[11px] font-mono text-zinc-500">Attached Student Guidelines:</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
                    <FileText className="h-3.5 w-3.5 text-zinc-500" />
                    <span>syllabus_rubric.pdf (2.4 MB) • wireshark_captures.pcap (5.1 MB)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: In-Chat 50/50 Quotation Card */}
            {activeStep === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center space-x-2">
                    <div className="h-7 w-7 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-[11px]">
                      DR
                    </div>
                    <div>
                      <div className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100">
                        Admin Specialist Desk
                      </div>
                      <div className="text-[10px] font-mono text-emerald-500 flex items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                        Online in Socket Room #REQ-1003
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-sky-500 border-sky-500/30">
                    QUOTED
                  </Badge>
                </div>

                <div className="rounded-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-mono">
                    <span className="text-zinc-500">Total Agreed Quotation:</span>
                    <span className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100">$70.00 USD</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Advance (50%): $35.00
                      <span className="block text-[10px] text-zinc-500 font-normal">To start drafting</span>
                    </div>
                    <div className="text-zinc-500">
                      Balance (50%): $35.00
                      <span className="block text-[10px] text-zinc-500 font-normal">To unlock download</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-zinc-500 font-mono">
                    Zero financial risk • 100% refund guarantee
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setActiveStep(3)}
                    className="h-8 text-[11px] font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  >
                    Accept Quote &amp; Pay Advance
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Work In Progress */}
            {activeStep === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h4 className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100">
                      Drafting in Progress
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Advance $35.00 Escrow Verified • Specialist Assigned
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-purple-500 border-purple-500/30">
                    IN_PROGRESS
                  </Badge>
                </div>

                <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-zinc-500">Specialist Progress:</span>
                    <span className="text-emerald-500 font-bold">85% Complete</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full w-[85%]" />
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Wireshark capture graphs generated. Thread synchronization sequence completed. Watermarked inspection preview being compiled.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-zinc-500">
                    Direct socket chat open for live questions
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setActiveStep(4)}
                    className="h-8 text-[11px] font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  >
                    Next: Settle &amp; Unlock
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Settle & Instant Unlock */}
            {activeStep === 4 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div>
                    <h4 className="font-semibold text-[14px] text-zinc-900 dark:text-zinc-100">
                      Final Delivery &amp; Security Gatekeeper
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Admin Uploaded: Advanced_Systems_Lab_Final.pdf (18.6 MB)
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-500 border-emerald-500/30">
                    {unlocked ? "COMPLETED" : "DOCUMENT_UPLOADED"}
                  </Badge>
                </div>

                <div className="p-3 rounded-[10px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                      {unlocked ? (
                        <Unlock className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Lock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-[12px] text-zinc-900 dark:text-zinc-100">
                        {unlocked ? "Document Security Lock Removed" : "Security Lock Active (Watermarked)"}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {unlocked
                          ? "Milestone settled. Signed Cloudinary token active."
                          : "Inspect preview. Pay final 50% ($35.00) to unlock 300 DPI original."}
                      </div>
                    </div>
                  </div>

                  {!unlocked ? (
                    <Button
                      size="sm"
                      onClick={() => setUnlocked(true)}
                      className="h-8 px-3 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      Pay Final $35.00
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 px-3 text-[11px] font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download PDF
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                  <span>AES-256 Vault Pre-Signed Token</span>
                  <span className="text-emerald-500 font-semibold">
                    {unlocked ? "Token: dsms_exp_3600s_verified" : "Token: locked_awaiting_settlement"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </RevealOnScroll>
      </div>

      {/* Bottom Direct CTA */}
      <RevealOnScroll delayMs={200}>
        <div className="flex flex-wrap items-center justify-between mt-8 sm:mt-10 lg:mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[12px] font-mono text-zinc-500 gap-2 shrink-0">
          <span>No algorithmic fees • Custom quotation in 1-on-1 admin chat</span>
          <Link
            href="/user/requests/new"
            className="text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center font-semibold"
          >
            Create Your Request <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
