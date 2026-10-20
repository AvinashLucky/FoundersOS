"use client";

import { motion } from "framer-motion";
import { rise } from "@shared/motion/variants";
import { Surface } from "@shared/ui/Surface";

interface AnswerMeta {
  label: string;
  value: string;
}

/**
 * The single executive answer — the company's voice (serif). One synthesized
 * result; the reasoning, cost, and reversibility are the legible meta below it
 * (Principles P6, P8). Never a wall of competing fragments.
 */
export function ExecutiveAnswer({
  children,
  meta,
}: {
  children: React.ReactNode;
  meta: AnswerMeta[];
}) {
  return (
    <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}>
      <Surface className="bg-gradient-to-b from-white/[0.06] to-transparent p-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent2">
          CEO · the single voice
        </div>
        <p className="mt-3 font-serif text-lg font-light leading-relaxed text-ink">{children}</p>
        <div className="mt-4 flex flex-wrap gap-4 font-mono text-[10.5px] text-ink3">
          {meta.map((m) => (
            <span key={m.label}>
              <b className="font-medium text-ink2">{m.value}</b> {m.label}
            </span>
          ))}
        </div>
      </Surface>
    </motion.div>
  );
}
