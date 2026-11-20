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

const registerSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Mail ID is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms of service and academic fair-use guidelines",
  }),
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
      terms: false,
    },
  });

  const passwordValue = watch("password");
  const termsValue = watch("terms");

  const onSubmit = async (data: RegisterFormValues) => {
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
          <div className="border-t border-border w-full" />
          <span className="bg-background px-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider relative z-10">
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
              placeholder="Enter your full name"
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

          {/* Password with Strength Meter */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[13px] font-medium">
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Minimum 6 characters"
              {...register("password")}
              className={errors.password ? "border-foreground" : ""}
              aria-invalid={Boolean(errors.password)}
            />
            {/* Live 4-Bar Strength Meter */}
            <PasswordStrengthMeter password={passwordValue} />
            {errors.password && (
              <p className="text-[12px] font-medium text-foreground">
                {errors.password.message}
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
            disabled={submitting}
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
