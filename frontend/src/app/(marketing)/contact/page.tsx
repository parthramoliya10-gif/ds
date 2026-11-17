import * as React from "react";
import { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  Building,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Academic Coordinator Desk — DSMS",
  description:
    "Have questions about custom university formats, urgent 12-hour turnaround deadlines, or bulk department practical files? Contact our academic coordination team.",
  openGraph: {
    title: "Contact DSMS — Student Support & Academic Coordinator Desk",
    description:
      "Direct WhatsApp and email coordination for college students. Average response time under 15 minutes.",
    type: "website",
    url: "https://dsms.college/contact",
  },
};

export default function ContactPage() {
  const contactMethods = [
    {
      title: "WhatsApp Coordination Hotline",
      detail: "+91 98765 43210",
      description: "Fastest response for urgent deadline queries, file attachments, and active order updates.",
      icon: <Phone className="h-5 w-5 stroke-[1.75]" />,
      badge: "Fastest Response (< 15 mins)",
    },
    {
      title: "Academic Support Desk",
      detail: "support@dsms.college",
      description: "For syllabus verification, bulk semester packages, and official billing / GST invoice requests.",
      icon: <Mail className="h-5 w-5 stroke-[1.75]" />,
      badge: "Official Inquiries",
    },
    {
      title: "Working Hours",
      detail: "8:00 AM – 11:30 PM IST",
      description: "7 days a week, including weekends and exam revision weeks.",
      icon: <Clock className="h-5 w-5 stroke-[1.75]" />,
      badge: "7 Days / Week",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <Badge variant="outline" className="text-[12px] font-mono px-3 py-1">
          Student Coordination Desk
        </Badge>
        <h1 className="text-[34px] sm:text-[46px] font-bold tracking-tight text-foreground">
          Get in Touch With Our Team
        </h1>
        <p className="text-[15px] text-muted-foreground leading-relaxed">
          Need a custom quotation for an unconventional assignment, urgent same-day turnaround, or clarification on formatting rules? We are here to help.
        </p>
      </div>

      {/* 2-Column Split: Contact Channels (Left) & Validated Form (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Info (col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <h2 className="text-[20px] font-bold text-foreground">
              Direct Contact Channels
            </h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              Our academic coordinators review student prompts directly and match you with the right engineering or subject specialist.
            </p>
          </div>

          <div className="space-y-4">
            {contactMethods.map((method, idx) => (
              <Card
                key={idx}
                className="rounded-[8px] border border-border bg-background shadow-none p-5 space-y-2 hover:border-foreground/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-[6px] bg-surface border border-border flex items-center justify-center text-foreground">
                    {method.icon}
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {method.badge}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-[14px] font-semibold text-foreground">
                    {method.title}
                  </h3>
                  <div className="text-[15px] font-mono font-bold text-foreground mt-0.5">
                    {method.detail}
                  </div>
                </div>

                <p className="text-[12px] text-muted-foreground leading-relaxed">
                  {method.description}
                </p>
              </Card>
            ))}
          </div>

          <div className="p-4 rounded-[8px] bg-surface border border-border text-[12px] text-muted-foreground space-y-1.5">
            <span className="font-semibold text-foreground flex items-center">
              <ShieldCheck className="h-3.5 w-3.5 mr-1 text-foreground" />
              100% Student Confidentiality
            </span>
            <p className="leading-relaxed">
              We never disclose your contact information or college affiliation. Inquiries are strictly confidential between you and the assigned coordinator.
            </p>
          </div>
        </div>

        {/* Right Column: Validated Contact Form (col-span-7) */}
        <div className="lg:col-span-7">
          <Card className="rounded-[8px] border border-border bg-background shadow-none p-6 sm:p-8 space-y-5">
            <div className="space-y-1 pb-3 border-b border-border">
              <h2 className="text-[20px] font-bold text-foreground">
                Send an Academic Inquiry
              </h2>
              <p className="text-[13px] text-muted-foreground">
                Fill in your task specifications below. Our coordinator will review your requirements and respond within 15 minutes.
              </p>
            </div>

            <ContactForm />
          </Card>
        </div>
      </div>
    </div>
  );
}
