"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { ArrowRight, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
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
  const [submitting, setSubmitting] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    setSubmitting(false);
    setIsSuccess(true);
    toast.success("Password successfully updated!");
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      {!isSuccess ? (
        <>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
              Set new password
            </CardTitle>
            <CardDescription className="text-[14px] text-muted-foreground">
              Choose a secure password for your DSMS student account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    Updating password...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Reset & Save Password
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
              Your password has been successfully reset. You can now sign in with your new credentials.
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
