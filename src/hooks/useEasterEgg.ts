"use client";

import { useState, useEffect, useCallback } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

export function useEasterEgg() {
  const [activated, setActivated] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);

  const reset = useCallback(() => {
    setActivated(false);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      setSequence((prev) => {
        const next = [...prev, e.code].slice(-KONAMI_CODE.length);
        if (next.join(",") === KONAMI_CODE.join(",")) {
          setActivated(true);
        }
        return next;
      });
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { activated, reset };
}
