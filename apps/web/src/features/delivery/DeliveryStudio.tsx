"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Surface } from "@shared/ui/Surface";
import { Button } from "@shared/ui/Button";
import { useToast } from "@shared/ui/Toaster";
import { rise, chorus, chorusItem } from "@shared/motion/variants";
import { cn } from "@shared/lib/utils";
import {
  useBlueprintStream,
  blueprintToMarkdown,
  type SolutionBlueprint,
} from "./useBlueprintStream";

/**
 * Delivery Studio — where a client sentence becomes a sellable deliverable.
 * Paste what the client asked for → the company designs the agentic loop, the
 * ML/GenAI systems, the stack (with honest monthly costs), milestones, risks,
 * and pricing bands for service vs product — plus a proof-post draft for the
 * daily posting habit. Copy as Markdown and send it.
 */
const EXAMPLES = [
  "A dental clinic wants missed calls turned into booked appointments automatically",
  "An e-commerce brand needs product descriptions and SEO written from a spreadsheet",
  "A recruiter wants resumes ranked against a job description with reasons",
  "A SaaS founder wants weekly churn-risk alerts from support tickets",
];

const PHASE_LABEL: Record<string, string> = {
  understanding: "reading the requirement…",
  designing: "designing the agentic loop…",
  pricing: "costing the stack and pricing the work…",
};

