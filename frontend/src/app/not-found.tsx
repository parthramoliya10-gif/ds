import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, LayoutDashboard, PlusCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="h-16 w-16 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground mx-auto">
        <FileQuestion className="h-8 w-8 stroke-[1.5]" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="font-mono text-[13px] font-bold text-muted-foreground uppercase tracking-widest block">
          Error 404
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-foreground">
          Page Not Found
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          The task order, document deliverable, or page you are trying to access does not exist or has been relocated.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Link href="/">
          <Button className="h-10 text-[13px] font-semibold">
            <Home className="h-4 w-4 mr-1.5" />
            Home
          </Button>
        </Link>
        <Link href="/user/dashboard">
          <Button variant="outline" className="h-10 text-[13px] border-border font-medium">
            <LayoutDashboard className="h-4 w-4 mr-1.5" />
            Student Dashboard
          </Button>
        </Link>
        <Link href="/user/requests/new">
          <Button variant="outline" className="h-10 text-[13px] border-border font-medium">
            <PlusCircle className="h-4 w-4 mr-1.5" />
            Submit Task
          </Button>
        </Link>
      </div>

      <p className="text-[12px] text-muted-foreground pt-4">
        Need assistance with an active request? Contact WhatsApp support at <strong className="text-foreground font-mono">+91 98765 43210</strong>.
      </p>
    </div>
  );
}
