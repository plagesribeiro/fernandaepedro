"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { MapPin, Clock, Music, UtensilsCrossed, Church } from "lucide-react";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { useCountdown } from "@/hooks/useCountdown";
import { WEDDING } from "@/lib/constants";

const SCHEDULE_ICONS: Record<string, React.ReactNode> = {
  "Cerimônia": <Church className="w-5 h-5" />,
  "Recepção": <UtensilsCrossed className="w-5 h-5" />,
  "Festa": <Music className="w-5 h-5" />,
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
      className="py-16 md:py-24 px-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 ceremony-animate">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/hero/chrysanthemum-single.png"
              alt=""
              width={50}
              height={50}
              className="opacity-70"
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
            <div className="rounded-xl overflow-hidden border border-rose-gold/10">
              <iframe
                title="Localização da cerimônia"
                src={`https://maps.google.com/maps?q=${mapsQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="w-full h-52 md:h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <div className="glass-card rounded-t-none border-t-0 px-4 py-3 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-gold mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {WEDDING.venue.name}
                  </p>
                  <p className="text-xs text-warm-gray">
                    {WEDDING.venue.address} — {WEDDING.venue.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Countdown + Schedule timeline */}
          <div className="space-y-5 order-1 md:order-2">
            <div className="ceremony-animate">
              <CompactCountdown />
            </div>

            <div className="ceremony-animate">
              <div className="relative">
                {WEDDING.schedule.map((item, i) => (
                  <div key={item.time} className="relative flex gap-4">
                    {/* Timeline line */}
                    {i < WEDDING.schedule.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-0 w-px bg-rose-gold/20" />
                    )}

                    {/* Icon circle */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-rose-gold/10 border border-rose-gold/20 flex items-center justify-center text-rose-gold z-10">
                      {SCHEDULE_ICONS[item.event] ?? <Clock className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className={i < WEDDING.schedule.length - 1 ? "pb-6" : ""}>
                      <span className="text-rose-gold font-serif text-lg">
                        {item.time}
                      </span>
                      <h3 className="font-serif text-lg text-ivory mt-0.5">
                        {item.event}
                      </h3>
                      <p className="text-warm-gray text-sm leading-relaxed mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
