"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Calculator,
  Lock,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function PricingCards() {
  const [taskPages, setTaskPages] = React.useState(30);
  const [taskRate, setTaskRate] = React.useState(2.5);

  const plans = [
    {
      name: "Starter",
      subtitle: "Subject Assignments & Homework",
      price: "$30",
      priceInt: 30,
      turnaround: "Under 24 Hours",
      popular: false,
      cta: "Order Assignment",
      link: "/user/requests/new?type=assignment",
      features: [
        "Up to 15 Handwritten or Typed Pages",
        "Step-by-step mathematical proofs",
        "Neat college-ruled sheet scans (300 DPI)",
        "50/50 Escrow ($15 adv / $15 on delivery)",
        "2 complimentary revision rounds",
      ],
    },
    {
      name: "Pro",
      subtitle: "Lab Manuals & Code Traces",
      price: "$65",
      priceInt: 65,
      turnaround: "24 - 48 Hours",
      popular: true,
      cta: "Order Lab Manual",
      link: "/user/requests/new?type=lab_manual",
      features: [
        "Up to 40 Pages with Executable Code",
        "100% Compiler Verified (Linux GCC / Python)",
        "Wireshark PCAP & Timing Diagram captures",
        "Observation tables with ±0.02% error rates",
        "Direct specialist WebSocket chat channel",
        "50/50 Escrow ($32.50 adv / $32.50 balance)",
        "Full unwatermarked source files release",
      ],
    },
    {
      name: "Advanced",
      subtitle: "Project Reports & Thesis",
      price: "$120",
      priceInt: 120,
      turnaround: "3 - 7 Days",
      popular: false,
      cta: "Order Project Report",
      link: "/user/requests/new?type=project_report",
      features: [
        "Up to 100 Pages IEEE / ACM Formatting",
        "Full UML sequence & ER architectural specs",
        "Turnitin similarity report guaranteed < 5%",
        "LaTeX source files & BibTeX bibliography",
        "Senior PhD / Systems Specialist assigned",
        "50/50 Escrow ($60 adv / $60 balance)",
        "Priority 24/7 supervisor support hotline",
      ],
    },
  ];

  const estimatedTotal = Math.round(taskPages * taskRate);
  const advanceMilestone = Math.round(estimatedTotal / 2);
  const balanceMilestone = estimatedTotal - advanceMilestone;

  return (
    <section id="pricing" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28 border-t border-zinc-200 dark:border-zinc-800">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <DollarSign className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
          <span>Transparent 50/50 Milestone Pricing (USD $)</span>
        </div>
        <h2 className="text-[32px] sm:text-[46px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
          Simple, Predictable Academic Plans
        </h2>
        <p className="text-[15px] sm:text-[17px] text-zinc-500 font-light max-w-2xl mx-auto">
          Every plan is protected by our guaranteed 50/50 escrow. Half upfront to begin work, remaining half strictly upon preview approval.
        </p>
      </div>

      {/* 3-Tier Pricing Plan Grid matching Infographic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mb-16">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-[24px] p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
              plan.popular
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 border-2 border-zinc-900 dark:border-zinc-100 shadow-2xl scale-[1.02] z-10"
                : "bg-white text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600"
            }`}
          >
            {/* Most Popular Badge for Middle Plan */}
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-white text-black dark:bg-zinc-950 dark:text-white border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  Most Popular
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] font-bold tracking-tight">{plan.name}</h3>
                <span className="text-[11px] font-mono opacity-75">{plan.turnaround}</span>
              </div>
              <p className={`text-[13px] font-light leading-relaxed ${plan.popular ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500"}`}>
                {plan.subtitle}
              </p>

              <div className="pt-2 pb-4 border-b border-current/15">
                <div className="flex items-baseline space-x-1">
                  <span className="text-[40px] font-bold font-mono tracking-tight">{plan.price}</span>
                  <span className="text-[13px] opacity-75 font-mono">/ typical scope</span>
                </div>
                <div className="text-[11px] font-mono opacity-80 mt-1">
                  50/50 Escrow: {formatCurrency(Math.round(plan.priceInt / 2))} adv / {formatCurrency(Math.round(plan.priceInt / 2))} balance
                </div>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2.5 pt-2 text-[13px]">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-2.5">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 stroke-[2.5] ${plan.popular ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100"}`} />
                    <span className="leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button on All Plans */}
            <div className="pt-8 mt-6 border-t border-current/15">
              <Link href={plan.link}>
                <Button
                  size="lg"
                  className={`w-full h-11 rounded-full text-[13px] font-semibold transition-all ${
                    plan.popular
                      ? "bg-white text-black hover:bg-zinc-200 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-800"
                      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive USD Custom Scope Calculator */}
      <div className="rounded-[24px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              <Calculator className="h-3.5 w-3.5 text-zinc-900 dark:text-zinc-100" />
              <span>Custom Page Calculator</span>
            </div>
            <h3 className="text-[24px] sm:text-[30px] font-light tracking-tight text-zinc-900 dark:text-zinc-50">
              Calculate Exact 50/50 Escrow for Any Page Count
            </h3>
            <p className="text-[14px] text-zinc-500 font-light leading-relaxed">
              Drag the slider to your required pages to see the exact advance milestone and balance milestone in USD ($).
            </p>

            {/* Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-[13px] font-mono">
                <span className="text-zinc-500">Document Scope:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100">{taskPages} Pages</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={taskPages}
                onChange={(e) => setTaskPages(Number(e.target.value))}
                className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>5 pgs</span>
                <span>30 pgs</span>
                <span>60 pgs</span>
                <span>100 pgs</span>
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="lg:col-span-5 bg-white dark:bg-zinc-950 p-6 rounded-[16px] border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-mono text-zinc-500 uppercase">Estimated Total:</span>
              <span className="text-[32px] font-bold font-mono text-zinc-900 dark:text-zinc-100">
                {formatCurrency(estimatedTotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[12px] font-mono pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <div className="p-2.5 rounded-[8px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase">50% Advance</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[16px]">
                  {formatCurrency(advanceMilestone)}
                </span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">Starts drafting</span>
              </div>
              <div className="p-2.5 rounded-[8px] bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-400 block text-[10px] uppercase">50% Balance</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[16px]">
                  {formatCurrency(balanceMilestone)}
                </span>
                <span className="text-zinc-500 block text-[10px] mt-0.5">Unlocks 300 DPI</span>
              </div>
            </div>

            <Link href="/user/requests/new" className="block w-full">
              <Button className="w-full h-11 rounded-full text-[13px] font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200">
                Submit Task For Exact Quotation
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
