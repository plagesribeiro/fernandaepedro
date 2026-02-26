"use client";

import { cn } from "@/lib/utils";
import { GIFT_CATEGORIES } from "@/lib/constants";
import { useSoundEffect } from "@/hooks/useSoundEffect";

interface CategoryTabsProps {
  active: string;
  onChange: (category: string) => void;
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const { play } = useSoundEffect();

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {GIFT_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => {
            play("click");
            onChange(category);
          }}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            "hover:scale-105 active:scale-95",
            active === category
              ? "bg-rose-gold text-white shadow-md"
              : "bg-champagne text-warm-gray hover:bg-rose-gold/10 border border-rose-gold/20"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
