"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Music, UtensilsCrossed, Heart, GlassWater } from "lucide-react";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { useCountdown } from "@/hooks/useCountdown";
import { WEDDING } from "@/lib/constants";

const HIGHLIGHT_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className="w-4 h-4" />,
  utensils: <UtensilsCrossed className="w-4 h-4" />,
  glass: <GlassWater className="w-4 h-4" />,
  music: <Music className="w-4 h-4" />,
};

function CompactCountdown() {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(
    WEDDING.date
  );

  if (isExpired) {
    return (
      <div className="text-center py-4">
        <p className="font-serif text-xl gradient-text">
          Hoje é o grande dia!
        </p>
      </div>
    );
  }

  const units = [
    { value: days, label: "Dias" },
    { value: hours, label: "Horas" },
    { value: minutes, label: "Min" },
    { value: seconds, label: "Seg" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map(({ value, label }) => (
        <div
          key={label}
          className="countdown-card glass-card px-2 py-2 text-center"
        >
          <span className="block font-serif text-lg md:text-xl text-rose-gold tabular-nums">
            {String(value).padStart(2, "0")}
          </span>
          <span className="block mt-0.5 text-[9px] uppercase tracking-[0.15em] text-warm-gray">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CeremonySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGSAP();
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelectorAll(".ceremony-animate"),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  const mapsQuery = encodeURIComponent(WEDDING.venue.fullAddress);

  return (
    <section
      id="cerimonia"
      ref={sectionRef}
      className="pt-6 pb-16 md:pt-8 md:pb-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 ceremony-animate">
          <div className="flex justify-center mb-4 bg-ivory">
            <Image
              src="/images/ozzy.png"
              alt="Ozzy, o gatinho da Fernanda e do Pedro"
              width={180}
              height={180}
              className="mix-blend-multiply"
            />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl gradient-text mb-2">
            O Grande Dia
          </h2>
          <p className="text-warm-gray text-sm">{WEDDING.dateDisplay}</p>
          <div className="section-divider mt-4" />
        </div>

        {/* Two-column layout */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Left: Map + location */}
          <div className="ceremony-animate order-2 md:order-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl overflow-hidden border border-rose-gold/10 group"
            >
              <Image
                src="/images/Screenshot%202026-05-17%20at%2021.34.33.png"
                alt="Mapa do local da cerimônia"
                width={1200}
                height={800}
                className="w-full h-52 md:h-72 object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="glass-card rounded-t-none border-t-0 px-4 py-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-charcoal group-hover:text-rose-gold transition-colors">
                    {WEDDING.venue.name}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {WEDDING.venue.address} — {WEDDING.venue.city}
                  </p>
                </div>
              </div>
            </a>
          </div>

          {/* Right: Countdown + Schedule timeline */}
          <div className="space-y-5 order-1 md:order-2">
            <div className="ceremony-animate">
              <CompactCountdown />
            </div>

            <div className="ceremony-animate">
              <div className="glass-card rounded-xl px-5 py-5 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span className="font-serif text-3xl md:text-4xl gradient-text">
                    {WEDDING.celebration.start}
                  </span>
                  <span className="text-rose-gold/50 text-2xl">—</span>
                  <span className="font-serif text-3xl md:text-4xl gradient-text">
                    {WEDDING.celebration.end}
                  </span>
                </div>
                <p className="text-warm-gray text-xs mt-2 italic">
                  {WEDDING.celebration.tagline}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <span className="h-px w-8 bg-rose-gold/25" />
                  <span className="text-[10px] uppercase tracking-[0.25em] text-rose-gold/80">
                    O que te espera
                  </span>
                  <span className="h-px w-8 bg-rose-gold/25" />
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-2 text-left">
                  {WEDDING.celebration.highlights.map((h) => (
                    <li
                      key={h.label}
                      className="flex items-center gap-2 rounded-lg border border-rose-gold/10 bg-rose-gold/5 px-3 py-2"
                    >
                      <span className="text-rose-gold shrink-0">
                        {HIGHLIGHT_ICONS[h.icon]}
                      </span>
                      <span className="text-xs text-charcoal leading-tight">
                        {h.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
