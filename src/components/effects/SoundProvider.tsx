"use client";

import { createContext, useState, type ReactNode } from "react";

interface SoundContextType {
  enabled: boolean;
  toggle: () => void;
}

export const SoundContext = createContext<SoundContextType>({
  enabled: false,
  toggle: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const toggle = () => setEnabled((prev) => !prev);

  return (
    <SoundContext.Provider value={{ enabled, toggle }}>
      {children}
    </SoundContext.Provider>
  );
}
