"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Mail, CheckCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "College email is required")
    .email("Please enter a valid college email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 400));
    setSubmittedEmail(data.email);
    setIsSubmitted(true);
    setSubmitting(false);
    toast.success("Password reset instructions dispatched!");
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      {!isSubmitted ? (
        <>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
              Forgot password?
            </CardTitle>
            <CardDescription className="text-[14px] text-muted-foreground">
              Enter your registered college email and we will send you a password reset link
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium">
                  College Email ID
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
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

              <Button
                type="submit"
                className="w-full h-10 font-medium text-[14px]"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                    Sending reset link...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Send Reset Link
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </span>
                )}
              </Button>
            </form>

            <div className="text-center text-[13px] text-muted-foreground pt-2">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-foreground font-semibold hover:underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </>
      ) : (
        /* "Link sent" Success State */
        <CardContent className="py-8 space-y-5 text-center">
          <div className="w-12 h-12 rounded-full border border-border bg-surface text-foreground flex items-center justify-center mx-auto">
            <Mail className="h-6 w-6 stroke-[1.5]" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[22px] font-semibold tracking-tight text-foreground">
              Check your email
            </h3>
            <p className="text-[14px] text-muted-foreground leading-relaxed">
              We&apos;ve sent password reset instructions to{" "}
              <strong className="text-foreground">{submittedEmail}</strong>.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link href="/reset-password">
              <Button className="w-full h-10 font-medium text-[14px]">
                Proceed to Reset Password
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 border-border text-[13px]"
              onClick={() => {
                toast.info("Password reset link resent to your email.");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Resend Email
            </Button>
          </div>

          <div className="pt-2">
            <Link
              href="/login"
              className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center underline underline-offset-4"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
