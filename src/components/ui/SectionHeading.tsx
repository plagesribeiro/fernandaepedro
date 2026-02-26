"use client";

import { useEffect, useRef } from "react";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  className,
}: SectionHeadingProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGSAP();
    if (!ref.current) return;

    gsap.fromTo(
      ref.current.children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  return (
    <div ref={ref} className={cn("text-center mb-12", className)}>
      <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl gradient-text mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-warm-gray text-lg md:text-xl max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
      <div className="mt-4 section-divider" />
    </div>
  );
}
