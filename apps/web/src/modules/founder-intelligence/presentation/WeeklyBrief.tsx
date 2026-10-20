"use client";

import { motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { rise } from "@shared/motion/variants";
import type { WeeklyBrief as Brief } from "../domain/types";

const SAMPLE: Brief = {
  weekOf: "Mon, Jun 29",
  progress: ["Atlas onboarding flow shipped", "Ledger billing module reused twice"],
  risks: ["Vitals depends on a library flagged for deprecation"],
  opportunities: ["You keep rebuilding dashboards — a reusable module would save ~6h/project"],
  modelUpdates: ["A cheaper balanced-tier model now clears your design tasks"],
  costSuggestions: ["Route research drafts to fast tier → est. 18% monthly saving"],
};

const SECTIONS: { key: keyof Omit<Brief, "weekOf">; label: string; tone: string }[] = [
  { key: "progress", label: "Progress", tone: "text-accent2" },
  { key: "risks", label: "Risks", tone: "text-ink" },
  { key: "opportunities", label: "Opportunities", tone: "text-accent2" },
  { key: "modelUpdates", label: "Model updates", tone: "text-ink2" },
  { key: "costSuggestions", label: "Cost", tone: "text-ink2" },
];

/** Founder Intelligence · Weekly Executive Brief — the calm Monday read. */
export function WeeklyBrief({ brief = SAMPLE }: { brief?: Brief }) {
  return (
    <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}>
      <Surface className="p-card">
        <div className="flex items-baseline justify-between">
          <h3 className="font-serif text-xl">Weekly Executive Brief</h3>
          <span className="font-mono text-[11px] text-ink3">{brief.weekOf}</span>
        </div>
        <div className="mt-4 grid gap-3">
          {SECTIONS.map((s) => (
            <div key={s.key} className="border-t border-white/[0.07] pt-3">
              <div className={`font-mono text-[10px] uppercase tracking-[0.18em] ${s.tone}`}>{s.label}</div>
              <ul className="mt-1.5 space-y-1">
                {brief[s.key].map((line, i) => (
                  <li key={i} className="text-[13px] text-ink2">{line}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Surface>
    </motion.div>
  );
}
