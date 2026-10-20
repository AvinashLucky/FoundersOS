"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@shared/lib/utils";

type Variant = "primary" | "ghost" | "quiet";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Magnetic hover — the cursor subtly attracts the button (desktop only). */
  magnetic?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-accent to-accent2 text-accent-ink font-semibold shadow-[0_12px_40px_-12px_var(--glow)] hover:shadow-[0_20px_54px_-14px_var(--glow)]",
  ghost: "bg-white/[0.04] border border-white/[0.13] text-ink hover:bg-white/[0.07]",
  quiet: "bg-transparent text-ink2 hover:text-ink hover:bg-white/[0.04]",
};

/** Strata primary action. One clear primary per focal plane (Principle P2). */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", magnetic = false, className, children, ...props },
  ref,
) {
  const reduce = useReducedMotion();
  const wantMagnet = magnetic && !reduce;

  return (
    <motion.button
      ref={ref}
      whileHover={wantMagnet ? { y: -2 } : undefined}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-medium",
        "transition-[transform,box-shadow,background] duration-300 ease-strata",
        styles[variant],
        className,
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
});
