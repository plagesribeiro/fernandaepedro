"use client";

import { cn } from "@/lib/utils";
import { GIFT_CATEGORIES } from "@/lib/constants";

interface CategoryTabsProps {
  active: string;
  onChange: (category: string) => void;
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-8">
      {GIFT_CATEGORIES.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
            "hover:scale-[1.02] active:scale-[0.98]",
            active === category
              ? "bg-rose-gold text-white shadow-sm"
              : "bg-champagne text-charcoal/70 hover:bg-rose-gold/10 hover:text-rose-gold border border-rose-gold/15"
          )}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
