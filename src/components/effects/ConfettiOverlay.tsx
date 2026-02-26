"use client";

import { useEffect, useRef, useCallback } from "react";

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  width: number;
  height: number;
  color: string;
  life: number;
}

const CONFETTI_COLORS = [
  "#D4762C",
  "#E89A5A",
  "#8B7355",
  "#F0E6DA",
  "#A85A1E",
  "#A08B6D",
  "#FFD700",
  "#C4843A",
];

export function ConfettiOverlay({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const piecesRef = useRef<ConfettiPiece[]>([]);
  const animationRef = useRef<number>(0);

  const spawn = useCallback(() => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < 150; i++) {
      pieces.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        width: 6 + Math.random() * 6,
        height: 4 + Math.random() * 8,
        color:
          CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        life: 0,
      });
    }
    piecesRef.current = pieces;
  }, []);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    spawn();

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      piecesRef.current = piecesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.life++;

        const alpha = Math.max(0, 1 - p.life / 200);
        if (alpha <= 0 || p.y > canvas!.height + 50) return false;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate((p.rotation * Math.PI) / 180);
        ctx!.globalAlpha = alpha;
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
        ctx!.restore();
        return true;
      });

      if (piecesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animate();

    return () => cancelAnimationFrame(animationRef.current);
  }, [active, spawn]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[10000]"
      aria-hidden="true"
    />
  );
}
