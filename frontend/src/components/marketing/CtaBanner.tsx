import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function CtaBanner() {
  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="rounded-[8px] bg-foreground text-background p-8 sm:p-14 text-center space-y-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-background/10 text-background text-[12px] font-medium mx-auto">
          <Zap className="h-3.5 w-3.5 fill-background stroke-none" />
          <span>Need an urgent submission finished before tomorrow?</span>
        </div>

        <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight text-background leading-tight max-w-2xl mx-auto">
          Ready to get your college task done?
        </h2>

        <p className="max-w-xl mx-auto text-[15px] sm:text-[16px] text-background/80 leading-relaxed">
          Submit your instructions in under 2 minutes. Receive a fair 50-50 milestone quotation from an academic specialist and relax while we solve it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/user/requests/new" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-[15px] font-semibold bg-background text-foreground hover:bg-background/90"
            >
              Submit your task
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href="/services" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-[15px] font-medium border-background/20 text-background hover:bg-background/10"
            >
              Explore Services
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-center space-x-4 pt-4 text-[12px] text-background/70">
          <span className="flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            50% Advance Milestone
          </span>
          <span>•</span>
          <span>Pay Balance on Delivery</span>
          <span>•</span>
          <span>100% Confidential</span>
        </div>
      </div>
    </section>
  );
}
