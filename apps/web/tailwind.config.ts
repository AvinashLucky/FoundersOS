import type { Config } from "tailwindcss";

/**
 * Strata design tokens, mapped to CSS variables.
 * The substrate (void/base/raised/ink) is constant across every project theme;
 * the accent spectrum is overridden per `data-theme` in globals.css.
 * Components only ever reference these semantic tokens — never raw hex.
 */
const config: Config = {
  darkMode: ["class", '[data-mode="dark"]'],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: "rgb(var(--void) / <alpha-value>)",
        base: "rgb(var(--base) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        raised2: "rgb(var(--raised2) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        ink2: "rgb(var(--ink2) / <alpha-value>)",
        ink3: "rgb(var(--ink3) / <alpha-value>)",
        ink4: "rgb(var(--ink4) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        accent2: "rgb(var(--accent2) / <alpha-value>)",
        "accent-ink": "rgb(var(--accent-ink) / <alpha-value>)",
        hair: "rgb(var(--hair-rgb) / <alpha-value>)",
      },
      fontFamily: {
        // Three voices: company (serif) · system (sans) · machine (mono)
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "20px", "2xl": "24px",
      },
      spacing: {
        // 8pt rhythm with a 4pt hairline step
        hair: "4px", base: "8px", comp: "16px", card: "24px", sec: "84px",
      },
      transitionTimingFunction: {
        strata: "cubic-bezier(.22,1,.36,1)",
        "strata-in": "cubic-bezier(.16,1,.3,1)",
      },
      keyframes: {
        pulse2: { "0%,100%": { opacity: "1" }, "50%": { opacity: ".3" } },
        rise: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: {
        pulse2: "pulse2 1.6s ease-in-out infinite",
        rise: "rise .6s cubic-bezier(.22,1,.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
