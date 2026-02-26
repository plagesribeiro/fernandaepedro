"use client";

import { useEffect, useRef, useCallback } from "react";
import { useEasterEgg } from "@/hooks/useEasterEgg";

export function EasterEggs() {
  const { activated, reset } = useEasterEgg();
  const heartsRef = useRef<HTMLDivElement>(null);

  const spawnHeartRain = useCallback(() => {
    if (!heartsRef.current) return;
    const container = heartsRef.current;
    container.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const heart = document.createElement("div");
      heart.innerHTML = "💕";
      heart.style.position = "fixed";
      heart.style.left = `${Math.random() * 100}vw`;
      heart.style.top = "-30px";
      heart.style.fontSize = `${16 + Math.random() * 24}px`;
      heart.style.zIndex = "99999";
      heart.style.pointerEvents = "none";
      heart.style.animation = `fall ${3 + Math.random() * 4}s linear forwards`;
      heart.style.animationDelay = `${Math.random() * 2}s`;
      container.appendChild(heart);
    }

    setTimeout(() => {
      container.innerHTML = "";
      reset();
    }, 7000);
  }, [reset]);

  useEffect(() => {
    if (activated) {
      spawnHeartRain();
    }
  }, [activated, spawnHeartRain]);

  // Console art
  useEffect(() => {
    console.log(
      "%c💍 Fernanda & Pedro 💍",
      "font-size: 24px; color: #D4762C; font-family: cursive; font-weight: bold;"
    );
    console.log(
      "%c08 de agosto de 2026 • Palácio das Mangabeiras",
      "font-size: 14px; color: #8B7355;"
    );
    console.log(
      "%cFeito com 💕 para o dia mais especial",
      "font-size: 12px; color: #9A8E82;"
    );
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div ref={heartsRef} aria-hidden="true" />
    </>
  );
}
