/**
 * Adaptive Theme System
 * ---------------------
 * A project's domain selects an identity. The substrate (dark base, spacing, type)
 * is constant; only the accent spectrum and the *motion character* change.
 * This is what lets one component library express FinTech vs Healthcare vs Creative
 * without ever forking the design system.
 */
export type ThemeId =
  | "founder" | "fintech" | "health" | "creative" | "media" | "commerce" | "developer";

/** Motion character tunes durations/spring feel per identity (consumed by motion/variants). */
export type MotionCharacter = "measured" | "precise" | "gentle" | "vivid" | "editorial" | "brisk" | "crisp";

export interface ThemeIdentity {
  id: ThemeId;
  name: string;
  domain: string;
  /** Short personality descriptor surfaced in the UI. */
  character: string;
  motion: MotionCharacter;
  /** Display swatches (hex only used for previews; runtime color comes from CSS vars). */
  swatch: { accent: string; accent2: string };
}

export const THEMES: Record<ThemeId, ThemeIdentity> = {
  founder:   { id: "founder",   name: "Home Workspace",     domain: "FounderOS",          character: "Calm, executive, neutral",      motion: "measured",  swatch: { accent: "#7C6CF7", accent2: "#34E5FF" } },
  fintech:   { id: "fintech",   name: "Ledger",             domain: "FinTech",            character: "Precise, trustworthy, dense",   motion: "precise",   swatch: { accent: "#1FB58F", accent2: "#3DD6C4" } },
  health:    { id: "health",    name: "Vitals",             domain: "Healthcare",         character: "Gentle, reassuring, airy",      motion: "gentle",    swatch: { accent: "#2BA8E0", accent2: "#6FE0D0" } },
  creative:  { id: "creative",  name: "Prism",              domain: "Creative AI",        character: "Expressive, bold, generative",  motion: "vivid",     swatch: { accent: "#9D5CF6", accent2: "#FF6EC7" } },
  media:     { id: "media",     name: "Signal",             domain: "Media & Publishing", character: "Warm, editorial, confident",    motion: "editorial", swatch: { accent: "#F5A524", accent2: "#FF6B6B" } },
  commerce:  { id: "commerce",  name: "Cart",               domain: "E-commerce",         character: "Energetic, conversion-minded",  motion: "brisk",     swatch: { accent: "#FF7A1A", accent2: "#FF4D8D" } },
  developer: { id: "developer", name: "Forge",              domain: "Developer Platform", character: "Technical, electric, exact",    motion: "crisp",     swatch: { accent: "#18D2E0", accent2: "#9EF01A" } },
};

export const THEME_LIST = Object.values(THEMES);

/** Spring/duration presets keyed by motion character. Consumed by Framer variants. */
export const MOTION_PRESETS: Record<MotionCharacter, { stiffness: number; damping: number; duration: number }> = {
  measured:  { stiffness: 220, damping: 30, duration: 0.5 },
  precise:   { stiffness: 320, damping: 34, duration: 0.36 },
  gentle:    { stiffness: 160, damping: 26, duration: 0.62 },
  vivid:     { stiffness: 260, damping: 18, duration: 0.46 },
  editorial: { stiffness: 200, damping: 28, duration: 0.54 },
  brisk:     { stiffness: 360, damping: 30, duration: 0.3 },
  crisp:     { stiffness: 340, damping: 36, duration: 0.32 },
};
