"use client";

import PhoneNumberInput, {
  isValidPhoneNumber,
} from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Mensagem de erro vinda do form (ex: react-hook-form). */
  error?: string;
  id?: string;
}

export function PhoneInput({
  label,
  value,
  onChange,
  error,
  id,
}: PhoneInputProps) {
  // Valida só se o usuário já digitou algo. Com seletor de país, o valor é
  // sempre E.164 (`+5531999999999`) ou undefined.
  const showInvalid = !!value && !isValidPhoneNumber(value);
  const errorText = error ?? (showInvalid ? "Número inválido" : null);

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-charcoal">
        {label}
      </label>
      <div
        className={cn(
          "fp-phone-input flex items-center rounded-lg border transition-all duration-200 bg-ivory",
          "focus-within:outline-none focus-within:ring-2 focus-within:ring-rose-gold/25 focus-within:border-rose-gold",
          errorText
            ? "border-red-400 focus-within:ring-red-300/30"
            : "border-charcoal/10 hover:border-rose-gold/40"
        )}
      >
        <PhoneNumberInput
          id={id}
          international
          defaultCountry="BR"
          countryCallingCodeEditable={false}
          value={value || undefined}
          onChange={(v) => onChange(v ?? "")}
          placeholder="(31) 99999-9999"
          numberInputProps={{
            className:
              "flex-1 bg-transparent border-0 outline-none text-charcoal placeholder:text-warm-gray/60 px-2 py-3",
            "aria-invalid": !!errorText,
          }}
        />
      </div>
      {errorText && <p className="text-sm text-red-500 mt-1">{errorText}</p>}
    </div>
  );
}
