"use client";

import { cn } from "@/lib/utils";
import type { FieldError } from "react-hook-form";

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: FieldError;
  id?: string;
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function PhoneInput({
  label,
  value,
  onChange,
  error,
  id,
}: PhoneInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(maskPhone(e.target.value))}
        placeholder="(31) 99999-9999"
        className={cn(
          "w-full px-4 py-3 rounded-xl border transition-all duration-200",
          "bg-champagne backdrop-blur-sm",
          "focus:outline-none focus:ring-2 focus:ring-rose-gold/30 focus:border-rose-gold",
          "placeholder:text-warm-gray/50",
          error
            ? "border-red-400 focus:ring-red-300/30"
            : "border-rose-gold/20 hover:border-rose-gold/40"
        )}
      />
      {error && (
        <p className="text-sm text-red-500 mt-1">{error.message}</p>
      )}
    </div>
  );
}
