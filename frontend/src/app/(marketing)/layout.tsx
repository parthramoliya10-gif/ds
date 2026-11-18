"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "/#features", label: "Features" },
    { href: "/#workflow", label: "Workflow" },
    { href: "/#escrow", label: "50/50 Escrow" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* ========================================================================= */}
      {/* 1. STICKY NAVBAR                                                          */}
      {/* ========================================================================= */}
      <header className="h-16 border-b border-white/10 sticky top-0 bg-[#070707]/90 backdrop-blur-md z-50 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-8 w-8 rounded-[8px] bg-white text-black flex items-center justify-center font-bold text-[14px]">
              D
            </div>
            <span className="font-bold text-[18px] tracking-tight text-white">
              DSMS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-[14px] font-medium text-zinc-400">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-white",
                    isActive ? "text-white font-semibold" : "text-zinc-400"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs & Theme Toggle */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />

            <div className="hidden sm:flex items-center space-x-2">
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-[13px] border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white"
                >
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  size="sm"
                  className="h-9 text-[13px] font-semibold bg-white text-black hover:bg-zinc-200"
                >
                  Register
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Hamburger */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    aria-label="Toggle navigation menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-[#0c0c0c] border-white/15 p-6 flex flex-col justify-between text-white">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 pb-4 border-b border-white/10">
                      <div className="h-7 w-7 rounded-[6px] bg-white text-black flex items-center justify-center font-bold text-[13px]">
                        D
                      </div>
                      <span className="font-bold text-[16px] text-white">DSMS</span>
                    </div>

                    <nav className="flex flex-col space-y-1">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "text-[15px] font-medium min-h-[44px] flex items-center px-3 rounded-lg transition-colors",
                            pathname === link.href ? "text-white font-semibold bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-white/10">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-11 border-white/20 text-white bg-transparent hover:bg-white/10 text-[14px]">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-11 text-[14px] font-semibold bg-white text-black hover:bg-zinc-200">
                        Register Account
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* ========================================================================= */}
      {/* FOOTER (Grounded Strictly in Actual Project Features)                    */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-[#070707] text-white pt-8 pb-6 px-4 sm:px-8 text-[12px]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 pb-6 border-b border-white/10">
            {/* Col 1: Brand Info (col-span-5) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded-[7px] bg-white text-black flex items-center justify-center font-bold text-[13px]">
                  D
                </div>
                <span className="font-bold text-[16px] text-white tracking-tight">
                  DSMS
                </span>
              </div>
              <p className="text-zinc-400 leading-relaxed max-w-sm font-light text-[12px]">
                Document Service Management System. Submit college assignments, lab manuals, and project reports with typed or handwritten options, chat directly with administrators, and pay through 50-50 milestone escrow in USD ($).
              </p>
              <div className="flex items-center space-x-2 text-[11px] text-zinc-400 pt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" />
                <span>Encrypted • 50/50 Milestone Escrow • Private Download Vault</span>
              </div>
            </div>

            {/* Col 2: Services / Request Types (col-span-3) */}
            <div className="lg:col-span-3 space-y-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                Document Categories
              </h4>
              <ul className="space-y-1.5 text-zinc-400 font-light text-[12px]">
                <li>
                  <Link href="/user/requests/new?category=Assignment" className="hover:text-white transition-colors">
                    Subject Assignments
                  </Link>
                </li>
                <li>
                  <Link href="/user/requests/new?category=LabManual" className="hover:text-white transition-colors">
                    Laboratory Manuals
                  </Link>
                </li>
                <li>
                  <Link href="/user/requests/new?category=PracticalFile" className="hover:text-white transition-colors">
                    Practical Files (Typed/Handwritten)
                  </Link>
                </li>
                <li>
                  <Link href="/user/requests/new?category=ProjectReport" className="hover:text-white transition-colors">
                    Final Project Reports &amp; Thesis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Navigation & System Flow (col-span-4) */}
            <div className="lg:col-span-4 space-y-2.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider text-white font-semibold">
                Platform Workspaces
              </h4>
              <ul className="space-y-1.5 text-zinc-400 font-light text-[12px]">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Student Dashboard</span>
                    <ArrowRight className="h-3 w-3 text-zinc-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Admin Operations Desk</span>
                    <ArrowRight className="h-3 w-3 text-zinc-500" />
                  </Link>
                </li>
                <li>
                  <Link href="/user/requests/new" className="hover:text-white transition-colors flex items-center justify-between">
                    <span>Submit New Document Request</span>
                    <ArrowRight className="h-3 w-3 text-zinc-500" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-zinc-500 text-[11px]">
            <p>
              © {new Date().getFullYear()} DSMS (Document Service Management System). All rights reserved.
            </p>
            <p className="text-center md:text-right">
              All prices quoted in USD ($). 50% advance to start work, 50% balance to unlock download.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
