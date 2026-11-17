"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    // Simulate OAuth handshake then redirect to user dashboard
    const timer = setTimeout(() => {
      router.push("/user/dashboard");
    }, 700);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none max-w-sm mx-auto">
      <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-2 border-border border-t-foreground animate-spin" />
          <ShieldCheck className="h-5 w-5 absolute text-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="text-[18px] font-semibold text-foreground tracking-tight">
            Signing you in...
          </h3>
          <p className="text-[13px] text-muted-foreground">
            Verifying your university credentials and establishing session
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
