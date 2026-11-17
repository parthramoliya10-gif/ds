"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home, LayoutDashboard } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error to client-side logging service
    console.error("DSMS Application Error Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center space-y-6">
      <div className="h-16 w-16 rounded-[8px] bg-surface border border-border flex items-center justify-center text-foreground mx-auto">
        <AlertCircle className="h-8 w-8 stroke-[1.5]" />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="font-mono text-[13px] font-bold text-muted-foreground uppercase tracking-widest block">
          Application Error
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          An unexpected error occurred while processing this request. Our technical team has been notified.
        </p>
        {error?.digest && (
          <p className="font-mono text-[11px] text-muted-foreground bg-surface p-2 rounded border border-border inline-block">
            Digest: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button onClick={() => reset()} className="h-10 text-[13px] font-semibold">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Link href="/user/dashboard">
          <Button variant="outline" className="h-10 text-[13px] border-border font-medium">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>
        <Link href="/">
          <Button variant="outline" className="h-10 text-[13px] border-border font-medium">
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
