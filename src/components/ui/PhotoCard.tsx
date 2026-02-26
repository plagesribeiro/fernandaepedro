"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PhotoCardProps {
  src: string;
  alt: string;
  index: number;
  onClick: () => void;
}

export function PhotoCard({ src, alt, index, onClick }: PhotoCardProps) {
  // Vary heights for masonry look
  const heights = ["h-48", "h-64", "h-56", "h-72", "h-52", "h-60"];
  const height = heights[index % heights.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="masonry-item cursor-pointer group"
      onClick={onClick}
    >
      <div
        className={cn(
          "relative rounded-xl overflow-hidden",
          "bg-gradient-to-br from-blush to-champagne",
          "transition-all duration-500 group-hover:shadow-xl",
          height
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm">
            Ver foto
          </span>
        </div>
      </div>
    </motion.div>
  );
}
