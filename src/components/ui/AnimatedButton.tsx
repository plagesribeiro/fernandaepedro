"use client";

import { cn } from "@/lib/utils";
import { useSoundEffect } from "@/hooks/useSoundEffect";
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
  onMouseEnter,
  onClick,
  ...props
}: AnimatedButtonProps) {
  const { play } = useSoundEffect();

  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-full font-sans font-medium transition-all duration-300",
        "hover:scale-105 active:scale-95 hover:shadow-lg",
        {
          "bg-rose-gold text-white hover:bg-rose-gold-dark": variant === "primary",
          "bg-champagne text-charcoal hover:bg-champagne/80": variant === "secondary",
          "border-2 border-rose-gold text-rose-gold hover:bg-rose-gold hover:text-white":
            variant === "outline",
        },
        {
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-base": size === "md",
          "px-8 py-4 text-lg": size === "lg",
        },
        className
      )}
      onMouseEnter={(e) => {
        play("hover");
        onMouseEnter?.(e);
      }}
      onClick={(e) => {
        play("click");
        onClick?.(e);
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 shimmer pointer-events-none" />
    </button>
  );
}
