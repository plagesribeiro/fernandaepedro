"use client";

import { useEffect, useRef } from "react";
import { registerGSAP, gsap } from "@/lib/gsap-config";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RsvpWizard } from "@/components/rsvp/RsvpWizard";

export function RsvpSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    registerGSAP();
    if (!sectionRef.current) return;

    gsap.fromTo(
      sectionRef.current.querySelector(".rsvp-form"),
      { opacity: 0, y: 40 },
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
      id="presenca"
      ref={sectionRef}
      className="py-20 md:py-32 px-4 bg-ivory"
    >
      <div className="max-w-xl mx-auto">
        <SectionHeading
          title="Confirme sua Presença"
          subtitle="Ficaremos muito felizes em celebrar com você!"
        />
        <RsvpWizard />
      </div>
    </section>
  );
}
