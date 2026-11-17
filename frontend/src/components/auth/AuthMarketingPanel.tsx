import * as React from "react";
import { Check, ShieldCheck, FileText, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthMarketingPanel() {
  return (
    <div className="relative hidden min-[860px]:flex flex-col justify-between w-1/2 p-12 bg-black text-white border-l border-[#262626] overflow-hidden select-none">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 opacity-[0.07] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Header Branding */}
      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-[12px] font-medium tracking-wide">
          <ShieldCheck className="h-3.5 w-3.5 text-white" />
          <span>College Academic Support</span>
        </div>
        <h2 className="text-[26px] font-semibold tracking-tight text-white leading-tight">
          Reliable document completion <br />
          with guaranteed milestones.
        </h2>
        <p className="text-[14px] text-[#A3A3A3] max-w-md leading-relaxed">
          From practical files to complex lab manuals, have your university tasks solved by verified specialists with complete confidentiality.
        </p>
      </div>

      {/* Center Tilted Cards Showcase */}
      <div className="relative z-10 py-10 flex flex-col items-center justify-center space-y-4">
        {/* Tilted Request-Progress Card */}
        <div className="w-full max-w-sm rounded-[8px] border border-white/20 bg-[#111111] p-5 shadow-none transform -rotate-2 hover:rotate-0 transition-transform duration-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono text-[#A3A3A3]">REQ-1003</span>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-white/20 text-[11px] font-medium text-white bg-white/5">
              <svg className="h-2 w-2" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z" />
                <path d="M8 1v14A7 7 0 0 0 8 1z" />
              </svg>
              <span>In Progress</span>
            </div>
          </div>
          <h4 className="text-[15px] font-semibold text-white mb-1">
            DBMS Assignment - Normalized Schema
          </h4>
          <p className="text-[12px] text-[#A3A3A3] mb-3">
            42 Pages • Handwritten format • 3NF & BCNF proofs
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-[#A3A3A3]">
            <span>Specialist assigned</span>
            <span className="text-white font-medium">Delivery in 24h</span>
          </div>
        </div>

        {/* Tilted Quotation Card */}
        <div className="w-full max-w-sm rounded-[8px] border border-white/30 bg-[#161616] p-5 shadow-none transform rotate-2 hover:rotate-0 transition-transform duration-300 ml-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A3A3A3]">
              Milestone Quotation
            </span>
            <span className="text-[20px] font-bold text-white tracking-tight">
              ₹900
            </span>
          </div>

          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-[12px] p-2 rounded-[6px] bg-white/5 border border-white/10">
              <span className="flex items-center text-white">
                <Check className="h-3.5 w-3.5 mr-1.5 stroke-[3] text-white" />
                50% Advance Milestone
              </span>
              <span className="font-semibold text-white">₹450 Paid</span>
            </div>

            <div className="flex items-center justify-between text-[12px] p-2 rounded-[6px] border border-dashed border-white/20 text-[#A3A3A3]">
              <span>50% Balance (Unlocks Download)</span>
              <span className="font-semibold text-white">₹450 Due</span>
            </div>
          </div>

          <p className="text-[10px] text-[#A3A3A3] text-center mt-1">
            Protected by DSMS Escrow: Work begins on advance, files unlock on balance.
          </p>
        </div>
      </div>

      {/* Bottom Footer Quote */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[12px] text-[#A3A3A3]">
        <span>Delhi Tech University & 40+ Colleges</span>
        <span>100% On-Time Delivery Guarantee</span>
      </div>
    </div>
  );
}
