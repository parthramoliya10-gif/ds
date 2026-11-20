"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Mail ID is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormValues) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-[14px] text-muted-foreground">
          Sign in to access your organization tasks, milestones, and chat
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Authentication Button */}
        <GoogleAuthButton label="Sign in with Google" />

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider relative z-10">
            or continue with email
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Email Field */}
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

          {/* Password Field with Show/Hide */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[13px] font-medium">
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              {...register("password")}
              className={errors.password ? "border-foreground" : ""}
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password && (
              <p className="text-[12px] font-medium text-foreground">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Keep Me Logged In Checkbox */}
          <div className="flex items-center space-x-2 pt-1">
            <Checkbox
              id="rememberMe"
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", Boolean(checked))}
            />
            <Label
              htmlFor="rememberMe"
              className="text-[13px] text-muted-foreground font-normal cursor-pointer"
            >
              Keep me logged in on this device
            </Label>
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
                Signing in...
              </span>
            ) : (
              <span className="flex items-center">
                Sign in to DSMS
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            )}
          </Button>
        </form>

        {/* Register Link */}
        <div className="text-center text-[13px] text-muted-foreground pt-2">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-foreground font-semibold hover:underline underline-offset-4"
          >
            Register here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
