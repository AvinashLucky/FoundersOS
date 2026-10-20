"use client";

import { useTheme } from "@shared/providers/ThemeProvider";
import { THEME_LIST } from "@shared/config/themes";
import { cn } from "@shared/lib/utils";

/**
 * Adaptive theme switcher. Picking a project re-tunes the entire surface live —
 * one attribute write, every color flows from CSS variables (Principle P7).
 */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project identity">
      {THEME_LIST.map((t) => {
        const active = t.id === theme.id;
        return (
          <button
            key={t.id}
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-md border px-3.5 py-2 font-mono text-[11.5px] transition-all duration-300 ease-strata",
              active
                ? "border-transparent bg-gradient-to-br from-accent to-accent2 font-semibold text-accent-ink"
                : "border-white/[0.13] text-ink2 hover:border-ink3 hover:text-ink",
            )}
          >
            <span className="h-2.5 w-2.5 rounded-[4px]" style={{ background: t.swatch.accent }} />
            {t.domain}
          </button>
        );
      })}
    </div>
  );
}
