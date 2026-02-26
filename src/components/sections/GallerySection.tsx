"use client";

import { useState } from "react";
import { WEDDING } from "@/lib/constants";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PhotoCard } from "@/components/ui/PhotoCard";
import { Lightbox } from "@/components/ui/Lightbox";

export function GallerySection() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = WEDDING.gallery;

  function openLightbox(index: number) {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }

  function goNext() {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }

  function goPrev() {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }

  return (
    <section id="galeria" className="py-20 md:py-32 px-4 bg-ivory">
      <div className="max-w-5xl mx-auto">
        <SectionHeading
          title="Galeria"
          subtitle="Momentos que guardaremos para sempre"
        />

        <div className="masonry-grid">
          {images.map((src, index) => (
            <PhotoCard
              key={index}
              src={src}
              alt={`Foto ${index + 1} de Fernanda e Pedro`}
              index={index}
              onClick={() => openLightbox(index)}
            />
          ))}
        </div>
      </div>

      <Lightbox
        images={images}
        currentIndex={currentIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={goPrev}
        onNext={goNext}
      />
    </section>
  );
}
