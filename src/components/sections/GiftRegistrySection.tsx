"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CategoryTabs } from "@/components/ui/CategoryTabs";
import { GiftCard } from "@/components/ui/GiftCard";
import { GiftReserveModal } from "@/components/ui/GiftReserveModal";
import { DonationCard } from "@/components/ui/DonationCard";
import { DonationModal } from "@/components/ui/DonationModal";
import type { Gift } from "@/types";

export function GiftRegistrySection() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [category, setCategory] = useState("Todos");
  const [selectedGift, setSelectedGift] = useState<Gift | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);

  const fetchGifts = useCallback(async () => {
    try {
      const res = await fetch("/api/gifts");
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

  const normalizeCategory = (cat: string | null) => {
    if (!cat) return "";
    // Normalize: "Eletronicos" -> "Eletrônicos", "Experiencias" -> "Experiências"
    const map: Record<string, string> = {
      Eletronicos: "Eletrônicos",
      Experiencias: "Experiências",
    };
    return map[cat] || cat;
  };

  const filteredGifts =
    category === "Todos"
      ? gifts
      : gifts.filter(
          (g) => normalizeCategory(g.category) === category
        );

  function handleReserveSuccess() {
    // Optimistic update
    if (selectedGift) {
      setGifts((prev) =>
        prev.map((g) =>
          g.id === selectedGift.id
            ? {
                ...g,
                reservedQuantity: g.reservedQuantity + 1,
                availableQuantity: g.availableQuantity - 1,
              }
            : g
        )
      );
    }
    // Also refetch to get real data
    fetchGifts();
  }

  return (
    <section
      id="presentes"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 bg-blush/30"
    >
      <div className="max-w-6xl mx-auto">
        <SectionHeading
          title="Lista de Presentes"
          subtitle="Sua presença é o melhor presente, mas se desejar nos presentear..."
        />

        <CategoryTabs active={category} onChange={setCategory} />

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-rose-gold/30 border-t-rose-gold rounded-full animate-spin mx-auto" />
            <p className="text-warm-gray mt-4">Carregando presentes...</p>
          </div>
        ) : (
          <div className="gifts-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {(category === "Todos" || category === "Experiências") && (
                <DonationCard
                  key="donation"
                  onDonate={() => setDonationOpen(true)}
                />
              )}
              {filteredGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  onReserve={setSelectedGift}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {!loading && filteredGifts.length === 0 && category !== "Todos" && category !== "Experiências" && (
          <p className="text-center text-warm-gray py-12">
            Nenhum presente encontrado nesta categoria.
          </p>
        )}
      </div>

      <GiftReserveModal
        gift={selectedGift}
        onClose={() => setSelectedGift(null)}
        onSuccess={handleReserveSuccess}
      />

      <DonationModal
        open={donationOpen}
        onClose={() => setDonationOpen(false)}
      />
    </section>
  );
}
