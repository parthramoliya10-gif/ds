import * as React from "react";
import { Metadata } from "next";
import { HeroSection } from "@/components/marketing/HeroSection";
import { TrustStats } from "@/components/marketing/TrustStats";
import { ServicesGrid } from "@/components/marketing/ServicesGrid";
import { HowItWorksSteps } from "@/components/marketing/HowItWorksSteps";
import { PricingEscrowNote } from "@/components/marketing/PricingEscrowNote";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { CtaBanner } from "@/components/marketing/CtaBanner";

export const metadata: Metadata = {
  title: "DSMS — College Document & Academic Task Management Platform",
  description:
    "India's dedicated academic service management system for college students. Get assignments, lab manuals, practical files, and project reports completed with 50-50 milestone escrow.",
  openGraph: {
    title: "DSMS — College Document Service Management System",
    description:
      "Handwritten or typed college tasks delivered on time. Verified code, simulated outputs, and guaranteed 50-50 milestone escrow protection.",
    type: "website",
    url: "https://dsms.college",
    siteName: "DSMS",
  },
};

export default function MarketingLandingPage() {
  return (
    <div className="flex flex-col items-center">
      {/* 1. Hero Section with Bold Typography and Dual CTAs */}
      <HeroSection />

      {/* 2. Trust Stats Bar */}
      <TrustStats />

      {/* 3. Five Core Services Grid */}
      <ServicesGrid />

      {/* 4. 4-Step How It Works with Big Muted Numbers */}
      <HowItWorksSteps />

      {/* 5. 50/50 Milestone Escrow Callout */}
      <PricingEscrowNote />

      {/* 6. Real Student Testimonials */}
      <TestimonialsSection />

      {/* 7. Semantic FAQ Accordion */}
      <FaqAccordion />

      {/* 8. High-Contrast Black CTA Section */}
      <CtaBanner />
    </div>
  );
}
