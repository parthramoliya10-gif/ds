"use client";

import * as React from "react";
import Link from "next/link";
import {
  Radio,
  FileText,
  Lock,
  PenTool,
  UserCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import { RevealOnScroll } from "./RevealOnScroll";

export function ActualFeaturesGrid() {
  const features = [
    {
      icon: <DollarSign className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Payment Architecture",
      title: "Two-Stage 50/50 Milestone Escrow",
      description:
        "Every request is split into two equal 50% payments: Advance (50%) to initiate work, and Balance (50%) to unlock the completed file after admin upload.",
      highlight: "50% Advance → 50% Balance",
    },
    {
      icon: <Radio className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Real-Time WebSocket",
      title: "Dedicated Request Chat Room",
      description:
        "Every document request has an isolated 1-on-1 Socket.IO chat channel between student and admin for instant messaging and draft feedback.",
      highlight: "Room-Isolated Sockets",
    },
    {
      icon: <FileText className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Quotation Engine",
      title: "In-Chat Custom Quotations",
      description:
        "Admin reviews your submitted title, subject, pages, and reference files, then issues an interactive quotation card directly inside the chat in USD ($).",
      highlight: "Agreed in 1-on-1 Chat",
    },
    {
      icon: <Lock className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Cloudinary Security",
      title: "Locked Document Gatekeeper",
      description:
        "Completed files uploaded by admin remain securely locked until both 50% milestones are verified. Download unlocks automatically upon settlement.",
      highlight: "Automatic Decryption",
    },
    {
      icon: <PenTool className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Document Options",
      title: "Typed or Handwritten Formats",
      description:
        "Select your preferred document format when creating a request: typed document files or high-resolution printable scans on college-ruled sheets.",
      highlight: "Ruled or Typed PDF",
    },
    {
      icon: <UserCheck className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />,
      tag: "Role Isolation",
      title: "Dedicated Student & Admin Portals",
      description:
        "Distinct authenticated workspaces: Students track requests and payments; Admins manage requests, chat rooms, and revenue analytics.",
      highlight: "Role-Based Access",
    },
  ];

  return (
    <section
      id="features"
      className="w-full min-h-[calc(100dvh-4rem)] lg:h-[calc(100dvh-4rem)] lg:max-h-[920px] flex flex-col justify-between py-14 sm:py-20 lg:py-6 px-4 sm:px-8 max-w-7xl mx-auto border-t border-zinc-200 dark:border-zinc-800"
    >
      {/* Section Header */}
      <RevealOnScroll>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10 lg:mb-auto shrink-0">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
              Platform Capabilities
            </div>
            <h2 className="text-[24px] sm:text-[32px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
              Built Specifically for College Document Services
            </h2>
          </div>
          <p className="text-[12px] sm:text-[13px] font-mono text-zinc-500 max-w-md text-left sm:text-right">
            Every capability below is fully implemented in our application, database, and sockets.
          </p>
        </div>
      </RevealOnScroll>

      {/* 6-Card Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 my-6 sm:my-8 lg:my-auto">
        {features.map((feat, idx) => (
          <RevealOnScroll key={idx} delayMs={idx * 60}>
            <div className="p-4 sm:p-5 rounded-[14px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-between space-y-3 hover-lift hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group h-full shadow-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {feat.title}
                </h3>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400 font-light leading-relaxed">
                  {feat.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                  Verified Architecture
                </span>
                <span className="font-mono text-[10px] font-semibold text-zinc-900 dark:text-zinc-100">
                  {feat.highlight}
                </span>
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>

      {/* Bottom Footer Strip */}
      <RevealOnScroll delayMs={200}>
        <div className="flex flex-wrap items-center justify-between mt-8 sm:mt-10 lg:mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[12px] font-mono text-zinc-500 gap-2 shrink-0">
          <span>Grounded 100% in DSMS database &amp; real-time socket architecture</span>
          <Link
            href="/user/requests/new"
            className="text-zinc-900 dark:text-zinc-100 hover:underline inline-flex items-center font-semibold"
          >
            Launch Workspace <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </div>
      </RevealOnScroll>
    </section>
  );
}
