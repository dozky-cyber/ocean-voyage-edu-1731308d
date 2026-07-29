import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const oceanButton = cva(
  "relative inline-flex h-12 min-w-[11rem] shrink-0 items-center justify-center gap-2 rounded-full px-7 text-sm font-medium tracking-wide transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_18px_50px_-18px_var(--lagoon)] hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-18px_var(--lagoon)]",
        secondary:
          "border border-border bg-card text-foreground backdrop-blur-md hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/60",
        ghost: "text-muted-foreground hover:text-foreground",
      },
      size: {
        default: "",
        sm: "h-10 min-w-0 px-5 text-xs",
        block: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export type OceanButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof oceanButton>;

export const OceanButton = forwardRef<HTMLButtonElement, OceanButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(oceanButton({ variant, size }), className)}
      {...props}
    />
  ),
);
OceanButton.displayName = "OceanButton";
