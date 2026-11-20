"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { ArrowRight, CheckCircle2, RotateCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";

const resetPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, "Mail ID is required")
      .email("Please enter a valid email address"),
    otp: z
      .string()
      .min(6, "Verification code must be 6 digits")
      .max(6, "Verification code must be 6 digits")
      .regex(/^\d{6}$/, "Code must contain exactly 6 numbers"),
    password: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [resendTimer, setResendTimer] = React.useState(30);
  const [isResending, setIsResending] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      otp: "",
      password: "",
      confirmPassword: "",
    },
  });

  const emailValue = watch("email");
  const passwordValue = watch("password");

  // Load email from sessionStorage if available
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("dsms_reset_email");
      if (storedEmail) {
        setValue("email", storedEmail);
      }
    }
  }, [setValue]);

  // Resend cooldown countdown
  React.useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isResending) return;
    if (!emailValue) {
      toast.error("Please enter your mail ID first.");
      return;
    }

    setIsResending(true);
    try {
      await api.auth.forgotPassword({ email: emailValue });
      setResendTimer(30);
      toast.info("A new 6-digit verification code was sent to your email.");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification code.");
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setSubmitting(true);
    try {
      await api.auth.resetPassword({
        email: data.email,
        token: data.otp,
        password: data.password,
      });

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("dsms_reset_email");
      }

      setIsSuccess(true);
      toast.success("Password successfully reset! Redirecting to login...");

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password. Please check your OTP code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      {!isSuccess ? (
        <>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
              Reset Password
            </CardTitle>
            <CardDescription className="text-[14px] text-muted-foreground">
              Enter the 6-digit verification code sent to your email and your new password.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Mail ID */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium">
                  Enter Mail ID
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter Mail ID"
                  {...register("email")}
                  className={errors.email ? "border-foreground" : ""}
                  aria-invalid={Boolean(errors.email)}
                />
                {errors.email && (
                  <p className="text-[12px] font-medium text-foreground">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* 6-Digit OTP Code with Resend Action */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="otp" className="text-[13px] font-medium">
                    6-Digit Verification Code
                  </Label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0 || isResending}
                    className="text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    <RotateCw className={`h-3 w-3 ${isResending ? "animate-spin" : ""}`} />
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                  </button>
                </div>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  {...register("otp")}
                  className={`font-mono tracking-widest text-[16px] ${errors.otp ? "border-foreground" : ""}`}
                  aria-invalid={Boolean(errors.otp)}
                />
                {errors.otp && (
                  <p className="text-[12px] font-medium text-foreground">
                    {errors.otp.message}
                  </p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-medium">
                  New Password
                </Label>
                <PasswordInput
                  id="password"
                  placeholder="At least 6 characters"
                  {...register("password")}
                  className={errors.password ? "border-foreground" : ""}
                  aria-invalid={Boolean(errors.password)}
                />
                <PasswordStrengthMeter password={passwordValue} />
                {errors.password && (
                  <p className="text-[12px] font-medium text-foreground">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm New Password Field */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
                  Confirm New Password
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="Repeat new password"
                  {...register("confirmPassword")}
                  className={errors.confirmPassword ? "border-foreground" : ""}
                  aria-invalid={Boolean(errors.confirmPassword)}
                />
                {errors.confirmPassword && (
                  <p className="text-[12px] font-medium text-foreground">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-10 font-medium text-[14px]"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                    Verifying OTP & Updating Password...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Verify OTP & Reset Password
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center text-[13px] text-muted-foreground pt-2">
              Back to{" "}
              <Link
                href="/login"
                className="text-foreground font-semibold hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </>
      ) : (
        /* Success State */
        <CardContent className="py-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full border border-border bg-surface text-foreground flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
              Password updated
            </h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              Your password has been successfully verified and reset. You can now sign in with your new password.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/login">
              <Button className="w-full h-10 font-medium text-[14px]">
                Sign in to DSMS
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
