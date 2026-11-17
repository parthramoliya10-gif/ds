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
} from "lucide-react";

export function ServicesGrid() {
  const services = [
    {
      title: "Subject Assignments",
      icon: <FileText className="h-5 w-5 stroke-[1.75]" />,
      format: "Typed or Handwritten",
      pages: "5 - 30 Pages",
      turnaround: "From 12 Hours",
      description:
        "Numerical problems, theoretical derivations, programming questions, and essay questions solved according to your course syllabus.",
      features: [
        "Step-by-step mathematical workings",
        "Clean handwritten scans on ruled/unruled sheets",
        "Formatted Word/PDF documents with citations",
      ],
      link: "/user/requests/new?type=assignment",
    },
    {
      title: "Lab Manuals",
      icon: <Binary className="h-5 w-5 stroke-[1.75]" />,
      format: "Code + Screenshots",
      pages: "15 - 50 Pages",
      turnaround: "From 24 Hours",
      description:
        "Full coding laboratory manuals with verified test executions, compiler outputs, simulation diagrams, and packet trace screenshots.",
      features: [
        "Tested source code (C, C++, Java, Python, SQL)",
        "Wireshark, MATLAB, NS2, Cisco Packet Tracer captures",
        "University-standard aims, algorithms, and results",
      ],
      link: "/user/requests/new?type=lab_manual",
    },
    {
      title: "Practical Files",
      icon: <BookOpen className="h-5 w-5 stroke-[1.75]" />,
      format: "Handwritten or Typed",
      pages: "20 - 60 Pages",
      turnaround: "1 - 3 Days",
      description:
        "Complete practical notebooks with indexes, experiment write-ups, circuit diagrams, observation tables, and teacher signature pages.",
      features: [
        "Authentic student handwriting simulation option",
        "Neat tabular calculations & error percentages",
        "Strict university department formatting compliance",
      ],
      link: "/user/requests/new?type=practical_file",
    },
    {
      title: "Internship Reports",
      icon: <Briefcase className="h-5 w-5 stroke-[1.75]" />,
      format: "Company Standard Format",
      pages: "25 - 70 Pages",
      turnaround: "2 - 4 Days",
      description:
        "Comprehensive summer and winter internship documentation adhering to corporate company formats and academic evaluation rubrics.",
      features: [
        "Weekly work logs & milestone summaries",
        "Architecture diagrams, tech stack overviews, and KPIs",
        "Completion certificate placeholders & acknowledgments",
      ],
      link: "/user/requests/new?type=internship_report",
    },
    {
      title: "Project Reports",
      icon: <FolderGit2 className="h-5 w-5 stroke-[1.75]" />,
      format: "IEEE / University Rubric",
      pages: "40 - 120 Pages",
      turnaround: "3 - 7 Days",
      description:
        "Major and minor project thesis documentation including software requirement specifications (SRS), UML diagrams, and testing results.",
      features: [
        "IEEE/ACM reference styling & bibliography",
        "UML Class, Sequence, Use-Case, and ER diagrams",
        "Literature review, methodology, and future enhancements",
      ],
      link: "/user/requests/new?type=project_report",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground">
          Academic Services Catalog
        </h2>
        <p className="text-[15px] text-muted-foreground">
          Tailored specifically for engineering, computing, management, and basic science college students across India.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <Card
            key={idx}
            className="rounded-[8px] border border-border bg-background shadow-none flex flex-col justify-between hover:border-foreground/40 transition-colors"
          >
            <CardHeader className="pb-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-[6px] bg-surface border border-border flex items-center justify-center text-foreground">
                  {service.icon}
                </div>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {service.format}
                </Badge>
              </div>
              <CardTitle className="text-[18px] font-semibold text-foreground">
                {service.title}
              </CardTitle>
              <CardDescription className="text-[13px] text-muted-foreground leading-relaxed">
                {service.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-[6px] bg-surface border border-border text-[11px]">
                <div>
                  <span className="text-muted-foreground block">Scope</span>
                  <span className="font-semibold text-foreground">{service.pages}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Turnaround</span>
                  <span className="font-semibold text-foreground">{service.turnaround}</span>
                </div>
              </div>

              <ul className="space-y-1.5 text-[12px] text-muted-foreground">
                {service.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start space-x-2">
                    <Check className="h-3.5 w-3.5 text-foreground shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-2">
                <Link href={service.link}>
                  <Button variant="outline" size="sm" className="w-full text-[13px] border-border justify-between">
                    <span>Submit {service.title}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
