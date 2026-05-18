"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function AnimatedButton({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: AnimatedButtonProps) {
  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-lg font-sans font-medium transition-all duration-300",
        "hover:scale-[1.02] active:scale-[0.98] hover:shadow-md",
        {
          "bg-rose-gold text-white hover:bg-rose-gold-dark": variant === "primary",
          "bg-champagne text-charcoal hover:bg-champagne/80 border border-rose-gold/15": variant === "secondary",
          "border border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white":
            variant === "outline",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 shimmer pointer-events-none" />
    </button>
  );
}
