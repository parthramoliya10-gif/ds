import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { HowItWorksSteps } from "@/components/marketing/HowItWorksSteps";
import { PricingEscrowNote } from "@/components/marketing/PricingEscrowNote";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  CreditCard,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works & 50-50 Escrow Model — DSMS",
  description:
    "Learn how DSMS protects students with a 50-50 milestone escrow: pay half advance to start work, inspect completed deliverable, and pay the remaining balance to unlock download.",
  openGraph: {
    title: "How DSMS Works — 50/50 Milestone Escrow for College Tasks",
    description:
      "Zero upfront risk. Guaranteed on-time delivery. Transparent quotations and live specialist chat.",
    type: "website",
    url: "https://dsms.college/how-it-works",
  },
};

export default function HowItWorksPage() {
  const milestoneStages = [
    {
      title: "Stage 1: Task Inspection & Quotation",
      timing: "Within 15 - 30 Minutes",
      studentAction: "Submit syllabus prompt, rubric, and required pages.",
      adminAction: "Admin inspects formatting constraints and creates itemized 50/50 quotation.",
      paymentStatus: "No payment required to submit or chat.",
    },
    {
      title: "Stage 2: Milestone 1 (50% Advance)",
      timing: "Initiates immediate specialist drafting",
      studentAction: "Review quotation and pay 50% advance via Razorpay (UPI/Card/Netbanking).",
      adminAction: "Specialist immediately begins research, code compilation, and drafting.",
      paymentStatus: "50% held securely in milestone escrow.",
    },
    {
      title: "Stage 3: Completion & Watermarked Preview",
      timing: "Delivered strictly before deadline",
      studentAction: "Inspect watermarked preview thumbnail, page count, and code screenshots.",
      adminAction: "Specialist marks task as ready and uploads final encrypted deliverable.",
      paymentStatus: "Download is locked until final 50% balance.",
    },
    {
      title: "Stage 4: Milestone 2 (50% Balance) & Unlock",
      timing: "Instant decryption",
      studentAction: "Pay remaining 50% balance via Razorpay to permanently unlock download.",
      adminAction: "Decryption key released. High-resolution PDF/DOCX file downloaded.",
      paymentStatus: "100% milestone completed. Complimentary revisions available.",
    },
  ];

  const guarantees = [
    {
      title: "Strict Deadline Commitment",
      description: "If a deliverable is delivered past the agreed deadline without prior mutual consent, you receive a full refund of your 50% advance.",
      icon: <CheckCircle2 className="h-5 w-5 stroke-[1.75]" />,
    },
    {
      title: "Zero AI-Hallucinated Code",
      description: "All algorithms, Wireshark traces, and Packet Tracer configs are verified in real compiler environments with screenshots.",
      icon: <ShieldCheck className="h-5 w-5 stroke-[1.75]" />,
    },
    {
      title: "Complimentary Revision Policy",
      description: "Every task includes up to 2 free revision rounds within 7 days of delivery for teacher feedback or rubric adjustments.",
      icon: <RefreshCw className="h-5 w-5 stroke-[1.75]" />,
    },
    {
      title: "Confidentiality & Data Privacy",
      description: "We never publish your university papers online. Your student identity, registration number, and contact info are 100% encrypted.",
      icon: <Lock className="h-5 w-5 stroke-[1.75]" />,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="text-[12px] font-mono px-3 py-1">
          Escrow Protection Architecture
        </Badge>
        <h1 className="text-[34px] sm:text-[48px] font-bold tracking-tight text-foreground">
          How the 50/50 Milestone Model Works
        </h1>
        <p className="text-[16px] text-muted-foreground leading-relaxed">
          Engineered to give college students total transparency and safety. You never pay 100% upfront, and our specialists are motivated to deliver perfection.
        </p>
      </div>

      {/* 4-Step How It Works Grid */}
      <HowItWorksSteps />

      {/* Detailed Lifecycle Stages */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-[26px] font-bold text-foreground">
            Complete Order Lifecycle
          </h2>
          <p className="text-[14px] text-muted-foreground">
            A step-by-step audit of what happens at each stage of your task.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {milestoneStages.map((stage, idx) => (
            <Card
              key={idx}
              className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-4 hover:border-foreground/40 transition-colors"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-[16px] font-bold text-foreground">
                  {stage.title}
                </h3>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {stage.timing}
                </Badge>
              </div>

              <div className="space-y-2.5 text-[13px]">
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                    Student Action
                  </span>
                  <p className="text-foreground">{stage.studentAction}</p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                    DSMS Specialist Action
                  </span>
                  <p className="text-foreground">{stage.adminAction}</p>
                </div>

                <div className="p-2.5 rounded-[6px] bg-surface border border-border text-[12px]">
                  <span className="text-muted-foreground block text-[11px] uppercase font-semibold">
                    Payment &amp; Escrow State
                  </span>
                  <span className="font-semibold text-foreground">{stage.paymentStatus}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 50/50 Escrow Breakdown Callout */}
      <PricingEscrowNote />

      {/* Student Guarantees */}
      <div className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-[26px] font-bold text-foreground">
            Our 4-Point Student Guarantee
          </h2>
          <p className="text-[14px] text-muted-foreground">
            Every submission through DSMS is protected by our academic quality charter.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-[8px] border border-border bg-background space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-9 w-9 rounded-[6px] bg-surface border border-border flex items-center justify-center text-foreground">
                  {item.icon}
                </div>
                <h4 className="text-[15px] font-semibold text-foreground">
                  {item.title}
                </h4>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Accordion */}
      <FaqAccordion />

      {/* CTA Bottom */}
      <div className="p-8 sm:p-12 rounded-[8px] bg-foreground text-background text-center space-y-5">
        <h3 className="text-[26px] sm:text-[32px] font-bold text-background">
          Ready to experience hassle-free task submission?
        </h3>
        <p className="text-[14px] text-background/80 max-w-lg mx-auto">
          Upload your problem statement now. Your first 50% milestone quotation will be ready in minutes.
        </p>
        <Link href="/user/requests/new">
          <Button size="lg" className="h-11 px-7 text-[14px] font-semibold bg-background text-foreground hover:bg-background/90">
            Submit Your Task Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
