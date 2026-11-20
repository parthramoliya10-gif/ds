"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, RotateCw, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";
import supabase from "@/lib/supabase/client";

export default function VerifyOtpPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("");
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = React.useState(30);
  const [isShaking, setIsShaking] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("dsms_pending_email") || "";
      setEmail(stored);
      const devOtp = sessionStorage.getItem("dsms_dev_otp");
      if (devOtp && devOtp.length === 6) {
        setOtp(devOtp.split(""));
        toast.info(`Development Mode: Auto-filled OTP (${devOtp})`);
      }
    }
  }, []);

  // 30s Countdown timer
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Focus first input on mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only accept numeric digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage(null);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move back and clear previous
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    setErrorMessage(null);

    // Focus on next empty input or last
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setOtp(["", "", "", "", "", ""]);
    setErrorMessage(null);
    inputRefs.current[0]?.focus();

    try {
      if (email) {
        await api.auth.sendOtp({ email });
      }
      toast.info("A new 6-digit verification code was sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend code. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join("");
    if (fullCode.length < 6) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Verify OTP with Backend
      const res = (await api.auth.verifyOtp({
        email,
        token: fullCode,
      })) as any;

      // 2. Establish client-side Supabase session & cookies so middleware allows dashboard access
      const pendingPassword =
        typeof window !== "undefined"
          ? sessionStorage.getItem("dsms_pending_password")
          : null;

      let sessionEstablished = false;

      // Primary strategy: native Supabase password sign-in (sets all @supabase/ssr cookies)
      if (pendingPassword) {
        try {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email,
            password: pendingPassword,
          });
          if (!signInErr) {
            sessionEstablished = true;
          }
        } catch (authErr) {
          console.warn("Client signInWithPassword failed:", authErr);
        }
      }

      // Fallback strategy: setSession using tokens returned by backend
      if (!sessionEstablished && res?.accessToken && res?.refreshToken) {
        try {
          const { error: setErr } = await supabase.auth.setSession({
            access_token: res.accessToken,
            refresh_token: res.refreshToken,
          });
          if (!setErr) {
            sessionEstablished = true;
          }
        } catch (setErr) {
          console.warn("Client setSession failed:", setErr);
        }
      }

      // Store backend JWT for API calls and clean up temporary storage
      if (typeof window !== "undefined") {
        if (res?.accessToken) {
          localStorage.setItem("dsms_auth_token", res.accessToken);
        }
        sessionStorage.removeItem("dsms_pending_email");
        sessionStorage.removeItem("dsms_pending_name");
        sessionStorage.removeItem("dsms_pending_password");
        sessionStorage.removeItem("dsms_dev_otp");
      }

      toast.success("College email verified successfully! Redirecting to dashboard...");

      const role = (res?.user?.role || "").toLowerCase();
      const targetDashboard = role === "admin" ? "/admin/dashboard" : "/user/dashboard";

      // Redirect immediately to dashboard
      window.location.href = targetDashboard;
    } catch (err: any) {
      setIsShaking(true);
      setErrorMessage(err.message || "Invalid or expired verification code. Please try again.");
      setTimeout(() => setIsShaking(false), 600);
      setSubmitting(false);
    }
  };

  const isComplete = otp.every((d) => d.length === 1);

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
          Enter verification code
        </CardTitle>
        <CardDescription className="text-[14px] text-muted-foreground">
          We sent a 6-digit confirmation code to{" "}
          <span className="font-semibold text-foreground">{email || "your registered email"}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 6 Digit Inputs Container with Shake State */}
          <div
            className={cn(
              "flex items-center justify-between gap-2 max-w-sm mx-auto transition-transform",
              isShaking && "animate-[shake_0.5s_ease-in-out]"
            )}
            style={{
              animation: isShaking
                ? "shake 0.5s cubic-bezier(.36,.07,.19,.97) both"
                : "none",
            }}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className={cn(
                  "h-12 w-11 sm:h-14 sm:w-12 text-center text-[22px] font-mono font-semibold rounded-[8px] border bg-background text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-foreground",
                  errorMessage
                    ? "border-foreground"
                    : digit
                    ? "border-foreground bg-surface"
                    : "border-border"
                )}
                aria-label={`Digit ${idx + 1}`}
              />
            ))}
          </div>

          <style jsx>{`
            @keyframes shake {
              10%, 90% { transform: translate3d(-1px, 0, 0); }
              20%, 80% { transform: translate3d(2px, 0, 0); }
              30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
              40%, 60% { transform: translate3d(4px, 0, 0); }
            }
          `}</style>

          {/* Inline Error Message */}
          {errorMessage && (
            <div className="flex items-center justify-center space-x-1.5 text-[12px] font-medium text-foreground bg-surface border border-border p-2 rounded-[6px]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Verify Button (disabled until 6 digits) */}
          <Button
            type="submit"
            className="w-full h-10 font-medium text-[14px]"
            disabled={!isComplete || submitting}
          >
            {submitting ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Verifying code...
              </span>
            ) : (
              <span className="flex items-center">
                Verify & Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            )}
          </Button>
        </form>

        {/* Resend Timer & Change Email */}
        <div className="space-y-3 pt-2 text-center text-[13px] border-t border-border">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-muted-foreground">Didn&apos;t get the code?</span>
            {resendTimer > 0 ? (
              <span className="font-mono font-medium text-foreground text-[12px]">
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-foreground hover:underline underline-offset-4 flex items-center"
              >
                <RotateCw className="h-3 w-3 mr-1" />
                Resend code
              </button>
            )}
          </div>

          <div>
            <Link
              href="/register"
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center underline underline-offset-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Change email address
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
