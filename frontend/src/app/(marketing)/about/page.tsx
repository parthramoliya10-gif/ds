import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Users,
  School,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — DSMS Academic Mission & Standards",
  description:
    "Learn about DSMS: our founding vision, academic specialist network, zero-slop engineering standards, and commitment to student peace of mind.",
  openGraph: {
    title: "About DSMS — Academic Fulfillment for College Students",
    description:
      "Vetted subject specialists providing high-quality assignments, lab manuals, and reports for engineering and science students across India.",
    type: "website",
    url: "https://dsms.college/about",
  },
};

export default function AboutPage() {
  const values = [
    {
      title: "Real Code & Real Execution",
      description:
        "We reject generic AI text dumps. Every code solution is compiled in a real terminal, packet traces are captured in Wireshark, and hardware schematics are verified before inclusion in any manual.",
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      title: "The 50/50 Trust Escrow",
      description:
        "College students operate on tight budgets and high stress. Our milestone model ensures students never risk paying for substandard work upfront, aligning incentives perfectly between student and specialist.",
      icon: <ShieldCheck className="h-5 w-5" />,
    },
    {
      title: "Strict University Adherence",
      description:
        "Every college has unique font, margin, and indexing constraints. Whether your department requires IEEE 830, Anna University format, or DTU laboratory records, we format to your exact institutional syllabus.",
      icon: <School className="h-5 w-5" />,
    },
    {
      title: "Vetted Subject Specialists",
      description:
        "Our fulfillment team consists exclusively of postgraduate scholars, senior university alumni, and technical specialists with deep domain expertise across CSE, ECE, Mechanical, Civil, and Management.",
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const universityPartners = [
    "Delhi Technological University (DTU)",
    "Netaji Subhas University of Technology (NSUT)",
    "Birla Institute of Technology and Science (BITS Pilani)",
    "Vellore Institute of Technology (VIT Vellore / Chennai)",
    "Manipal Academy of Higher Education (MAHE)",
    "Thapar Institute of Engineering and Technology",
    "SRM Institute of Science and Technology",
    "National Institutes of Technology (NIT Trichy, Surathkal, Warangal)",
    "Indian Institutes of Information Technology (IIIT Hyderabad, Delhi, Allahabad)",
    "Anna University & Affiliated Engineering Colleges",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-16">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="text-[12px] font-mono px-3 py-1">
          Our Story &amp; Purpose
        </Badge>
        <h1 className="text-[34px] sm:text-[48px] font-bold tracking-tight text-foreground">
          Built by Engineers, Dedicated to College Students
        </h1>
        <p className="text-[16px] text-muted-foreground leading-relaxed">
          DSMS was founded to solve the chaotic, unreliable, and high-stress experience of semester document submissions with transparent milestone technology and verified academic standards.
        </p>
      </div>

      {/* Origin Story Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-y border-border py-12">
        <div className="space-y-4">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
            The Problem We Solved
          </span>
          <h2 className="text-[26px] font-bold text-foreground">
            Why Generic Freelance Sites Failed Engineering Students
          </h2>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            In typical college semesters, students face intense bottlenecks: back-to-back mid-semester exams, campus placement preparation, competitive programming, and dozens of 30-page handwritten or typed lab manuals due on the exact same date.
          </p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Students turning to random online freelancers frequently experienced ghosting, plagiarized AI text that failed basic compiler checks, or demands for 100% advance payments with zero recourse.
          </p>
          <p className="text-[14px] text-foreground font-medium leading-relaxed">
            DSMS replaced this broken model with an engineered escrow architecture: direct specialist chat, verified 50-50 milestone payments, and rigorous technical review before any document is marked ready for download.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-[8px] border border-border bg-surface space-y-5">
          <h3 className="text-[18px] font-bold text-foreground">
            Our Quality Charter
          </h3>
          <div className="space-y-3 text-[13px]">
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
              <span><strong>100% Code Compilation:</strong> No code snippet is included without terminal verification.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
              <span><strong>No Recycled Submissions:</strong> Every assignment is crafted custom to your student problem prompt.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
              <span><strong>Zero Hallucinated Citations:</strong> Genuine academic bibliography in IEEE or APA style.</span>
            </div>
            <div className="flex items-start space-x-2.5">
              <CheckCircle2 className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
              <span><strong>Full Privacy Protection:</strong> We never share your papers, name, or student data.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-[26px] font-bold text-foreground">
            Our Core Principles
          </h2>
          <p className="text-[14px] text-muted-foreground">
            The fundamental rules that govern every document drafted by our specialist network.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((val, idx) => (
            <Card
              key={idx}
              className="rounded-[8px] border border-border bg-background shadow-none p-6 space-y-3 hover:border-foreground/40 transition-colors"
            >
              <div className="h-9 w-9 rounded-[6px] bg-surface border border-border flex items-center justify-center text-foreground">
                {val.icon}
              </div>
              <h3 className="text-[17px] font-semibold text-foreground">
                {val.title}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {val.description}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Universities Reach */}
      <div className="p-8 sm:p-10 rounded-[8px] border border-border bg-surface space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-[22px] sm:text-[26px] font-bold text-foreground">
            University Reach &amp; Format Compliance
          </h2>
          <p className="text-[13px] text-muted-foreground">
            Our specialists have formatted manuals, assignments, and capstone project documentation for over 80+ universities across India, including:
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {universityPartners.map((uni, idx) => (
            <Badge
              key={idx}
              variant="outline"
              className="text-[12px] py-1 px-3 bg-background border-border text-foreground font-medium"
            >
              <School className="h-3 w-3 mr-1.5 text-muted-foreground" />
              {uni}
            </Badge>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-[24px] font-bold text-foreground">
          Ready to submit your next college task?
        </h3>
        <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
          Experience stress-free academic task fulfillment with verified specialists and 50-50 milestone escrow.
        </p>
        <Link href="/user/requests/new">
          <Button size="lg" className="h-11 px-7 text-[14px] font-semibold">
            Submit Your Task
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
