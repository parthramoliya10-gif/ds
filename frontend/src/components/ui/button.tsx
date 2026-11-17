import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-surface disabled:text-muted-foreground disabled:border disabled:border-border",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:opacity-90 active:opacity-95",
        secondary:
          "bg-background text-foreground border border-border hover:bg-surface",
        outline:
          "border border-border bg-transparent text-foreground hover:bg-surface",
        ghost:
          "bg-transparent text-foreground hover:bg-surface",
        link:
          "text-foreground underline-offset-4 hover:underline",
        destructive:
          "bg-foreground text-background border border-foreground hover:opacity-90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[8px] px-3 text-[12px]",
        lg: "h-12 rounded-[8px] px-6 text-[14px]",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLocked?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLocked = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || isLocked;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {isLocked && <Lock className="mr-2 h-4 w-4" />}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
