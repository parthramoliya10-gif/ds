"use client";

import * as React from "react";
import { School, ShieldCheck, Award } from "lucide-react";

export function PartnersMarquee() {
  const universities = [
    { code: "DTU", name: "Delhi Technological Univ", location: "New Delhi", count: "1,840+ tasks" },
    { code: "BITS", name: "BITS Pilani", location: "Pilani", count: "1,420+ tasks" },
    { code: "VIT", name: "Vellore Inst of Tech", location: "Vellore", count: "2,190+ tasks" },
    { code: "IITD", name: "IIT Delhi", location: "Hauz Khas", count: "980+ tasks" },
    { code: "NSUT", name: "Netaji Subhas Univ", location: "Dwarka", count: "1,120+ tasks" },
    { code: "STAN", name: "Stanford Engineering", location: "California", count: "430+ tasks" },
    { code: "CAL", name: "UC Berkeley", location: "Berkeley", count: "510+ tasks" },
    { code: "UW", name: "Univ of Waterloo", location: "Ontario", count: "640+ tasks" },
    { code: "NUS", name: "National Univ of Singapore", location: "Singapore", count: "390+ tasks" },
    { code: "GT", name: "Georgia Tech", location: "Atlanta", count: "570+ tasks" },
  ];

  // Duplicate list to achieve seamless infinite loop
  const marqueeList = [...universities, ...universities];

  return (
    <section className="w-full bg-[#070707] border-y border-white/10 py-10 sm:py-12 overflow-hidden select-none">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <div className="inline-flex items-center space-x-2 text-[11px] font-mono uppercase tracking-widest text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-200" />
          <span>Trusted by Students Across 48+ Premier Engineering &amp; Computing Institutions</span>
        </div>
      </div>

      {/* Infinite Horizontal Animated Marquee */}
      <div className="relative w-full overflow-hidden mask-fade">
        {/* Left & Right gradient edge fades */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#070707] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#070707] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center space-x-4 sm:space-x-6 py-2">
          {marqueeList.map((uni, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-sm hover:border-white/30 hover:bg-white/[0.06] transition-all group shrink-0"
            >
              <div className="h-8 w-8 rounded-full bg-white text-black flex items-center justify-center font-mono font-bold text-[11px] shrink-0 group-hover:scale-105 transition-transform">
                {uni.code.slice(0, 3)}
              </div>
              <div className="leading-tight text-left">
                <span className="font-semibold text-white text-[13px] block group-hover:text-zinc-100 transition-colors">
                  {uni.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {uni.location} • {uni.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
