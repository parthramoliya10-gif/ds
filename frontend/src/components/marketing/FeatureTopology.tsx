"use client";

import * as React from "react";
import {
  Layers,
  Radio,
  UserCheck,
  ShieldCheck,
  Lock,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react";

export function FeatureTopology() {
  const [selectedNode, setSelectedNode] = React.useState<"portal" | "chat" | "dispatch" | "escrow" | "vault">("chat");

  const nodes = [
    {
      id: "portal" as const,
      name: "Student Portal",
      tag: "Self-Service Desk",
      icon: <Layers className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
      title: "Streamlined Task Upload & Document Management",
      description:
        "Upload multi-page rubrics, professor guidelines, and syllabus PDFs up to 25MB. Track real-time milestone states, inspect watermarked previews, and download completed deliverables.",
      metrics: [
        { label: "Supported Formats", value: "PDF, Word, LaTeX, Scans" },
        { label: "Upload SLA", value: "< 2 Minutes" },
        { label: "Student Privacy", value: "100% Anonymized" },
      ],
    },
    {
      id: "chat" as const,
      name: "Real-Time Chat",
      tag: "Live Room Socket",
      icon: <Radio className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
      title: "Direct 1-on-1 Admin Negotiation & Specialist Sync",
      description:
        "Discuss your task specifications directly in an isolated real-time WebSocket room. Negotiate custom quotations with admin coordinators, receive live progress snapshots, and request adjustments instantly.",
      metrics: [
        { label: "Response Time", value: "< 5 Minutes" },
        { label: "Channel Privacy", value: "End-to-End Isolated" },
        { label: "Revisions", value: "Instant Direct Sync" },
      ],
    },
    {
      id: "dispatch" as const,
      name: "Specialist Dispatch",
      tag: "Academic Allocation",
      icon: <UserCheck className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
      title: "Verified Subject Specialist Matching Engine",
      description:
        "Your task is algorithmically routed to a verified specialist with verified qualifications in your exact discipline (Networking, Embedded Systems, Physics, Mathematics, Distributed Computing).",
      metrics: [
        { label: "Matching Time", value: "< 10 Minutes" },
        { label: "Specialist Roster", value: "PhD / Master Verified" },
        { label: "Plagiarism", value: "< 5% Similarity" },
      ],
    },
    {
      id: "escrow" as const,
      name: "50/50 Escrow Ledger",
      tag: "Financial Conduit",
      icon: <ShieldCheck className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
      title: "Zero-Risk Two-Stage Milestone Escrow",
      description:
        "Splits every agreed quotation into two equal 50% milestones. Your advance is held safely in escrow until you personally inspect the watermarked preview and give full release approval.",
      metrics: [
        { label: "Advance Milestone", value: "50% To Start" },
        { label: "Balance Milestone", value: "50% On Delivery" },
        { label: "Refund Policy", value: "100% Deadline Guarantee" },
      ],
    },
    {
      id: "vault" as const,
      name: "AES-256 Vault",
      tag: "Cryptographic Storage",
      icon: <Lock className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />,
      title: "Cryptographic Gatekeeper & Instant Decryption",
      description:
        "Final documents are securely encrypted in a private Cloudinary CDN vault. Settling your 50% balance immediately generates a pre-signed cryptographic token unlocking your pristine 300 DPI original.",
      metrics: [
        { label: "Encryption", value: "AES-256 Cloud Vault" },
        { label: "Token Validity", value: "3600s Pre-Signed URL" },
        { label: "Print Quality", value: "300 DPI Original" },
      ],
    },
  ];

  const active = nodes.find((n) => n.id === selectedNode) || nodes[0];

  return (
    <section id="architecture" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28 border-t border-zinc-200 dark:border-zinc-800">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <Zap className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Fulfillment Architecture</span>
        </div>
        <h2 className="text-[32px] sm:text-[46px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
          End-to-End System Flow &amp; Features
        </h2>
        <p className="text-[15px] sm:text-[17px] text-zinc-500 font-light max-w-2xl mx-auto">
          Click any stage below to inspect how your task moves smoothly from brief to encrypted delivery.
        </p>
      </div>

      <div className="rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-5 sm:p-8 space-y-8">
        {/* Node Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node.id)}
                className={`p-4 rounded-[16px] border text-left transition-all space-y-2.5 ${
                  isSelected
                    ? "border-zinc-900 bg-white dark:border-zinc-100 dark:bg-zinc-950 shadow-md scale-[1.02]"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-9 w-9 rounded-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    {node.icon}
                  </div>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                    {node.name}
                  </h4>
                  <p className="text-[11px] font-mono text-zinc-500 line-clamp-1 mt-0.5">
                    {node.tag}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Visual Connector Wire with Animated Data Pulses */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3 rounded-[12px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-zinc-500">
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold flex items-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            1. Student Portal
          </span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">2. Live Admin Chat</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">3. Specialist Dispatch</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold">4. 50/50 Escrow Ledger</span>
          <div className="flex items-center space-x-1 text-emerald-500">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-ping" />
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-zinc-900 dark:text-zinc-100 font-semibold flex items-center">
            5. Decrypted Vault
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-1.5 animate-pulse" />
          </span>
        </div>

        {/* Feature Capability Showcase Card (Zero Code!) */}
        <div className="rounded-[18px] bg-white dark:bg-zinc-950 p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">
                Active Architecture Component: {active.tag}
              </span>
              <h3 className="text-[20px] sm:text-[24px] font-bold text-zinc-900 dark:text-zinc-100">
                {active.title}
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono text-[11px] font-semibold flex items-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Active System Flow
            </span>
          </div>

          <p className="text-[14px] sm:text-[15px] text-zinc-600 dark:text-zinc-400 font-light leading-relaxed">
            {active.description}
          </p>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {active.metrics.map((m, mIdx) => (
              <div
                key={mIdx}
                className="p-3.5 rounded-[12px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1"
              >
                <span className="text-[11px] font-mono text-zinc-400 uppercase block">
                  {m.label}
                </span>
                <span className="font-mono text-[14px] font-bold text-zinc-900 dark:text-zinc-100 block">
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
