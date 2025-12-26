import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center gap-2",
    "rounded-[11px] min-w-[132px] px-8 py-4",
    "text-base leading-[19px] font-medium text-white",
    "font-sans font-bold",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "transition-all duration-300",
  ],
  {
    variants: {
      variant: {
        default: "",
        secondary: "gradient-button-variant",
        outline: "gradient-button-outline",
      },
      size: {
        default: "px-8 py-4",
        sm: "px-6 py-3 text-sm min-w-[100px]",
        lg: "px-10 py-5 text-lg min-w-[160px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const GradientButton = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };
