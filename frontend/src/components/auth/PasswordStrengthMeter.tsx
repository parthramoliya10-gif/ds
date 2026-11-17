import * as React from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password = "",
  className,
}: PasswordStrengthMeterProps) {
  const calculateStrength = (pwd: string): { score: number; label: string } => {
    if (!pwd) return { score: 0, label: "" };

    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    let label = "Weak";
    if (score === 2) label = "Fair";
    if (score === 3) label = "Good";
    if (score === 4) label = "Strong";

    return { score, label };
  };

  const { score, label } = calculateStrength(password);

  if (!password) return null;

  return (
    <div className={cn("space-y-1.5 pt-1", className)}>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">Password strength</span>
        <span className="font-semibold text-foreground">{label}</span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5">
        {[1, 2, 3, 4].map((step) => {
          const isFilled = step <= score;
          return (
            <div
              key={step}
              className={cn(
                "h-full rounded-full transition-colors",
                isFilled
                  ? "bg-foreground"
                  : "bg-surface border border-border"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
