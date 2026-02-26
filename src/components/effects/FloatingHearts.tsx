"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface FloatingHeart {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
}

export function FloatingHearts({ count = 8 }: { count?: number }) {
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const generated: FloatingHeart[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 6 + Math.random() * 8,
      size: 12 + Math.random() * 16,
      opacity: 0.1 + Math.random() * 0.2,
    }));
    setHearts(generated);
  }, [count, reducedMotion]);

  if (reducedMotion || hearts.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="absolute bottom-0 animate-float"
          style={{
            left: `${heart.left}%`,
            animationDelay: `${heart.delay}s`,
            animationDuration: `${heart.duration}s`,
            opacity: heart.opacity,
          }}
        >
          <Heart
            size={heart.size}
            className="text-rose-gold fill-rose-gold"
          />
        </div>
      ))}
    </div>
  );
}
