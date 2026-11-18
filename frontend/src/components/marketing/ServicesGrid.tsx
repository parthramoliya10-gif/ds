"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Binary,
  BookOpen,
  Briefcase,
  FolderGit2,
  ArrowRight,
  Check,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  BarChart2,
} from "lucide-react";

export function ServicesGrid() {
  const services = [
    {
      title: "Subject Assignments",
      format: "Typed or Handwritten",
      pages: "5 - 30 Pages",
      price: "From $15",
      turnaround: "12 - 24 Hours",
      link: "/user/requests/new?type=assignment",
      visual: (
        <div className="rounded-[8px] bg-surface border border-border p-3 space-y-2 font-mono text-[11px] h-28 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[10px] text-muted-foreground uppercase">Ruled Sheet • Handwritten Scan</span>
            <span className="px-1.5 py-0.2 rounded bg-foreground text-background text-[9px] font-bold">Grade A+</span>
          </div>
          <div className="space-y-1 text-muted-foreground text-[10px]">
            <p className="text-foreground font-semibold">Q1. Solve ∇²V = -ρ/ε₀ with Boundary Conditions:</p>
            <p className="italic text-muted-foreground">∮ E · da = Q_enclosed / ε₀ → V(r) = (1/4πε₀) · (q/r)</p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-1">
            <span>Step-by-step proofs</span>
            <span>300 DPI High-Res PDF</span>
          </div>
        </div>
      ),
    },
    {
      title: "Lab Manuals",
      format: "Code + Verified Traces",
      pages: "15 - 50 Pages",
      price: "From $25",
      turnaround: "24 Hours Express",
      link: "/user/requests/new?type=lab_manual",
      visual: (
        <div className="rounded-[8px] bg-[#111111] text-white p-3 space-y-2 font-mono text-[10px] h-28 flex flex-col justify-between overflow-hidden border border-white/10">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <div className="flex items-center space-x-1.5">
              <div className="h-2 w-2 rounded-full bg-red-400" />
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-[9px] text-white/60">terminal • gcc -O2</span>
            </div>
            <span className="text-green-400 text-[9px] font-bold">10/10 PASS ✓</span>
          </div>
          <div className="space-y-0.5 text-white/80 text-[10px]">
            <p className="text-white font-medium">$ ./simulate_packet_trace --nodes=4</p>
            <p className="text-green-400">[ACK] SYN-ACK Handshake latency: 0.84ms</p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-white/50 border-t border-white/10 pt-1">
            <span>Wireshark PCAP Embedded</span>
            <span>Zero AI Hallucination</span>
          </div>
        </div>
      ),
    },
    {
      title: "Practical Files",
      format: "Handwritten or Bound",
      pages: "20 - 60 Pages",
      price: "From $20",
      turnaround: "1 - 3 Days",
      link: "/user/requests/new?type=practical_file",
      visual: (
        <div className="rounded-[8px] bg-surface border border-border p-3 space-y-2 font-mono text-[11px] h-28 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[10px] text-muted-foreground uppercase">Observation Table</span>
            <span className="text-[9px] font-semibold text-foreground">Error: ±0.02%</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px] text-center">
            <div className="p-1 rounded bg-background border border-border">Trial 1: 4.82V</div>
            <div className="p-1 rounded bg-background border border-border">Trial 2: 4.84V</div>
            <div className="p-1 rounded bg-background border border-border">Mean: 4.83V</div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-1">
            <span>Apparatus &amp; Circuit Diagram</span>
            <span>Teacher Sig Stamp</span>
          </div>
        </div>
      ),
    },
    {
      title: "Internship Reports",
      format: "Corporate Standard",
      pages: "25 - 70 Pages",
      price: "From $35",
      turnaround: "2 - 4 Days",
      link: "/user/requests/new?type=internship_report",
      visual: (
        <div className="rounded-[8px] bg-surface border border-border p-3 space-y-2 font-mono text-[11px] h-28 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[10px] text-muted-foreground uppercase">Weekly Log &amp; KPIs</span>
            <span className="px-1.5 py-0.2 rounded bg-background border border-border text-[9px]">Week 1-8</span>
          </div>
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
              <div className="h-full bg-foreground w-4/5" />
            </div>
            <p className="text-[9px] text-muted-foreground">Sprint Velocity: 42 Story Pts • Microservices Architecture</p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-1">
            <span>Docker • AWS • React</span>
            <span>Certificate Included</span>
          </div>
        </div>
      ),
    },
    {
      title: "Project Reports & Thesis",
      format: "IEEE / ACM Rubric",
      pages: "40 - 120 Pages",
      price: "From $50",
      turnaround: "3 - 7 Days",
      link: "/user/requests/new?type=project_report",
      visual: (
        <div className="rounded-[8px] bg-surface border border-border p-3 space-y-2 font-mono text-[11px] h-28 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[10px] text-muted-foreground uppercase">IEEE 2-Column Template</span>
            <span className="text-[9px] font-semibold text-foreground">Plagiarism &lt; 5%</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[8px] text-muted-foreground">
            <div className="p-1 rounded bg-background border border-border">
              <span className="font-semibold text-foreground block">Abstract:</span>
              Deep learning transformer pipeline with 98.2% accuracy.
            </div>
            <div className="p-1 rounded bg-background border border-border">
              <span className="font-semibold text-foreground block">UML Specs:</span>
              Sequence &amp; ER schemas with 3NF integrity.
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-1">
            <span>BibTeX Citations</span>
            <span>LaTeX Source Included</span>
          </div>
        </div>
      ),
    },
    {
      title: "Express 12h Overnight",
      format: "Emergency Priority",
      pages: "5 - 25 Pages",
      price: "From $30",
      turnaround: "Under 12 Hours",
      link: "/user/requests/new?priority=URGENT",
      visual: (
        <div className="rounded-[8px] bg-surface border border-border p-3 space-y-2 font-mono text-[11px] h-28 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-1">
            <span className="text-[10px] text-muted-foreground uppercase">Urgent Queue Dispatch</span>
            <span className="px-1.5 py-0.2 rounded bg-foreground text-background text-[9px] font-bold">12H SLA</span>
          </div>
          <div className="space-y-1 text-[10px]">
            <p className="text-foreground font-semibold flex items-center">
              <span className="h-2 w-2 rounded-full bg-foreground mr-1.5 animate-ping" />
              Specialist assigned within 10 minutes
            </p>
            <p className="text-muted-foreground text-[9px]">Direct live chat channel opened with writer</p>
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground border-t border-border pt-1">
            <span>Overnight Delivery</span>
            <span>Priority Escrow Protected</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="services" className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <h2 className="text-[28px] sm:text-[38px] font-bold tracking-tight text-foreground">
          Visual Services Catalog
        </h2>
        <p className="text-[15px] text-muted-foreground">
          Every task comes with university-formatted deliverables, step-by-step workings, and genuine test traces.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <Card
            key={idx}
            className="rounded-[10px] border border-border bg-background shadow-none flex flex-col justify-between hover:border-foreground/40 transition-colors p-5 space-y-4"
          >
            {/* Visual Document Mockup Preview Box */}
            {service.visual}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-foreground">
                  {service.title}
                </h3>
                <span className="font-mono text-[13px] font-bold text-foreground">
                  {service.price}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>{service.pages}</span>
                <span>•</span>
                <span>{service.turnaround}</span>
              </div>
            </div>

            <Link href={service.link}>
              <Button variant="outline" size="sm" className="w-full text-[12px] border-border font-medium justify-between h-9">
                <span>Configure {service.title}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
