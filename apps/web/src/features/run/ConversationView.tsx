"use client";

import { motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { cn } from "@shared/lib/utils";
import type { DebateEntry, RunTake, Stance } from "./run";

/**
 * ConversationView — the company's thinking, made legible.
 * Four phases, in the order they actually happen:
 *   ① Plan      — the COO's activation decision and why.
 *   ② Takes     — each activated department's initial position.
 *   ③ Debate    — departments challenging each other. Challenge/concern are
 *                 visually loud (pink/amber + "AR → QA" arrows); support is calm.
 *   ④ Decision  — the CEO's ruling, which acknowledges the debate.
 * Works live (messages arrive as the run streams) and as a replay of a saved
 * run. Motion is minimal: each message fades/slides in once.
 */
export interface ConversationData {
  plan?: { activated: string[]; skipped: string[]; rationale: string } | null;
  takes: RunTake[];
  debate: DebateEntry[];
  answer?: string | null;
  costUsd?: number;
  /** Streaming flags (live mode only). */
  live?: boolean;
  synthesizing?: boolean;
}

const STANCE_STYLE: Record<Stance, { badge: string; border: string; label: string }> = {
  support: {
    badge: "text-accent2 border-accent2/40 bg-accent2/10",
    border: "border-white/[0.07]",
    label: "supports",
  },
  challenge: {
    badge: "text-pink-300 border-pink-400/40 bg-pink-500/10",
    border: "border-pink-400/25",
    label: "challenges",
  },
  concern: {
    badge: "text-amber-300 border-amber-300/40 bg-amber-400/10",
    border: "border-amber-300/25",
    label: "concern",
  },
};

const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

export function ConversationView({ data }: { data: ConversationData }) {
  const { plan, takes, debate, answer, costUsd, live, synthesizing } = data;
  const hasAnything = plan || takes.length > 0 || debate.length > 0 || answer;
  if (!hasAnything) {
    return (
      <p className="py-3 font-mono text-[11px] text-ink3">
        No transcript saved for this run — only the decision below survived.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {/* ① Plan */}
      {plan && (
        <section aria-label="Phase 1: plan">
          <PhaseLabel n="①" title="plan" />
          <motion.div {...enter}>
            <Surface className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <AgentChip abbr="COO" />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink3">
                  activation
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-ink2">{plan.rationale}</p>
              {plan.skipped.length > 0 && (
                <p className="mt-1.5 font-mono text-[10px] text-ink4">
                  standby: {plan.skipped.join(", ")}
                </p>
              )}
            </Surface>
          </motion.div>
        </section>
      )}

      {/* ② Department takes */}
      {takes.length > 0 && (
        <section aria-label="Phase 2: department takes">
          <PhaseLabel n="②" title="department takes" />
          <div className="space-y-2">
            {takes.map((t) => (
              <motion.div key={t.abbr} {...enter}>
                <Surface className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <AgentChip abbr={t.abbr} />
                    <span className="text-[12.5px] text-ink">{t.role}</span>
                    <span className="ml-auto font-mono text-[10px] text-ink3">
                      {t.modelId} · ${t.costUsd.toFixed(4)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-ink2">
                    {t.preview}
                    {t.preview.length >= 220 ? "…" : ""}
                  </p>
                </Surface>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ③ Debate */}
      {(debate.length > 0 || (live && takes.length > 1 && !synthesizing && !answer)) && (
        <section aria-label="Phase 3: debate">
          <PhaseLabel n="③" title="debate" />
          {debate.length === 0 ? (
            <p className="font-mono text-[11px] text-ink3" aria-live="polite">
              departments reviewing each other&rsquo;s work…
            </p>
          ) : (
            <div className="space-y-2">
              {debate.map((d, i) => {
                const style = STANCE_STYLE[d.stance];
                return (
                  <motion.div key={`${d.from}-${d.to}-${i}`} {...enter}>
                    <Surface className={cn("px-4 py-3", style.border)}>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <AgentChip abbr={d.from} />
                        <span className="font-mono text-[11px] text-ink3">
                          {d.from} <span className="text-ink4">→</span> {d.to}
                        </span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]",
                            style.badge,
                          )}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-ink2">{d.text}</p>
                    </Surface>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ④ Decision */}
      {(answer || synthesizing) && (
        <section aria-label="Phase 4: decision">
          <PhaseLabel n="④" title="decision" />
          {answer ? (
            <motion.div {...enter}>
              <Surface elevation="raised" className="border-accent2/30 px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <AgentChip abbr="CEO" />
                  <span className="text-[12.5px] text-ink">Chief Executive</span>
                  {typeof costUsd === "number" && (
                    <span className="ml-auto font-mono text-[10px] text-ink3">
                      run total ${costUsd.toFixed(4)}
                    </span>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink">
                  {answer}
                </p>
              </Surface>
            </motion.div>
          ) : (
            <p className="font-mono text-[11px] text-ink3" aria-live="polite">
              ceo weighing the debate…
            </p>
          )}
        </section>
      )}
    </div>
  );
}

function PhaseLabel({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
      <span className="text-accent2">{n}</span> {title}
    </div>
  );
}

function AgentChip({ abbr }: { abbr: string }) {
  return (
    <span
      className="grid h-6 w-6 shrink-0 place-items-center rounded-sm bg-gradient-to-br from-accent to-accent2 font-mono text-[10px] font-bold text-accent-ink"
      aria-hidden
    >
      {abbr}
    </span>
  );
}
