"use client";

import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECTIONS } from "@/lib/constants";
import { useScrollSection } from "@/hooks/useScrollSection";
import { MobileMenu } from "./MobileMenu";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeSection = useScrollSection();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 50);
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled ? "glass shadow-md py-3" : "bg-transparent py-5"
        )}
      >
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a
            href="#inicio"
            className={cn(
              "font-serif text-2xl transition-colors duration-300",
              scrolled ? "text-rose-gold" : "text-white"
            )}
          >
            F & P
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  "px-3 py-2 rounded-full text-sm font-medium transition-all duration-300",
                  activeSection === id
                    ? scrolled
                      ? "bg-rose-gold/10 text-rose-gold"
                      : "bg-white/20 text-white"
                    : scrolled
                      ? "text-charcoal hover:text-rose-gold hover:bg-rose-gold/5"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(true)}
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              scrolled
                ? "text-charcoal hover:bg-rose-gold/10"
                : "text-white hover:bg-white/10"
            )}
            aria-label="Abrir menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <MobileMenu
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeSection={activeSection}
      />
    </>
  );
}
