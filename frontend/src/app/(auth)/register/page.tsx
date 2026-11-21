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
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(50, "Full name must not exceed 50 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Mail ID is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one capital letter (A-Z)")
      .regex(/[0-9]/, "Password must contain at least one number (0-9)")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character (e.g. !@#$%)"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms of service and organization guidelines",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser } = useAuth();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  const passwordValue = watch("password") || "";
  const termsValue = watch("terms");

  const hasLength = passwordValue.length >= 8;
  const hasUpper = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);
  const isPasswordCriteriaMet = hasLength && hasUpper && hasNumber && hasSpecial;

  const onSubmit = async (data: RegisterFormValues) => {
    if (!isPasswordCriteriaMet) {
      toast.error("Please fulfill all password requirements before proceeding.");
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        fullName: data.name,
      });
      toast.success("Account created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border border-border bg-background rounded-[8px] shadow-none">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-[26px] font-semibold tracking-tight text-foreground">
          Create student account
        </CardTitle>
        <CardDescription className="text-[14px] text-muted-foreground">
          Join DSMS to submit assignments, lab manuals, and manage milestones
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Google Authentication */}
        <GoogleAuthButton label="Sign up with Google" />

        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative z-10 bg-background px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            or sign up with email
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[13px] font-medium">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              {...register("name")}
              className={errors.name ? "border-foreground" : ""}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-[12px] font-medium text-foreground">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email ID */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[13px] font-medium">
              Mail ID
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
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

          {/* Password with Strength Meter */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-medium">
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Min. 8 chars (capital, number, symbol)"
              {...register("password")}
              className={errors.password ? "border-foreground" : ""}
              aria-invalid={Boolean(errors.password)}
            />
            {/* Live 4-Bar Strength Meter with requirements */}
            <PasswordStrengthMeter password={passwordValue} showRequirements />
            {errors.password && (
              <p className="text-[12px] font-medium text-foreground">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-[13px] font-medium">
              Confirm Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Re-enter your password"
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

          {/* Terms & Conditions Checkbox */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsValue}
                onCheckedChange={(checked) => setValue("terms", checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-[12px] text-muted-foreground font-normal leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <span className="text-foreground font-medium underline underline-offset-2">
                  Terms of Service
                </span>{" "}
                and confirm my submitted tasks adhere to organization guidelines.
              </Label>
            </div>
            {errors.terms && (
              <p className="text-[12px] font-medium text-foreground">
                {errors.terms.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-10 font-medium text-[14px]"
            disabled={submitting || !isPasswordCriteriaMet}
          >
            {submitting ? (
              <span className="flex items-center">
                <span className="h-4 w-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center">
                Create Account & Verify
                <ArrowRight className="h-4 w-4 ml-2" />
              </span>
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="text-center text-[13px] text-muted-foreground pt-2">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-foreground font-semibold hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
