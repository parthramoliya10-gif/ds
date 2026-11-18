import * as React from "react";
import { Metadata } from "next";
import { HeroSection } from "@/components/marketing/HeroSection";
import { LiveWorkspaceSection } from "@/components/marketing/LiveWorkspaceSection";
import { ActualFeaturesGrid } from "@/components/marketing/ActualFeaturesGrid";
import { RealLifecycleSteps } from "@/components/marketing/RealLifecycleSteps";
import { ChatQuotationEscrow } from "@/components/marketing/ChatQuotationEscrow";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { CtaBanner } from "@/components/marketing/CtaBanner";

export const metadata: Metadata = {
  title: "DSMS — Academic Document Service & Milestone Escrow Platform",
  description:
    "Document Service Management System for college students. Submit assignments, lab manuals, and practical files with typed or handwritten options, chat directly with administrators, and pay through 50-50 milestone escrow in USD ($).",
  openGraph: {
    title: "DSMS — Document Service Management System",
    description:
      "Handwritten or typed college tasks delivered on time. Custom quotation via direct admin chat, and guaranteed 50-50 milestone escrow protection in USD ($).",
    type: "website",
    url: "https://dsms.college",
    siteName: "DSMS",
  },
};

export default function MarketingLandingPage() {
  return (
    <div className="flex flex-col items-center w-full overflow-x-hidden">
      {/* 1. Hero Section: Obsidian Opening Screen with 3D Concentric Tunnel & Metric Bar (1 Screen) */}
      <HeroSection />

      {/* 2. Platform Overview: Interactive Live Request & Escrow Workspace Simulator (1 Screen) */}
      <LiveWorkspaceSection />

      {/* 3. Core Capabilities: 6 Real Codebase Features in Compact Bento Grid (1 Screen) */}
      <ActualFeaturesGrid />

      {/* 4. Request Lifecycle: 4-Stage Progression (PENDING -> QUOTED -> IN_PROGRESS -> COMPLETED) (1 Screen) */}
      <RealLifecycleSteps />

      {/* 5. Custom Quotation via Admin Chat & 50/50 Escrow Model (1 Screen) */}
      <ChatQuotationEscrow />

      {/* 6. Frequently Asked Questions: 2-Column Balanced FAQ (1 Screen) */}
      <FaqAccordion />

      {/* 7. Standout Call to Action (1 Screen) */}
      <CtaBanner />
    </div>
  );
}
