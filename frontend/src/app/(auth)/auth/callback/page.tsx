"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import supabase from "@/lib/supabase/client";
import api from "@/lib/api/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  React.useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorDesc = params.get("error_description") || params.get("error");
        if (errorDesc) {
          console.error("OAuth redirect error:", errorDesc);
          if (mounted) router.replace("/login");
          return;
        }

        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Code exchange error:", error);
          }
        }

        let {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          await new Promise((r) => setTimeout(r, 800));
          const retry = await supabase.auth.getSession();
          session = retry.data.session;
        }

        if (!session?.user) {
          if (mounted) router.replace("/login");
          return;
        }

        // Determine destination by fetching profile or checking metadata
        let role = "student";
        try {
          const profile = await api.auth.getMe();
          if (profile?.role?.toUpperCase() === "ADMIN") {
            role = "admin";
          }
        } catch {
          const metaRole = (
            session.user.user_metadata?.role ||
            session.user.app_metadata?.role ||
            ""
          ).toLowerCase();
          if (metaRole === "admin") role = "admin";
        }

        if (mounted) {
          if (role === "admin") {
            router.replace("/admin/dashboard");
          } else {
            router.replace("/user/dashboard");
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        if (mounted) router.replace("/login");
      }
    }

    handleAuthCallback();

    return () => {
      mounted = false;
    };
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
            Verifying your credentials and establishing session
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
