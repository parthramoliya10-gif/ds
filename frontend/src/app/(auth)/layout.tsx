import * as React from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthMarketingPanel } from "@/components/auth/AuthMarketingPanel";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Left Column: Auth Form */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 min-h-screen overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between w-full max-w-lg mx-auto">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-[8px] bg-foreground text-background flex items-center justify-center font-bold text-[14px]">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[16px] tracking-tight text-foreground leading-none">
                DSMS
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                Organization Portal
              </span>
            </div>
          </Link>
          <ThemeToggle />
        </header>

        {/* Center Container */}
        <main className="flex-1 flex items-center justify-center py-8">
          <div className="w-full max-w-md">{children}</div>
        </main>

        {/* Footer */}
        <footer className="text-center text-[12px] text-muted-foreground py-2 max-w-lg mx-auto">
          DSMS • Document Service Management System
        </footer>
      </div>

      {/* Right Column: Black Marketing Panel (hidden on screens < 860px) */}
      <AuthMarketingPanel />
    </div>
  );
}
