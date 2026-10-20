"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import { THEMES, MOTION_PRESETS, type ThemeId, type ThemeIdentity } from "@shared/config/themes";

interface ThemeContextValue {
  theme: ThemeIdentity;
  motion: (typeof MOTION_PRESETS)[ThemeIdentity["motion"]];
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Drives the adaptive theme system. Setting a theme only flips a `data-theme`
 * attribute on <html> — every color flows from CSS variables, so the re-tune is
 * a single attribute write, not a re-render of styled values.
 */
export function ThemeProvider({
  initial = "founder",
  children,
}: {
  initial?: ThemeId;
  children: React.ReactNode;
}) {
  const [id, setId] = useState<ThemeId>(initial);

  const setTheme = useCallback((next: ThemeId) => {
    setId(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = THEMES[id];
    return { theme, motion: MOTION_PRESETS[theme.motion], setTheme };
  }, [id, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}
