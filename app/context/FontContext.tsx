"use client"

import React, { createContext, useContext, useEffect, useState } from "react";

type Font = "jetbrains" | "atkinson";

interface FontContextType {
  font: Font;
  setFont: (font: Font) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFont] = useState<Font>("jetbrains");

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedFont = localStorage.getItem("font") as Font | null;
    if (storedFont === "jetbrains" || storedFont === "atkinson") {
      setFont(storedFont);
    }
  }, []);

  // Apply font class and persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (font === "atkinson") {
      document.documentElement.classList.add("font-atkinson");
    } else {
      document.documentElement.classList.remove("font-atkinson");
    }
    localStorage.setItem("font", font);
  }, [font]);

  return (
    <FontContext.Provider value={{ font, setFont }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
} 