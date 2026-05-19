"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GiftCard } from "@/components/ui/GiftCard";
import { DonationCard } from "@/components/ui/DonationCard";
import type { Gift } from "@/types";

export function GiftRegistrySection() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch("/api/gifts", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setGifts(data.gifts);
      }
    } catch (err) {
      console.error("Failed to fetch gifts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGifts();
  }, [fetchGifts]);

  useEffect(() => {
    registerGSAP();
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelector(".gifts-grid"),
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  return (
    <section
      id="presentes"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 bg-blush/30"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          title="Lista de Presentes"
          subtitle="Adicione ao carrinho o que quiser nos dar — pode escolher mais de um e finalizar de uma vez só."
        />

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-rose-gold/30 border-t-rose-gold rounded-full animate-spin mx-auto" />
            <p className="text-warm-gray mt-4">Carregando presentes...</p>
          </div>
        ) : (
          <div className="gifts-grid grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            <AnimatePresence mode="popLayout">
              <DonationCard key="donation" />
              {gifts.map((gift) => (
                <GiftCard key={gift.name} gift={gift} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
