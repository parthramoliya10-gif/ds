"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, ArrowRight, ShieldCheck, Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border sticky top-0 bg-background/95 backdrop-blur-none z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-8 w-8 rounded-[8px] bg-foreground text-background flex items-center justify-center font-bold text-[14px]">
              D
            </div>
            <span className="font-bold text-[18px] tracking-tight text-foreground">
              DSMS
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-[14px] font-medium text-muted-foreground">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground"
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
                <Button variant="outline" size="sm" className="h-9 text-[13px] border-border">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="h-9 text-[13px] font-semibold">
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
                    className="h-9 w-9 border-border"
                    aria-label="Toggle navigation menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 bg-background border-border p-6 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 pb-4 border-b border-border">
                      <div className="h-7 w-7 rounded-[6px] bg-foreground text-background flex items-center justify-center font-bold text-[13px]">
                        D
                      </div>
                      <span className="font-bold text-[16px] text-foreground">DSMS</span>
                    </div>

                    <nav className="flex flex-col space-y-3">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "text-[15px] font-medium py-1.5 transition-colors",
                            pathname === link.href ? "text-foreground font-semibold" : "text-muted-foreground"
                          )}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-3 pt-6 border-t border-border">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full h-10 border-border text-[14px]">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full h-10 text-[14px] font-semibold">
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

      {/* Rich Multi-Column Footer */}
      <footer className="border-t border-border bg-surface/40 pt-14 pb-10 px-4 sm:px-6 text-[13px]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-12 border-b border-border">
            {/* Col 1: Brand Info (col-span-2) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="h-7 w-7 rounded-[6px] bg-foreground text-background flex items-center justify-center font-bold text-[13px]">
                  D
                </div>
                <span className="font-bold text-[16px] text-foreground tracking-tight">
                  DSMS
                </span>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Document Service Management System for college students across India. Assignments, verified laboratory manual codes, practical files, and project reports completed with 50-50 milestone escrow.
              </p>
              <div className="flex items-center space-x-2 text-[12px] text-muted-foreground pt-1">
                <ShieldCheck className="h-4 w-4 text-foreground" />
                <span>Strictly confidential • Razorpay encrypted</span>
              </div>
            </div>

            {/* Col 2: Services */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
                Services
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/services#assignments" className="hover:text-foreground transition-colors">
                    Subject Assignments
                  </Link>
                </li>
                <li>
                  <Link href="/services#lab-manuals" className="hover:text-foreground transition-colors">
                    Lab Manuals (Code + Outputs)
                  </Link>
                </li>
                <li>
                  <Link href="/services#practical-files" className="hover:text-foreground transition-colors">
                    Practical Files
                  </Link>
                </li>
                <li>
                  <Link href="/services#internship-reports" className="hover:text-foreground transition-colors">
                    Internship Reports
                  </Link>
                </li>
                <li>
                  <Link href="/services#project-reports" className="hover:text-foreground transition-colors">
                    Final Project Reports
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Navigation */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
                Platform
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                    How Milestones Work
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About Our Specialists
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact &amp; Support
                  </Link>
                </li>
                <li>
                  <Link href="/user/requests/new" className="hover:text-foreground transition-colors">
                    Submit a Request
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Support */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-foreground">
                Student Support
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <span className="text-foreground font-medium block">Working Hours:</span>
                  <span>8:00 AM – 11:30 PM IST</span>
                </li>
                <li>
                  <span className="text-foreground font-medium block">WhatsApp Coordinator:</span>
                  <span>+91 98765 43210</span>
                </li>
                <li>
                  <span className="text-foreground font-medium block">Desk Email:</span>
                  <span className="font-mono text-[12px]">support@dsms.college</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-muted-foreground text-[12px]">
            <p>
              © {new Date().getFullYear()} DSMS (Document Service Management System). All rights reserved.
            </p>
            <p className="text-center md:text-right max-w-md">
              Disclaimer: DSMS provides academic formatting, research reference, and computational verification support.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
