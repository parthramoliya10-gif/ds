import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileUp, MessageSquare, ShieldCheck, Download } from "lucide-react";

export function HowItWorksSteps() {
  const steps = [
    {
      number: "01",
      title: "Submit Task & Rubric",
      icon: <FileUp className="h-5 w-5" />,
      description:
        "Provide your subject, page count, deadline, and preference for typed or handwritten submission. Attach your college syllabus, lab format, or problem sheet.",
    },
    {
      number: "02",
      title: "Direct Chat & Quotation",
      icon: <MessageSquare className="h-5 w-5" />,
      description:
        "An academic specialist examines your problem statement in real time. We provide an itemized 50-50 milestone quotation with guaranteed delivery turnaround.",
    },
    {
      number: "03",
      title: "50% Advance Milestone",
      icon: <ShieldCheck className="h-5 w-5" />,
      description:
        "Pay 50% upfront through Razorpay (UPI, Card, or Netbanking) to initiate work. Track real-time progress as your document is formatted and tested.",
    },
    {
      number: "04",
      title: "Review & Unlock Download",
      icon: <Download className="h-5 w-5" />,
      description:
        "Inspect the watermarked preview. Clear the remaining 50% milestone balance to permanently unlock and download the full high-resolution PDF.",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
        <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground">
          How DSMS Works
        </h2>
        <p className="text-[15px] text-muted-foreground">
          A four-step milestone model designed to protect students and ensure academic rigor from submission to download.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-5 sm:p-6 rounded-[8px] border border-border bg-background flex flex-col justify-between relative group hover:border-foreground/40 transition-colors"
          >
            {/* Big Muted Number */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <span className="font-mono text-[36px] font-bold text-muted-foreground/30 leading-none">
                {step.number}
              </span>
              <div className="h-8 w-8 rounded-[6px] bg-surface border border-border flex items-center justify-center text-foreground">
                {step.icon}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-[16px] font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/user/requests/new">
          <Button size="lg" className="h-11 px-7 text-[14px] font-semibold">
            Start Your Request Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