export function DeliveryStudio({ projectId }: { projectId?: string }) {
  const [requirement, setRequirement] = useState("");
  const bp = useBlueprintStream(projectId);
  const { toast } = useToast();
  const valid = requirement.trim().length >= 10;

  async function submit() {
    if (!valid || bp.isWorking) return;
    await bp.start(requirement.trim());
  }

  return (
    <main className="mx-auto max-w-5xl px-7 py-16">
      <motion.header
        variants={rise}
        initial="hidden"
        animate="show"
        className="mb-8 flex items-end justify-between gap-4"
      >
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-accent2">
            Client need → delivered system
          </div>
          <h1 className="mt-3 font-serif text-4xl font-light tracking-tight sm:text-5xl">
            Delivery Studio
          </h1>
        </div>
        <nav className="flex items-center gap-4 font-mono text-[12px] text-ink3">
          <Link href="/boardroom" className="transition-colors hover:text-ink">boardroom</Link>
          <Link href="/projects" className="transition-colors hover:text-ink">projects</Link>
          <Link href="/freelance" className="transition-colors hover:text-ink">freelance</Link>
        </nav>
      </motion.header>

      {/* Requirement input */}
      <Surface elevation="raised" className="p-card">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink3">
          <span className={cn("h-1.5 w-1.5 rounded-full bg-accent2", bp.isWorking && "animate-pulse")} />
          what does the client need?
        </div>

        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && void submit()}
          rows={3}
          placeholder="Paste the client's request in their own words…  (⌘/Ctrl+Enter to design)"
          className="mt-3 w-full resize-y rounded-md border border-white/15 bg-base px-4 py-3 text-[14.5px] leading-relaxed text-ink outline-none placeholder:text-ink4 focus:border-accent2"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setRequirement(ex)}
              disabled={bp.isWorking}
              className="rounded-md border border-white/[0.1] px-2.5 py-1.5 text-left font-mono text-[10.5px] text-ink3 transition-colors hover:border-accent2/40 hover:text-ink"
            >
              {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
            </button>
          ))}
          <Button
            magnetic
            onClick={() => void submit()}
            disabled={!valid || bp.isWorking}
            className={cn("ml-auto px-5 py-2.5 text-[13px]", (!valid || bp.isWorking) && "opacity-50")}
          >
            {bp.isWorking ? "Designing…" : "Design the system"}
          </Button>
        </div>

        <AnimatePresence>
          {bp.isWorking && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 font-mono text-[11px] text-ink3"
              aria-live="polite"
            >
              {PHASE_LABEL[bp.phase] ?? "working…"}
            </motion.p>
          )}
        </AnimatePresence>

        {bp.phase === "error" && (
          <p className="mt-3 text-[12px] text-pink-400">{bp.errorMessage}</p>
        )}
      </Surface>

      {/* The blueprint */}
      <AnimatePresence>
        {bp.phase === "done" && bp.blueprint && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <BlueprintView
              blueprint={bp.blueprint}
              onCopy={() => {
                void navigator.clipboard.writeText(blueprintToMarkdown(bp.blueprint!));
                toast("Blueprint copied as Markdown — paste it to the client", "success");
              }}
              onCopyPost={() => {
                void navigator.clipboard.writeText(bp.blueprint!.postDraft);
                toast("Post draft copied — that's today's post done", "success");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {bp.phase === "idle" && (
        <p className="mt-6 text-center text-[13px] text-ink3">
          Every blueprint is priced two ways — as a service you deliver, and as a product you resell.
          The second client costs a fraction of the first.
        </p>
      )}
    </main>
  );
}

/* ── The deliverable ────────────────────────────────────────────────────── */

function BlueprintView({
  blueprint: b,
  onCopy,
  onCopyPost,
}: {
  blueprint: SolutionBlueprint;
  onCopy: () => void;
  onCopyPost: () => void;
}) {
  const totalDays = b.milestones.reduce((n, m) => n + m.days, 0);

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <Surface elevation="raised" className="border-accent2/25 p-card">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-serif text-xl text-ink">Solution Blueprint</span>
          <span
            className={cn(
              "rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.12em]",
              b.source === "model"
                ? "border-accent2/40 text-accent2"
                : "border-amber-300/40 text-amber-300",
            )}
          >
            {b.source === "model" ? "AI-designed" : "offline template — add a free key for bespoke design"}
          </span>
          <span className="ml-auto font-mono text-[10px] text-ink3">
            {totalDays}d build · ${b.costUsd.toFixed(4)} to design
          </span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink2">{b.understanding}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={onCopy} className="px-4 py-2 text-[12.5px]">Copy full blueprint</Button>
          <Button variant="ghost" onClick={onCopyPost} className="px-4 py-2 text-[12.5px]">
            Copy today&rsquo;s post
          </Button>
        </div>
      </Surface>

      {/* Agentic loop */}
      <Surface className="p-card">
        <SectionTitle>the agentic loop</SectionTitle>
        <motion.ol variants={chorus} initial="hidden" animate="show" className="mt-3 space-y-2">
          {b.agenticLoop.map((s, i) => (
            <motion.li key={`${s.role}-${i}`} variants={chorusItem}>
              <div className="flex items-start gap-3 rounded-lg border border-white/[0.07] bg-white/[0.025] px-4 py-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-accent to-accent2 font-mono text-[10px] font-bold text-accent-ink">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] text-ink">{s.role}</span>
                    <span className="rounded border border-white/[0.1] px-1.5 py-0.5 font-mono text-[9.5px] text-ink3">
                      {s.tool}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{s.action}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-ink4">→ {s.output}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Stack */}
        <Surface className="p-card">
          <SectionTitle>tech stack &amp; monthly cost</SectionTitle>
          <ul className="mt-3 space-y-2.5">
            {b.techStack.map((s) => (
              <li key={s.layer} className="border-b border-white/[0.05] pb-2.5 last:border-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink4">{s.layer}</span>
                  <span className="text-[13px] text-ink">{s.choice}</span>
                  <span className="ml-auto font-mono text-[10.5px] text-accent2">{s.monthlyCost}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink2">{s.why}</p>
              </li>
            ))}
          </ul>
        </Surface>

        {/* ML + risks */}
        <Surface className="p-card">
          <SectionTitle>ml / genai systems</SectionTitle>
          <ul className="mt-3 space-y-1.5">
            {b.mlSystems.map((m) => (
              <li key={m} className="text-[12.5px] text-ink2">
                <span className="text-accent2">▸</span> {m}
              </li>
            ))}
          </ul>
          <SectionTitle className="mt-5">risks</SectionTitle>
          <ul className="mt-3 space-y-1.5">
            {b.risks.map((r) => (
              <li key={r} className="text-[12.5px] text-ink2">
                <span className="text-amber-300">▲</span> {r}
              </li>
            ))}
          </ul>
        </Surface>
      </div>

      {/* Milestones + pricing */}
      <div className="grid gap-4 md:grid-cols-2">
        <Surface className="p-card">
          <SectionTitle>milestones</SectionTitle>
          <ul className="mt-3 space-y-2">
            {b.milestones.map((m) => (
              <li key={m.phase} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 rounded border border-white/[0.12] px-1.5 py-0.5 font-mono text-[9.5px] text-ink3">
                  {m.days}d
                </span>
                <span className="text-[12.5px] text-ink2">
                  <span className="text-ink">{m.phase}</span> — {m.deliverable}
                </span>
              </li>
            ))}
          </ul>
        </Surface>

        <Surface className="border-accent2/20 p-card">
          <SectionTitle>pricing</SectionTitle>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-center">
              <div className="font-serif text-2xl text-accent2">{b.pricing.serviceUsd}</div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink4">as a service</div>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3 text-center">
              <div className="font-serif text-2xl text-ink">{b.pricing.productUsd}</div>
              <div className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink4">as a product</div>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink2">{b.pricing.rationale}</p>
        </Surface>
      </div>

      {/* Post draft */}
      <Surface className="p-card">
        <SectionTitle>today&rsquo;s proof post</SectionTitle>
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink2">{b.postDraft}</p>
      </Surface>
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("font-mono text-[10px] uppercase tracking-[0.18em] text-ink3", className)}>
      {children}
    </div>
  );
}
