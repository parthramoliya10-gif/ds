import * as React from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Binary,
  BookOpen,
  Briefcase,
  FolderGit2,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Services Catalog — DSMS Academic Fulfillment",
  description:
    "Explore specialized academic document fulfillment services for college students: Lab Manuals with verified outputs, Subject Assignments, Practical Notebooks, Internship Reports, and Project Thesis Documentation.",
  openGraph: {
    title: "DSMS Services — Assignments, Lab Manuals, Practical Files & Project Reports",
    description:
      "Handwritten and typed college deliverables prepared by university specialists with guaranteed turnaround.",
    type: "website",
    url: "https://dsms.college/services",
  },
};

export default function ServicesPage() {
  const serviceCategories = [
    {
      id: "assignments",
      title: "Subject Assignments",
      subtitle: "Theory questions, numerical derivations & coding exercises",
      icon: <FileText className="h-6 w-6 stroke-[1.75]" />,
      turnaround: "12 - 36 Hours",
      pages: "5 - 35 Pages",
      formats: ["Typed (Word/PDF)", "Handwritten (Ruled/Plain Scans)"],
      description:
        "Comprehensive answers to semester course assignments across engineering, basic sciences, computer applications, and business administration.",
      deliverables: [
        "Step-by-step mathematical proofs and equation derivation",
        "Neat student handwriting simulation on standard college lined paper",
        "Plagiarism-free written explanations with academic references",
        "Includes source code listings and algorithmic complexity analysis",
      ],
      sampleTopics: [
        "Distributed Systems Consensus Proofs",
        "Digital Signal Processing Fourier Transforms",
        "Microeconomics Market Equilibrium Analysis",
        "Compiler Design Syntax Trees and Parsing Tables",
      ],
    },
    {
      id: "lab-manuals",
      title: "Laboratory Manuals",
      subtitle: "Fully compiled codes with execution trace captures",
      icon: <Binary className="h-6 w-6 stroke-[1.75]" />,
      turnaround: "24 - 48 Hours",
      pages: "15 - 50 Pages",
      formats: ["Typed PDF with embedded terminal screenshots"],
      description:
        "End-to-end practical laboratory manuals complete with objectives, system requirements, verified algorithms, and authentic execution screenshots.",
      deliverables: [
        "100% syntactically correct and compiled code (C, C++, Java, Python, Go, SQL)",
        "Verified terminal outputs, Wireshark packet captures, and Packet Tracer topologies",
        "University-mandated structure: Aim, Theory, Algorithm, Code, Output, and Viva Questions",
        "Includes raw code zip package alongside formatted PDF",
      ],
      sampleTopics: [
        "Computer Networks: Socket Programming & Subnetting",
        "Operating Systems: Semaphores, Mutex & Memory Paging",
        "Database Management: Normalized Schemas & PL/SQL Triggers",
        "Data Structures: AVL Trees, Graphs & Hash Tables",
      ],
    },
    {
      id: "practical-files",
      title: "Practical Files & Notebooks",
      subtitle: "University-formatted practical records ready for evaluation",
      icon: <BookOpen className="h-6 w-6 stroke-[1.75]" />,
      turnaround: "1 - 3 Days",
      pages: "20 - 60 Pages",
      formats: ["Handwritten Scans (300 DPI)", "Typed Departmental Format"],
      description:
        "Standardized semester practical files with pre-formatted cover pages, experiment indexes, observation records, and teacher signature lines.",
      deliverables: [
        "Authentic handwriting on college laboratory record sheets",
        "Accurate hand-drawn circuit schematics, graphs, and hardware diagrams",
        "Precise observation tables, error percentage calculations, and results",
        "Full printable PDF matching standard A4 laboratory journal dimensions",
      ],
      sampleTopics: [
        "Basic Electrical & Electronics Lab Record",
        "Physics Laboratory Optical & Mechanics Experiments",
        "Analog and Digital Communication Journal",
        "Microprocessor 8085 & 8086 Assembly Record",
      ],
    },
    {
      id: "internship-reports",
      title: "Internship & Industrial Training Reports",
      subtitle: "Corporate-style documentation for summer/winter training",
      icon: <Briefcase className="h-6 w-6 stroke-[1.75]" />,
      turnaround: "2 - 4 Days",
      pages: "25 - 75 Pages",
      formats: ["Company Branded Format (DOCX & PDF)"],
      description:
        "Formal internship training reports detailing company overview, project architecture, weekly sprint contributions, and key performance metrics.",
      deliverables: [
        "Standard company certificate and college approval letter placeholders",
        "Weekly work logs detailing technical tasks and tools mastered",
        "High-level system architecture diagrams, tech stacks, and APIs",
        "Executive summary, project challenges, solutions, and learning outcomes",
      ],
      sampleTopics: [
        "Full-Stack Web Development Industrial Training",
        "Cloud DevOps and CI/CD Automation Internship",
        "Data Science & Machine Learning Research Fellowship",
        "Embedded Systems & IoT Hardware Internship",
      ],
    },
    {
      id: "project-reports",
      title: "Major & Minor Project Thesis Reports",
      subtitle: "Full IEEE/ACM academic project documentation",
      icon: <FolderGit2 className="h-6 w-6 stroke-[1.75]" />,
      turnaround: "3 - 7 Days",
      pages: "40 - 120 Pages",
      formats: ["IEEE / ACM / University Bound Format"],
      description:
        "Final year capstone and pre-final semester project reports prepared according to strict academic thesis guidelines and university rubrics.",
      deliverables: [
        "IEEE standard formatting: Abstract, Index, Table of Figures, Notation",
        "Complete Software Requirement Specifications (SRS) per IEEE 830",
        "UML Class, Sequence, Use Case, Activity, and ER database diagrams",
        "Comprehensive testing matrix: Unit tests, Integration tests, and Benchmark charts",
      ],
      sampleTopics: [
        "Healthcare Machine Learning Diagnostic Platform",
        "Decentralized Blockchain Escrow & Identity Architecture",
        "Autonomous Robotics Vision and SLAM Navigation",
        "Secure FinTech Microservices with Kubernetes",
      ],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="outline" className="text-[12px] font-mono px-3 py-1">
          Complete Academic Services
        </Badge>
        <h1 className="text-[34px] sm:text-[46px] font-bold tracking-tight text-foreground">
          Specialized College Document Solutions
        </h1>
        <p className="text-[16px] text-muted-foreground leading-relaxed">
          Every document is prepared by engineering and postgraduate subject specialists adhering to your university formatting guidelines. Protected by our 50-50 milestone escrow.
        </p>
      </div>

      {/* Services List */}
      <div className="space-y-10">
        {serviceCategories.map((service, idx) => (
          <Card
            key={service.id}
            id={service.id}
            className="rounded-[8px] border border-border bg-background shadow-none p-6 sm:p-8 space-y-6"
          >
            {/* Top row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
              <div className="flex items-start space-x-3.5">
                <div className="h-11 w-11 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground shrink-0 mt-0.5">
                  {service.icon}
                </div>
                <div>
                  <h2 className="text-[22px] sm:text-[24px] font-bold text-foreground">
                    {service.title}
                  </h2>
                  <p className="text-[13px] text-muted-foreground">
                    {service.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <Link href={`/user/requests/new?service=${service.id}`}>
                  <Button className="h-10 text-[13px] font-semibold">
                    Request This Service
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Scope / Turnaround Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[6px] bg-surface border border-border text-[12px]">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Typical Scope
                </span>
                <span className="font-semibold text-foreground">{service.pages}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Delivery Speed
                </span>
                <span className="font-semibold text-foreground flex items-center">
                  <Clock className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {service.turnaround}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider font-semibold">
                  Supported Formats
                </span>
                <span className="font-semibold text-foreground">
                  {service.formats.join(" • ")}
                </span>
              </div>
            </div>

            <p className="text-[14px] leading-relaxed text-foreground">
              {service.description}
            </p>

            {/* Two-Column Breakdown: Deliverables & Sample Topics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Key Deliverables
                </h4>
                <ul className="space-y-2 text-[13px] text-muted-foreground">
                  {service.deliverables.map((item, dIdx) => (
                    <li key={dIdx} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-foreground shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Common University Topics
                </h4>
                <ul className="space-y-2 text-[13px] text-muted-foreground">
                  {service.sampleTopics.map((topic, tIdx) => (
                    <li key={tIdx} className="flex items-start space-x-2 font-mono text-[12px]">
                      <span className="text-foreground font-bold">›</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Guarantee Banner */}
      <div className="p-8 rounded-[8px] border border-border bg-surface text-center space-y-4">
        <ShieldCheck className="h-10 w-10 text-foreground mx-auto" />
        <h3 className="text-[20px] font-bold text-foreground">
          Need a custom department format or urgent turnaround?
        </h3>
        <p className="text-[14px] text-muted-foreground max-w-xl mx-auto">
          We handle college-specific cover pages, signature blocks, and university rubrics. Chat directly with an admin specialist to get a custom quotation.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/user/requests/new">
            <Button className="h-10 text-[13px] font-semibold">
              Submit Custom Task
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="h-10 text-[13px] border-border">
              Contact Coordinator Desk
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
