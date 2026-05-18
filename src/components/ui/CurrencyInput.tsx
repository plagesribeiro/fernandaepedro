"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { FieldError } from "react-hook-form";

interface CurrencyInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  error?: FieldError;
  placeholder?: string;
}

export function CurrencyInput({
  id,
  label,
  value,
  onChange,
  error,
  placeholder = "0,00",
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (value > 0) {
      return (value / 1).toFixed(2).replace(".", ",");
    }
    return "";
  });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Remove everything except digits
      const raw = e.target.value.replace(/\D/g, "");

      if (raw === "") {
        setDisplayValue("");
        onChange(0);
        return;
      }

      // Convert to cents then format
      const cents = parseInt(raw, 10);
      const reais = cents / 100;
      const formatted = reais.toFixed(2).replace(".", ",");

      setDisplayValue(formatted);
      onChange(reais);
    },
    [onChange]
  );

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-warm-gray font-medium">
          R$
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-4 py-3 rounded-lg border transition-all duration-200",
            "bg-ivory text-charcoal",
            "focus:outline-none focus:ring-2 focus:ring-rose-gold/25 focus:border-rose-gold",
            "placeholder:text-warm-gray/60 text-lg font-semibold",
            error
              ? "border-red-400 focus:ring-red-300/30"
              : "border-charcoal/10 hover:border-rose-gold/40"
          )}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}
