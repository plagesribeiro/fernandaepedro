"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WEDDING_HELP_PHONE_E164,
  WEDDING_HELP_PHONE_DISPLAY,
  WEDDING_HELP_WHATSAPP_PREFILL,
} from "@/lib/constants";

export function HelpContact({ className }: { className?: string }) {
  const phoneDigits = WEDDING_HELP_PHONE_E164.replace(/\D/g, "");
  const href = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
    WEDDING_HELP_WHATSAPP_PREFILL
  )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-2 text-sm text-warm-gray hover:text-rose-gold transition-colors",
        className
      )}
    >
      <MessageCircle className="w-4 h-4" />
      <span>
        Dúvidas? WhatsApp{" "}
        <span className="font-medium">{WEDDING_HELP_PHONE_DISPLAY}</span>
      </span>
    </a>
  );
}
