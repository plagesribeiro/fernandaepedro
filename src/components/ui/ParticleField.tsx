"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const COLORS = [
  "rgba(212, 118, 44, 0.6)",
  "rgba(232, 154, 90, 0.8)",
  "rgba(139, 115, 85, 0.5)",
  "rgba(255, 215, 0, 0.4)",
];

export function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      canvas!.width = canvas!.offsetWidth;
      canvas!.height = canvas!.offsetHeight;
      initParticles();
    }

    function initParticles() {
      const count = Math.floor((canvas!.width * canvas!.height) / 8000);
      particlesRef.current = Array.from({ length: Math.min(count, 100) }, () => {
        const x = Math.random() * canvas!.width;
        const y = Math.random() * canvas!.height;
        return {
          x,
          y,
          baseX: x,
          baseY: y,
          vx: 0,
          vy: 0,
          size: 1 + Math.random() * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 0.3 + Math.random() * 0.5,
        };
      });
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);

    function animate() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        const dx = mouseRef.current.x - p.x;
        const dy = mouseRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = 150;

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        // Spring back to base position
        p.vx += (p.baseX - p.x) * 0.02;
        p.vy += (p.baseY - p.y) * 0.02;

        // Damping
        p.vx *= 0.95;
        p.vy *= 0.95;

        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationRef.current);
    };
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      aria-hidden="true"
    />
  );
}
