"use client";

import { Navigation } from "@/components/layout/Navigation";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { CeremonySection } from "@/components/sections/CeremonySection";
import { RsvpSection } from "@/components/sections/RsvpSection";
import { GiftRegistrySection } from "@/components/sections/GiftRegistrySection";
import { GallerySection } from "@/components/sections/GallerySection";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { CursorSparkle } from "@/components/effects/CursorSparkle";
import { EasterEggs } from "@/components/effects/EasterEggs";

export default function HomePage() {
  return (
    <>
      <Navigation />
      <CursorSparkle />
      <EasterEggs />

      <main>
        <HeroSection />
        <SectionDivider />
        <CeremonySection />
        <SectionDivider />
        <RsvpSection />
        <SectionDivider />
        <GiftRegistrySection />
        <SectionDivider />
        <GallerySection />
      </main>

      <Footer />
    </>
  );
}
