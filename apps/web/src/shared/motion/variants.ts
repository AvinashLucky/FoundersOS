import type { Variants, Transition } from "framer-motion";

/**
 * Strata motion language. Motion is *meaning* — it shows the company working.
 * Durations/springs derive from the active theme's motion character so a FinTech
 * project feels precise while a Healthcare project feels gentle, from the same code.
 */
export const STRATA_EASE: number[] = [0.22, 1, 0.36, 1];

export const spring = (stiffness = 220, damping = 30): Transition => ({
  type: "spring",
  stiffness,
  damping,
  mass: 0.9,
});

/** Progressive reveal — the default entrance for any focal element. */
export const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: STRATA_EASE } },
};

/** Stagger container — agents/cards converge rather than pop. */
export const chorus: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

export const chorusItem: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring(240, 26) },
};

/** Shared-layout panel — context arrives, it does not "navigate". */
export const panel: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: STRATA_EASE } },
  exit: { opacity: 0, x: 24, transition: { duration: 0.3, ease: STRATA_EASE } },
};
