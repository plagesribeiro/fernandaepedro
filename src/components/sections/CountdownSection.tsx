"use client";

import { useEffect, useRef } from "react";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { useCountdown } from "@/hooks/useCountdown";
import { WEDDING } from "@/lib/constants";

export function CountdownSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { days, hours, minutes, seconds, isExpired } = useCountdown(
    WEDDING.date
  );

  useEffect(() => {
    registerGSAP();
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll(".countdown-card"),
      { opacity: 0, scale: 0.8 },
      {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        stagger: 0.1,
        ease: "back.out(1.7)",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const units = [
    { value: days, label: "Dias" },
    { value: hours, label: "Horas" },
    { value: minutes, label: "Minutos" },
    { value: seconds, label: "Segundos" },
  ];

  if (isExpired) {
    return (
      <section id="contagem" className="py-20 md:py-32 px-4 text-center">
        <h2 className="font-serif text-3xl md:text-4xl gradient-text">
          Hoje é o grande dia!
        </h2>
      </section>
    );
  }

  return (
    <section id="contagem" ref={sectionRef} className="py-20 md:py-32 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl gradient-text mb-4">
          Contagem Regressiva
        </h2>
        <div className="section-divider mb-12" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {units.map(({ value, label }) => (
            <div
              key={label}
              className="countdown-card glass-card p-6 md:p-8 text-center"
            >
              <span className="block font-serif text-4xl md:text-5xl text-rose-gold tabular-nums">
                {String(value).padStart(2, "0")}
              </span>
              <span className="block mt-2 text-xs uppercase tracking-[0.2em] text-warm-gray">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
