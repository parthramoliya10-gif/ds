"use client";

import * as React from "react";
import { Star, School, CheckCircle2, Heart } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Alex Rivera",
      college: "Delhi Technological University (DTU)",
      course: "B.Tech CSE, Sem 6",
      subject: "Computer Networks Lab Manual",
      rating: 5,
      quote:
        "The specialist included actual Wireshark pcap packet captures with socket programs in C that compiled flawlessly on Ubuntu. The 50/50 escrow gave me complete peace of mind.",
    },
    {
      name: "Priya Menon",
      college: "Vellore Institute of Technology (VIT)",
      course: "B.Tech IT, Sem 5",
      subject: "Operating Systems Practical File",
      rating: 5,
      quote:
        "Our professor is notorious for rejecting manuals without thread synchronization diagrams. DSMS formatted all 35 pages with Producer-Consumer and Dining Philosophers code. Saved my internal marks!",
    },
    {
      name: "Rohan Gupta",
      college: "BITS Pilani",
      course: "B.E. Computer Science, Sem 7",
      subject: "Cloud Computing AWS Architecture Lab",
      rating: 5,
      quote:
        "Turnaround was under 24 hours. They followed our exact college cover page template and attached clean CLI execution logs. Definitely using DSMS for my major project report.",
    },
    {
      name: "Ananya Roy",
      college: "Netaji Subhas University of Technology (NSUT)",
      course: "B.Tech ECE, Sem 4",
      subject: "Microprocessor 8086 Assembly File",
      rating: 5,
      quote:
        "I requested a handwritten practical file on college-ruled sheets. The handwriting was super neat, with drawn timing diagrams. Arrived as high-resolution printable PDF.",
    },
  ];

  return (
    <section id="testimonials" className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-20 sm:py-28 border-t border-zinc-200 dark:border-zinc-800">
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[11px] font-mono uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <Heart className="h-3.5 w-3.5 fill-current text-red-500" />
          <span>Student Satisfaction</span>
        </div>
        <h2 className="text-[32px] sm:text-[46px] font-light tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
          Loved by Students Worldwide
        </h2>
        <p className="text-[15px] sm:text-[17px] text-zinc-500 font-light">
          Real feedback from engineering students across premier universities each semester.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testimonials.map((t, idx) => (
          <div
            key={idx}
            className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 sm:p-8 flex flex-col justify-between space-y-5 hover:border-zinc-400 dark:hover:border-zinc-600 transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-500 space-x-1">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500 stroke-none" />
                  ))}
                </div>
                <span className="font-mono text-[10px] font-semibold text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                  {t.subject}
                </span>
              </div>

              <p className="text-[14px] sm:text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300 font-light italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-[12px]">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                    {t.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 flex items-center">
                    <School className="h-3 w-3 mr-1" />
                    {t.college} • {t.course}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
