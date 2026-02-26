"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { WEDDING } from "@/lib/constants";
import { ParticleField } from "@/components/ui/ParticleField";

export function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGSAP();
    if (!contentRef.current) return;

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(
      ".hero-subtitle",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8 }
    )
      .fromTo(
        ".hero-name",
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.2, stagger: 0.3 },
        "-=0.4"
      )
      .fromTo(
        ".hero-ampersand",
        { opacity: 0, scale: 0.5 },
        { opacity: 1, scale: 1, duration: 0.8 },
        "-=0.8"
      )
      .fromTo(
        ".hero-info",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        "-=0.3"
      )
      .fromTo(
        ".hero-button",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.2"
      );
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero/chrysanthemum-hero.jpg"
          alt=""
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory/80 via-ivory/60 to-ivory" />

      {/* Particle field */}
      <div className="absolute inset-0">
        <ParticleField />
      </div>

      {/* Content */}
      <div ref={contentRef} className="relative z-10 text-center px-4">
        <p className="hero-subtitle text-rose-gold text-xs md:text-sm uppercase tracking-[0.3em] mb-8">
          Celebrem conosco
        </p>

        <div className="mb-6">
          <h1 className="hero-name font-serif text-6xl md:text-8xl lg:text-9xl font-light glow-text text-charcoal leading-tight">
            {WEDDING.bride}
          </h1>

          <div className="hero-ampersand flex items-center justify-center gap-4 my-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-rose-gold" />
            <span className="gradient-text font-serif italic text-3xl md:text-4xl">
              &
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-rose-gold" />
          </div>

          <h1 className="hero-name font-serif text-6xl md:text-8xl lg:text-9xl font-light glow-text text-charcoal leading-tight">
            {WEDDING.groom}
          </h1>
        </div>

        <div className="hero-info mt-8 space-y-2">
          <p className="text-warm-gray tracking-[0.2em] text-sm md:text-base uppercase">
            {WEDDING.dateDisplay}
          </p>
          <p className="text-warm-gray/70 tracking-[0.15em] text-xs md:text-sm">
            {WEDDING.venue.name} · {WEDDING.venue.city}
          </p>
        </div>

        <a
          href="#cerimonia"
          className="hero-button inline-block mt-10 px-8 py-3 border border-rose-gold/40 text-rose-gold uppercase tracking-[0.2em] text-xs md:text-sm hover:bg-rose-gold/10 transition-colors rounded-sm"
        >
          Detalhes
        </a>
      </div>
    </section>
  );
}
