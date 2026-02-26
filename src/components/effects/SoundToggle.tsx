"use client";

import { useContext } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { SoundContext } from "./SoundProvider";
import { cn } from "@/lib/utils";

export function SoundToggle() {
  const { enabled, toggle } = useContext(SoundContext);

  return (
    <button
      onClick={toggle}
      className={cn(
        "fixed bottom-6 right-6 z-50 p-3 rounded-full transition-all duration-300",
        "bg-champagne backdrop-blur-sm shadow-lg hover:shadow-xl",
        "border border-rose-gold/20 hover:border-rose-gold/40",
        "hover:scale-110 active:scale-95"
      )}
      aria-label={enabled ? "Desativar som" : "Ativar som"}
      title={enabled ? "Som ativado" : "Som desativado"}
    >
      {enabled ? (
        <Volume2 className="w-5 h-5 text-rose-gold" />
      ) : (
        <VolumeX className="w-5 h-5 text-warm-gray" />
      )}
    </button>
  );
}
