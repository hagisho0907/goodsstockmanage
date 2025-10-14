import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/60 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_rgba(37,99,235,0.25)] hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_6px_16px_rgba(239,68,68,0.2)] hover:bg-destructive/90 focus-visible:ring-destructive/25 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70",
        outline:
          "border border-border bg-card text-foreground shadow-sm hover:border-primary/40 hover:text-primary hover:bg-primary/5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost:
          "text-muted-foreground hover:bg-primary/10 hover:text-primary",
        subtle:
          "bg-accent text-accent-foreground shadow-sm hover:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline font-medium",
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-md gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-7 has-[>svg]:px-5 text-base",
        icon: "size-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & {
      asChild?: boolean;
    }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
