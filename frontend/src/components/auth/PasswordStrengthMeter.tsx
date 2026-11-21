import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface PasswordStrengthMeterProps {
  password?: string;
  className?: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({
  password = "",
  className,
  showRequirements = false,
}: PasswordStrengthMeterProps) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (hasLength) score += 1;
  if (hasUpper) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  let label = "Weak";
  if (score === 2) label = "Fair";
  if (score === 3) label = "Good";
  if (score === 4) label = "Strong";

  if (!password && !showRequirements) return null;

  return (
    <div className={cn("space-y-2 pt-1", className)}>
      {password ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Password strength</span>
            <span
              className={cn(
                "font-semibold",
                score === 4
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-foreground"
              )}
            >
              {label}
            </span>
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
                      ? score === 4
                        ? "bg-emerald-600 dark:bg-emerald-400"
                        : "bg-foreground"
                      : "bg-surface border border-border"
                  )}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {showRequirements && (
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-1 text-[11px]">
          <div
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              hasLength
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {hasLength ? (
              <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 stroke-[1.75] text-muted-foreground/40 shrink-0" />
            )}
            <span>Min. 8 characters</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              hasUpper
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {hasUpper ? (
              <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 stroke-[1.75] text-muted-foreground/40 shrink-0" />
            )}
            <span>1 capital letter (A-Z)</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              hasNumber
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {hasNumber ? (
              <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 stroke-[1.75] text-muted-foreground/40 shrink-0" />
            )}
            <span>1 number (0-9)</span>
          </div>

          <div
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              hasSpecial
                ? "text-emerald-700 dark:text-emerald-400 font-medium"
                : "text-muted-foreground"
            )}
          >
            {hasSpecial ? (
              <Check className="h-3.5 w-3.5 stroke-[3] text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 stroke-[1.75] text-muted-foreground/40 shrink-0" />
            )}
            <span>1 special character</span>
          </div>
        </div>
      )}
    </div>
  );
}
