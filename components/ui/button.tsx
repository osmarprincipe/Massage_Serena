"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.005em] transition-all duration-[250ms] ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "text-primary-foreground [background:linear-gradient(160deg,#7a0c1c_0%,#5c0815_55%,#3d0510_100%)] [box-shadow:0_2px_10px_rgba(122,12,28,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:brightness-[1.22] hover:[box-shadow:0_5px_24px_rgba(177,18,38,0.55),inset_0_1px_0_rgba(255,255,255,0.10)]",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90 shadow-soft",
        outline:
          "border text-foreground transition-colors [border-color:rgba(255,255,255,0.10)] [background:rgba(255,255,255,0.04)] hover:[background:rgba(255,255,255,0.08)] hover:[border-color:rgba(255,255,255,0.14)]",
        secondary:
          "text-foreground [background:rgba(255,255,255,0.06)] [border:1px_solid_rgba(255,255,255,0.09)] hover:[background:rgba(255,255,255,0.10)] hover:[border-color:rgba(255,255,255,0.13)]",
        ghost: "text-muted-foreground hover:text-foreground [hover:background:rgba(255,255,255,0.06)]",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "text-white [background:linear-gradient(135deg,#9a7a1a_0%,#d4af37_100%)] [box-shadow:0_2px_12px_rgba(212,175,55,0.30)] hover:brightness-110",
      },
      size: {
        default: "h-10 px-5 py-2.5",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-7 py-3 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
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
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
