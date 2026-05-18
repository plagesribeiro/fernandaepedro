"use client";

import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import type { FieldError } from "react-hook-form";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: FieldError;
  as?: "input" | "textarea";
}

export function FormField({
  label,
  error,
  as = "input",
  className,
  id,
  ...props
}: FormFieldProps & { rows?: number }) {
  const Component = as === "textarea" ? "textarea" : "input";

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <Component
        id={id}
        className={cn(
          "w-full px-4 py-3 rounded-lg border transition-all duration-200",
          "bg-ivory text-charcoal",
          "focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold",
          "placeholder:text-warm-gray/60",
          error
            ? "border-red-400 focus:ring-red-300/30"
            : "border-charcoal/10 hover:border-rose-gold/40",
          className
        )}
        {...(props as Record<string, unknown>)}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}
