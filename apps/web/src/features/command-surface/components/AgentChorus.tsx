"use client";

import { motion } from "framer-motion";
import { chorus, chorusItem } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";

interface AgentCell {
  abbr: string;
  name: string;
  role: string;
  done?: boolean;
  /** On standby — the COO decided this department isn't needed for this run. */
  idle?: boolean;
}

/**
 * Agent collaboration animation. Agents *converge* (staggered spring) rather than
 * pop — motion-as-meaning (Principle P4): you feel the company assembling.
 */
export function AgentChorus({ agents }: { agents: AgentCell[] }) {
  return (
    <motion.div
      variants={chorus}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.5 }}
      className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
      role="status"
      aria-label="The company is working: product, architecture, design, QA and security"
    >
      {agents.map((a) => (
        <motion.div
          key={a.abbr}
          variants={chorusItem}
          className={cn(
            "rounded-md border border-white/[0.07] bg-white/[0.04] p-3.5 transition-opacity duration-500",
            a.idle && "opacity-40 saturate-0",
          )}
        >
          <div
            className={cn(
              "grid h-7 w-7 place-items-center rounded-sm font-mono text-[13px] font-bold",
              a.idle
                ? "bg-white/[0.08] text-ink3"
                : "bg-gradient-to-br from-accent to-accent2 text-accent-ink",
            )}
          >
            {a.abbr}
          </div>
          <div className="mt-2.5 text-[12.5px] text-ink">{a.name}</div>
          <div className="mt-0.5 font-mono text-[9.5px] text-ink3">{a.role}</div>
          <div
            className={cn(
              "mt-2 font-mono text-[9.5px] transition-opacity duration-500",
              a.idle ? "text-ink3 opacity-100" : a.done ? "text-accent2 opacity-100" : "opacity-0",
            )}
          >
            {a.idle ? "◦ standby" : "✓ done"}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
