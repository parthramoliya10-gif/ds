import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { School, Star, Quote } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Aarav Sharma",
      college: "Delhi Technological University (DTU)",
      course: "B.Tech CSE, Sem 6",
      subject: "Computer Networks Lab Manual",
      quote:
        "The specialist included actual Wireshark pcap packet captures with socket programs in C that compiled flawlessly on Ubuntu. The 50/50 escrow gave me complete peace of mind.",
    },
    {
      name: "Priya Menon",
      college: "Vellore Institute of Technology (VIT)",
      course: "B.Tech IT, Sem 5",
      subject: "Operating Systems Practical File",
      quote:
        "Our professor is notorious for rejecting manuals without thread synchronization diagrams. DSMS formatted all 35 pages with Producer-Consumer and Dining Philosophers code. Saved my internal marks!",
    },
    {
      name: "Rohan Gupta",
      college: "BITS Pilani",
      course: "B.E. Computer Science, Sem 7",
      subject: "Cloud Computing AWS Architecture Lab",
      quote:
        "Turnaround was under 24 hours. They followed our exact college cover page template and attached clean CLI execution logs. Definitely using DSMS for my major project report.",
    },
    {
      name: "Ananya Roy",
      college: "Netaji Subhas University of Technology (NSUT)",
      course: "B.Tech ECE, Sem 4",
      subject: "Microprocessor 8086 Assembly File",
      quote:
        "I requested a handwritten practical file on college-ruled sheets. The handwriting was super neat, with drawn timing diagrams. Arrived as high-resolution printable PDF.",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-border">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
        <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight text-foreground">
          Trusted by College Students
        </h2>
        <p className="text-[15px] text-muted-foreground">
          See why thousands of students across premier engineering and science universities rely on DSMS each semester.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t, idx) => (
          <Card
            key={idx}
            className="rounded-[8px] border border-border bg-background shadow-none p-5 sm:p-6 flex flex-col justify-between hover:border-foreground/30 transition-colors"
          >
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex text-foreground">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground stroke-none" />
                  ))}
                </div>
                <span className="font-mono text-[11px] font-medium text-muted-foreground px-2 py-0.5 rounded bg-surface border border-border">
                  {t.subject}
                </span>
              </div>

              <p className="text-[14px] leading-relaxed text-foreground italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-foreground">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-muted-foreground flex items-center mt-0.5">
                    <School className="h-3 w-3 mr-1" />
                    {t.college} • {t.course}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
