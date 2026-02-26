"use client";

import { useCallback, useContext } from "react";
import { SoundContext } from "@/components/effects/SoundProvider";

const sounds: Record<string, string> = {
  hover: "/sounds/hover.mp3",
  click: "/sounds/click.mp3",
  success: "/sounds/success.mp3",
  reserve: "/sounds/reserve.mp3",
  easter: "/sounds/easter.mp3",
  whoosh: "/sounds/whoosh.mp3",
  pop: "/sounds/pop.mp3",
};

export function useSoundEffect() {
  const { enabled } = useContext(SoundContext);

  const play = useCallback(
    (name: keyof typeof sounds) => {
      if (!enabled || typeof window === "undefined") return;
      try {
        const audio = new Audio(sounds[name]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch {
        // Ignore audio errors
      }
    },
    [enabled]
  );

  return { play };
}
