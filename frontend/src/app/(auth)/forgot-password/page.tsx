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
import { ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api/client";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Mail ID is required")
    .email("Please enter a valid email address"),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

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
    try {
      await api.auth.forgotPassword({ email: data.email });
      if (typeof window !== "undefined") {
        sessionStorage.setItem("dsms_reset_email", data.email);
      }
      toast.success("A 6-digit verification code has been sent to your email!");
      router.push("/reset-password");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset code. Please check your email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
          Forgot password?
        </CardTitle>
        <CardDescription className="text-[14px] text-muted-foreground">
          Enter your registered mail ID and we will send a 6-digit verification code to reset your password.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium">
              Mail ID
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

          <Button
            type="submit"
            className="w-full h-10 font-medium text-[14px]"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Sending verification code...
              </span>
            ) : (
              <span className="flex items-center">
                Send 6-Digit Code
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
    </Card>
  );
}
